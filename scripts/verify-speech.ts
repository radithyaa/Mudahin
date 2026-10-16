import {
  decodeBase64,
  GEMINI_STT_MODEL,
  GEMINI_TTS_MODEL,
  parseDataUrl,
  pcmToWav,
} from "../packages/api/src/audio";
import {
  synthesizeSpeechInputSchema,
  transcribeSpeechInputSchema,
} from "../packages/api/src/schemas";

/**
 * Verifikasi fitur suara **server-side** (TTS/STT) — jalur yang dipakai APK
 * mobile ketika WebView tidak punya mesin suara perangkat.
 *
 * Yang diuji adalah logika murni tanpa jaringan: pembentukan berkas WAV dari PCM
 * mentah Gemini, penjagaan format data URL, dan kontrak Zod kedua endpoint.
 */

let pass = 0;
let fail = 0;
const check = (name: string, cond: boolean) => {
  if (cond) {
    pass += 1;
    console.log("  ok:", name);
  } else {
    fail += 1;
    console.log("  FAIL:", name);
  }
};

const readAscii = (bytes: Uint8Array, start: number, length: number) =>
  String.fromCharCode(...bytes.slice(start, start + length));

const view = (bytes: Uint8Array) =>
  new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);

// --- PCM → WAV -------------------------------------------------------------
{
  const pcm = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]);
  const wav = pcmToWav(pcm, 24_000);

  check("wav punya header RIFF", readAscii(wav, 0, 4) === "RIFF");
  check("wav punya penanda WAVE", readAscii(wav, 8, 4) === "WAVE");
  check("wav punya bagian fmt", readAscii(wav, 12, 4) === "fmt ");
  check("wav punya bagian data", readAscii(wav, 36, 4) === "data");

  const dv = view(wav);
  check("format PCM (1)", dv.getUint16(20, true) === 1);
  check("mono (1 kanal)", dv.getUint16(22, true) === 1);
  check("sample rate 24 kHz", dv.getUint32(24, true) === 24_000);
  check("bit depth 16", dv.getUint16(34, true) === 16);
  check("ukuran data = panjang PCM", dv.getUint32(40, true) === pcm.length);
  check(
    "ukuran RIFF mengikuti panjang data",
    dv.getUint32(4, true) === 36 + pcm.length
  );
  check("total berkas = 44 + data", wav.length === 44 + pcm.length);
  check(
    "isi PCM disalin apa adanya",
    wav.slice(44).every((byte, index) => byte === pcm[index])
  );

  // Header harus tetap benar untuk sample rate lain (mis. 48 kHz).
  const wav48 = pcmToWav(new Uint8Array(4), 48_000);
  check(
    "sample rate 48 kHz terbaca",
    view(wav48).getUint32(24, true) === 48_000
  );
  check(
    "byte rate = rate * kanal * bit/8",
    view(wav48).getUint32(28, true) === 48_000 * 2
  );
}

// --- Parsing data URL audio ------------------------------------------------
{
  const parsed = parseDataUrl("data:audio/webm;codecs=opus;base64,AAEC");
  check(
    "mime type membaca jenis media dasar",
    parsed.mimeType === "audio/webm"
  );
  check("base64 terbaca tanpa awalan", parsed.base64 === "AAEC");

  let threw = false;
  try {
    // Bukan data URL base64 → harus ditolak (bukan diam-diam diteruskan).
    parseDataUrl("AAEC");
  } catch {
    threw = true;
  }
  check("data URL tanpa awalan ditolak", threw);

  threw = false;
  try {
    // Data URL non-audio tetap lolos lapisan ini (pembatasan jenis media ada di
    // skema Zod `transcribeSpeechInputSchema`), jadi tidak boleh melempar.
    parseDataUrl("data:text/plain;base64,aGVsbG8=");
  } catch {
    threw = true;
  }
  check("data URL non-audio tetap terurai", !threw);
}

// --- Validasi base64 -------------------------------------------------------
{
  check("base64 valid terdekode", decodeBase64("AAEC").length === 3);
  let threw = false;
  try {
    decodeBase64("bukan base64!!");
  } catch {
    threw = true;
  }
  check("base64 rusak ditolak", threw);

  let empty = false;
  try {
    decodeBase64("");
  } catch {
    empty = true;
  }
  check("base64 kosong ditolak", empty);
}

// --- Kontrak Zod endpoint suara --------------------------------------------
{
  check(
    "tts menerima teks biasa",
    synthesizeSpeechInputSchema.safeParse({ text: "Halo teman!" }).success
  );
  check(
    "tts menolak teks kosong",
    !synthesizeSpeechInputSchema.safeParse({ text: "" }).success
  );
  check(
    "tts menolak teks > 1500 karakter",
    !synthesizeSpeechInputSchema.safeParse({ text: "a".repeat(1501) }).success
  );
  check(
    "tts menerima kecepatan wajar",
    synthesizeSpeechInputSchema.safeParse({ rate: 1.25, text: "Halo" }).success
  );
  check(
    "tts menolak kecepatan ekstrem",
    !synthesizeSpeechInputSchema.safeParse({ rate: 5, text: "Halo" }).success
  );

  const AUDIO_OK = "data:audio/webm;codecs=opus;base64,AAEC";
  check(
    "stt menerima audio webm",
    transcribeSpeechInputSchema.safeParse({ audioDataUrl: AUDIO_OK }).success
  );
  check(
    "stt menolak data URL gambar",
    !transcribeSpeechInputSchema.safeParse({
      audioDataUrl: "data:image/png;base64,AAEC",
    }).success
  );
  check(
    "stt menolak rekaman kosong",
    !transcribeSpeechInputSchema.safeParse({ audioDataUrl: "" }).success
  );
}

// --- Model Gemini yang dipakai ---------------------------------------------
check("model TTS adalah varian preview-tts", GEMINI_TTS_MODEL.includes("tts"));
check("model STT memakai flash", GEMINI_STT_MODEL.includes("flash"));

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
