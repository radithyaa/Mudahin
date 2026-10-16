/**
 * Klien suara server-side (TTS & STT) berbasis Gemini.
 *
 * Mengapa perlu sisi server: WebView Android (yang dipakai APK Tauri) umumnya
 * **tidak** mengekspos `speechSynthesis` (TTS) maupun `SpeechRecognition` (STT).
 * Akibatnya tombol "Dengarkan"/"Bicara" tampak mati di perangkat mobile. Modul
 * ini memindahkan kedua kemampuan itu ke Worker, sehingga aplikasi mobile
 * mendapat suara sungguhan tanpa bergantung pada mesin suara perangkat.
 *
 * Kontrak penting terkait F3: Aturan Teknis §12 menetapkan DeepSeek untuk semua
 * fitur **teks** dan Gemini **hanya** untuk audio/gambar (OCR). Suara bukan teks,
 * jadi TTS/STT memakai jalur Gemini yang sama — pemisahan provider tetap utuh.
 *
 * Modul ini **tidak** memvalidasi Zod; itu tugas `routers/speech.ts`. Ia hanya
 * bertanggung jawab memanggil HTTP dengan benar + membatasi waktu.
 */

import { AiError } from "./ai";

/** Endpoint asli Gemini (bukan jalur OpenAI-compatible) untuk audio. */
export const GEMINI_NATIVE_BASE_URL =
  "https://generativelanguage.googleapis.com/v1beta";

/** Model TTS Gemini. */
export const GEMINI_TTS_MODEL = "gemini-2.5-flash-preview-tts";

/** Model STT Gemini (audio → teks). */
export const GEMINI_STT_MODEL = "gemini-2.5-flash";

/** Suara TTS bawaan Gemini (Bahasa Indonesia memakai suara yang sama). */
export const GEMINI_TTS_VOICE = "Kore";

/** Audio TTS cukup cepat; 12 detik memberi ruang untuk kalimat panjang. */
export const GEMINI_TTS_TIMEOUT_MS = 12_000;

/** Transkripsi audio bisa lebih lama dari TTS karena payload lebih besar. */
export const GEMINI_STT_TIMEOUT_MS = 20_000;

/** Batas karakter teks yang dibacakan sekali jalan (menjaga biaya & latensi). */
export const TTS_MAX_CHARS = 1500;

/**
 * Batas ukuran audio untuk STT (~3 MB). Klip 30 detik pada 32 kbps ≈ 120 KB,
 * jadi batas ini sangat longgar namun tetap melindungi Worker dari payload raksasa.
 */
export const STT_MAX_BYTES = 3_000_000;

const TRAILING_SLASH = /\/$/;

/** Data URL base64 generik: `data:<mime>[;param...];base64,<isi>`. */
const DATA_URL_PATTERN = /^data:([^;]+)(?:;[^,]*)?;base64,(.+)$/;

export interface GeminiAudioConfig {
  apiKey: string;
  baseUrl: string;
}

/** Bagian audio yang dikirim sebagai `inline_data` ke Gemini. */
export interface AudioPart {
  /** Isi audio dalam base64 (tanpa awalan data URL). */
  base64: string;
  /** MIME type hasil rekaman, mis. `audio/webm`. */
  mimeType: string;
}

/**
 * Membuang awalan `data:<mime>;base64,` dan mengembalikan mime + isinya.
 *
 * Parameter codec dibuang karena Gemini hanya menerima jenis media dasar
 * (`audio/webm`), bukan `audio/webm;codecs=opus` hasil `MediaRecorder`.
 */
export function parseDataUrl(dataUrl: string): AudioPart {
  const match = DATA_URL_PATTERN.exec(dataUrl);
  if (!(match?.[1] && match[2])) {
    throw new AiError(
      "http",
      "gemini",
      "Audio harus dikirim sebagai data URL base64."
    );
  }
  return { mimeType: match[1], base64: match[2] };
}

/** Mengubah base64 menjadi byte dengan aman (tanpa `Buffer` — target Workers). */
function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

/** Mengubah byte menjadi base64 (tanpa `Buffer` — target Workers). */
export function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

interface GeminiErrorBody {
  error?: { message?: string };
}

/** Mengubah respons gagal Gemini menjadi `AiError` yang deskriptif. */
async function toHttpError(
  response: Response,
  label: string
): Promise<AiError> {
  let detail = "";
  try {
    const body = (await response.json()) as GeminiErrorBody;
    detail = body.error?.message ? `: ${body.error.message}` : "";
  } catch {
    detail = "";
  }
  return new AiError(
    "http",
    "gemini",
    `${label} mengembalikan HTTP ${response.status}${detail}`
  );
}

/**
 * Menjalankan permintaan ke Gemini dengan timeout + satu kali retry untuk
 * kegagalan yang bersifat sementara (timeout / jaringan / 5xx / 429).
 */
async function requestWithRetry(
  run: (signal: AbortSignal) => Promise<Response>,
  timeoutMs: number,
  label: string,
  externalSignal?: AbortSignal
): Promise<Response> {
  const attempt = async (): Promise<Response | AiError> => {
    const timeoutSignal = AbortSignal.timeout(timeoutMs);
    const signal = externalSignal
      ? AbortSignal.any([externalSignal, timeoutSignal])
      : timeoutSignal;
    try {
      const response = await run(signal);
      if (!response.ok) {
        const error = await toHttpError(response, label);
        return error;
      }
      return response;
    } catch (error) {
      if (timeoutSignal.aborted) {
        return new AiError(
          "timeout",
          "gemini",
          `${label} melebihi batas waktu ${Math.round(timeoutMs / 1000)} detik`,
          { cause: error }
        );
      }
      if (error instanceof TypeError) {
        // Kegagalan jaringan — layak dicoba ulang.
        return new AiError("http", "gemini", `${label} gagal dihubungi.`, {
          cause: error,
        });
      }
      throw error;
    }
  };

  const first = await attempt();
  if (!(first instanceof AiError)) {
    return first;
  }
  if (first.kind === "timeout" || first.kind === "http") {
    const second = await attempt();
    if (!(second instanceof AiError)) {
      return second;
    }
    throw second;
  }
  throw first;
}

/** Menyusun URL endpoint Gemini native sesuai base URL yang dikonfigurasi. */
function endpoint(config: GeminiAudioConfig, path: string): string {
  return `${config.baseUrl.replace(TRAILING_SLASH, "")}${path}`;
}

/**
 * Menyintesis teks menjadi suara (TTS) dan mengembalikan audio WAV.
 *
 * Gemini mengembalikan PCM 16-bit little-endian mono 24 kHz mentah, jadi kita
 * menambahkan header WAV di sini agar hasilnya bisa langsung diputar
 * `new Audio(...)` di semua peramban/WebView tanpa decoding manual.
 */
export async function synthesizeSpeech(
  config: GeminiAudioConfig,
  text: string,
  signal?: AbortSignal
): Promise<{ audio: Uint8Array; mimeType: string }> {
  if (!config.apiKey) {
    throw new AiError(
      "disabled",
      "gemini",
      "GEMINI_API_KEY belum dikonfigurasi"
    );
  }

  const label = "Gemini TTS";
  const response = await requestWithRetry(
    (innerSignal) =>
      fetch(
        endpoint(
          config,
          `/models/${GEMINI_TTS_MODEL}:generateContent?key=${config.apiKey}`
        ),
        {
          body: JSON.stringify({
            contents: [{ parts: [{ text }], role: "user" }],
            generationConfig: {
              responseModalities: ["AUDIO"],
              speechConfig: {
                voiceConfig: {
                  prebuiltVoiceConfig: { voiceName: GEMINI_TTS_VOICE },
                },
              },
            },
          }),
          headers: { "Content-Type": "application/json" },
          method: "POST",
          signal: innerSignal,
        }
      ),
    GEMINI_TTS_TIMEOUT_MS,
    label,
    signal
  );

  const data = (await response.json()) as {
    candidates?: {
      content?: {
        parts?: { inlineData?: { data?: string; mimeType?: string } }[];
      };
    }[];
  };

  const inlineData = data.candidates?.[0]?.content?.parts?.find(
    (part) => part.inlineData?.data
  )?.inlineData;

  if (!inlineData?.data) {
    throw new AiError("empty", "gemini", `${label} tidak menghasilkan audio`);
  }

  const pcm = base64ToBytes(inlineData.data);
  const wav = pcmToWav(pcm, parseSampleRate(inlineData.mimeType));
  return { audio: wav, mimeType: "audio/wav" };
}

const SAMPLE_RATE_PATTERN = /rate=(\d+)/;

/** Membaca sample rate dari mime type Gemini, dengan default 24 kHz. */
function parseSampleRate(mimeType?: string): number {
  const match = SAMPLE_RATE_PATTERN.exec(mimeType ?? "");
  const rate = match?.[1] ? Number.parseInt(match[1], 10) : Number.NaN;
  return Number.isFinite(rate) && rate > 0 ? rate : 24_000;
}

const WAV_HEADER_BYTES = 44;

/**
 * Membungkus PCM 16-bit mono menjadi berkas WAV.
 * Header ditulis manual agar tidak menambah dependensi di Worker.
 */
export function pcmToWav(pcm: Uint8Array, sampleRate = 24_000): Uint8Array {
  const channels = 1;
  const bitsPerSample = 16;
  const byteRate = (sampleRate * channels * bitsPerSample) / 8;
  const blockAlign = (channels * bitsPerSample) / 8;

  const header = new ArrayBuffer(WAV_HEADER_BYTES);
  const view = new DataView(header);
  const writeAscii = (offset: number, value: string) => {
    for (let index = 0; index < value.length; index += 1) {
      view.setUint8(offset + index, value.charCodeAt(index));
    }
  };

  writeAscii(0, "RIFF");
  view.setUint32(4, 36 + pcm.length, true);
  writeAscii(8, "WAVE");
  writeAscii(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, channels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);
  writeAscii(36, "data");
  view.setUint32(40, pcm.length, true);

  const output = new Uint8Array(WAV_HEADER_BYTES + pcm.length);
  output.set(new Uint8Array(header), 0);
  output.set(pcm, WAV_HEADER_BYTES);
  return output;
}

/**
 * Mengubah rekaman suara menjadi teks (STT) memakai Gemini.
 *
 * Prompt sengaja meminta salinan apa adanya agar nama istilah dan angka tidak
 * "diperbaiki" model — siswa perlu melihat ucapannya sendiri.
 */
export async function transcribeSpeech(
  config: GeminiAudioConfig,
  audio: AudioPart,
  signal?: AbortSignal
): Promise<string> {
  if (!config.apiKey) {
    throw new AiError(
      "disabled",
      "gemini",
      "GEMINI_API_KEY belum dikonfigurasi"
    );
  }

  // Validasi isi base64 lebih awal agar payload rusak bergagal dengan pesan jelas.
  validateBase64(audio.base64);

  const label = "Gemini STT";
  const response = await requestWithRetry(
    (innerSignal) =>
      fetch(
        endpoint(
          config,
          `/models/${GEMINI_STT_MODEL}:generateContent?key=${config.apiKey}`
        ),
        {
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: "Transkripsikan rekaman suara ini ke dalam teks Bahasa Indonesia. Tulis persis apa yang diucapkan. Perbaiki hanya ejaan agar baku, tanpa menambah atau mengurangi isi. Jika tidak ada suara yang terdengar, balas dengan tepat: (tidak ada suara)",
                  },
                  {
                    inline_data: {
                      data: audio.base64,
                      mime_type: audio.mimeType,
                    },
                  },
                ],
                role: "user",
              },
            ],
          }),
          headers: { "Content-Type": "application/json" },
          method: "POST",
          signal: innerSignal,
        }
      ),
    GEMINI_STT_TIMEOUT_MS,
    label,
    signal
  );

  const data = (await response.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };

  const text = (data.candidates?.[0]?.content?.parts ?? [])
    .map((part) => part.text ?? "")
    .join("")
    .trim();

  if (text.length === 0) {
    throw new AiError("empty", "gemini", `${label} tidak menghasilkan teks`);
  }

  return text;
}

/**
 * Memvalidasi bahwa string benar-benar base64 dan mengembalikan panjang byte-nya.
 *
 * Rekaman diteruskan apa adanya ke Gemini (tanpa enkode ulang), tetapi isinya
 * tetap diperiksa lebih awal supaya payload rusak gagal dengan pesan jelas.
 */
function validateBase64(base64: string): number {
  return decodeBase64(base64).length;
}

const BASE64_PATTERN = /^[A-Za-z0-9+/]*={0,2}$/;

/** Mendekode base64 menjadi byte, melempar `AiError` bila isinya tidak valid. */
export function decodeBase64(base64: string): Uint8Array {
  if (base64.length === 0 || !BASE64_PATTERN.test(base64)) {
    throw new AiError("parse", "gemini", "Rekaman suara tidak valid.");
  }
  try {
    return base64ToBytes(base64);
  } catch (error) {
    // biome-ignore lint/style/useErrorCause: AiError menerima `cause` di ErrorOptions; rule belum mengenali kelas ini.
    throw new AiError("parse", "gemini", "Rekaman suara tidak valid.", {
      cause: error,
    });
  }
}
