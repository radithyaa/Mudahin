import { TRPC_URL } from "./env";
import { hasSpeechSynthesis, isLikelyTtsUnsupported } from "./speech-support";

/**
 * Mesin Text-to-Speech dengan **fallback server-side**.
 *
 * Kenapa ada dua jalur:
 * - **Web Speech API** (`speechSynthesis`) dipakai lebih dulu bila tersedia —
 *   gratis, instan, dan tanpa jaringan. Ini jalur utama di desktop & iOS.
 * - **Server (Gemini TTS lewat `speech.synthesize`)** dipakai saat perangkat
 *   tidak punya mesin suara. WebView Android — dasar APK Tauri — umumnya tidak
 *   mengekspos `speechSynthesis`, sehingga sebelumnya tombol suara tampak mati.
 *   Audio hasil server diputar lewat `<audio>`, yang **selalu** didukung WebView.
 *
 * Semua konsumen (`speakText`, tombol "Dengarkan", narasi paragraf) memakai satu
 * antrean di sini agar ucapan tidak pernah tumpang tindih.
 */

/** Batas karakter yang dikirim ke server — samakan dengan skema backend. */
const TTS_MAX_CHARS = 1500;

/**
 * Batas toleransi (ms) menunggu ucapan Web Speech benar-benar mulai.
 *
 * Mesin suara yang rusak/tanpa voice mengembalikan `speak()` tanpa error dan
 * tanpa memicu `onstart`/`onend` — watchdog ini mencegah UI menggantung.
 */
const SPEECH_START_TIMEOUT_MS = 1200;

/** Batas (ms) menunggu audio server; server sendiri timeout 12 detik. */
const SERVER_SPEECH_TIMEOUT_MS = 20_000;

/** Rentetan TTS aktif — mencegah callback pemutaran lama menimpa yang baru. */
let speakSeq = 0;

let currentAudio: HTMLAudioElement | null = null;

/** Menandai ucapan server pernah gagal agar percobaan berikutnya tak menunggu. */
let serverTtsDisabled = false;

export interface SpeakOptions {
  /** Dipanggil saat ucapan selesai, dibatalkan, atau gagal. */
  onEnd?: () => void;
  /** Kecepatan bicara (`0.5`–`2`). */
  rate?: number;
}

/**
 * Pemutaran audio dari sumber yang bisa berubah.
 *
 * Objek audio dibuat **per pemutaran** (bukan elemen global yang `src`-nya
 * ditimpa), sehingga `stopSpeech()` selalu bisa menghentikan audio milik
 * pemutaran yang sedang berjalan tanpa balapan dengan pemutaran berikutnya.
 */
function stopCurrentAudio(): void {
  if (!currentAudio) {
    return;
  }
  const audio = currentAudio;
  currentAudio = null;
  try {
    audio.pause();
    audio.src = "";
  } catch {
    // Elemen audio yang sudah dilepas — tidak ada yang perlu dibersihkan.
  }
}

/** Membatalkan seluruh antrean ucapan (lokal maupun server). */
export function stopSpeech(): void {
  speakSeq += 1;
  stopCurrentAudio();
  if (hasSpeechSynthesis()) {
    try {
      window.speechSynthesis.cancel();
    } catch {
      // Mesin suara mungkin sudah hilang — abaikan.
    }
  }
}

/** Memilih suara Bahasa Indonesia bila perangkat menyediakannya. */
const INDONESIAN_VOICE = /^id(-|_)?/i;

export function pickVoice(
  voices: SpeechSynthesisVoice[]
): SpeechSynthesisVoice | null {
  return (
    voices.find((voice) => INDONESIAN_VOICE.test(voice.lang)) ??
    voices.find((voice) => voice.lang.toLowerCase().includes("id")) ??
    null
  );
}

/** Dipanggil sekali agar ucapan pertama di iOS/Android langsung terdengar. */
let primed = false;
function ensurePrimed(voices: SpeechSynthesisVoice[]): void {
  if (primed || voices.length === 0) {
    return;
  }
  primed = true;
  // Bug WebKit/Chromium: utterance pertama kadang bisu. "Memancing" dengan
  // utterance volume 0 membuat pembacaan berikutnya berbunyi.
  try {
    const primer = new SpeechSynthesisUtterance(" ");
    primer.volume = 0;
    window.speechSynthesis.speak(primer);
  } catch {
    // Bukan kegagalan fatal.
  }
}

/** Memutuskan apakah platform ini sebaiknya memakai suara server langsung. */
export function shouldPreferServerTts(): boolean {
  if (serverTtsDisabled) {
    return true;
  }
  // WebView Android & cangkang Tauri: `speechSynthesis` mungkin ada tapi bisu.
  return !hasSpeechSynthesis() || isLikelyTtsUnsupported();
}

/**
 * Membacakan teks: Web Speech API dulu, jatuh ke server bila perangkat tidak
 * mampu. `onEnd` **selalu** dipanggil tepat sekali apa pun yang terjadi.
 */
export function speakText(
  text: string,
  rateOrOptions?: number | SpeakOptions,
  legacyOnEnd?: () => void
): void {
  const options: SpeakOptions =
    typeof rateOrOptions === "number" || rateOrOptions === undefined
      ? { onEnd: legacyOnEnd, rate: rateOrOptions ?? 0.95 }
      : rateOrOptions;

  const trimmed = text.trim();
  if (trimmed.length === 0) {
    options.onEnd?.();
    return;
  }

  // Hentikan ucapan sebelumnya sebelum mulai — asumsi lama `speakText` yang
  // diandalkan pemanggil (mis. narasi berantai) agar tidak ada suara bertumpuk.
  stopSpeech();

  if (shouldPreferServerTts()) {
    speakViaServer(trimmed, options);
    return;
  }

  speakViaWebSpeech(trimmed, options.rate ?? 0.95, options.onEnd);
}

/** Menutup satu ucapan tepat sekali, dan hanya bila belum digantikan. */
function createFinisher(seq: number, onEnd?: () => void): () => void {
  let finished = false;
  return () => {
    if (finished || seq !== speakSeq) {
      return;
    }
    finished = true;
    onEnd?.();
  };
}

/** Jalur Web Speech API (perangkat dengan mesin suara). */
function speakViaWebSpeech(
  text: string,
  rate: number,
  onEnd?: () => void
): void {
  if (!hasSpeechSynthesis()) {
    // Tidak ada mesin suara sama sekali — UI harus tetap bernapas.
    onEnd?.();
    return;
  }

  const synthesis = window.speechSynthesis;
  speakSeq += 1;
  const seq = speakSeq;
  const finish = createFinisher(seq, onEnd);
  const safeRate = Math.min(2, Math.max(0.5, rate));

  let started = false;
  let watchdog: ReturnType<typeof globalThis.setTimeout> | undefined;

  const speakWithVoice = () => {
    if (seq !== speakSeq) {
      finish();
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "id-ID";
    utterance.rate = safeRate;
    utterance.pitch = 1;
    utterance.volume = 1;

    const voice = pickVoice(synthesis.getVoices());
    if (voice) {
      utterance.voice = voice;
      utterance.lang = voice.lang;
    }

    utterance.onstart = () => {
      started = true;
      if (watchdog !== undefined) {
        globalThis.clearTimeout(watchdog);
      }
    };
    utterance.onend = finish;
    utterance.onerror = finish;

    watchdog = globalThis.setTimeout(() => {
      if (!started) {
        finish();
      }
    }, SPEECH_START_TIMEOUT_MS);

    try {
      synthesis.speak(utterance);
      // Bug lama Chrome/Android: mesin suara kadang langsung "paused".
      synthesis.resume();
    } catch {
      finish();
    }
  };

  const voices = synthesis.getVoices();
  if (voices.length > 0) {
    ensurePrimed(voices);
    speakWithVoice();
    return;
  }

  // Daftar suara belum siap (umum di Android pada pemanggilan pertama).
  let settled = false;
  const voiceWaitTimer = globalThis.setTimeout(start, 600);

  function start() {
    if (settled) {
      return;
    }
    settled = true;
    globalThis.clearTimeout(voiceWaitTimer);
    synthesis.removeEventListener("voiceschanged", start);
    ensurePrimed(synthesis.getVoices());
    speakWithVoice();
  }

  synthesis.addEventListener("voiceschanged", start);
}

/** Memutar audio hasil TTS server (WAV base64) lewat elemen `<audio>`. */
async function playAudioDataUrl(
  dataUrl: string,
  seq: number,
  onEnd?: () => void
): Promise<void> {
  const finish = createFinisher(seq, onEnd);
  if (seq !== speakSeq) {
    finish();
    return;
  }

  const audio = new Audio(dataUrl);
  audio.preload = "auto";
  currentAudio = audio;
  audio.onended = () => {
    if (currentAudio === audio) {
      currentAudio = null;
    }
    finish();
  };
  audio.onerror = finish;

  // Watchdog: audio yang tak pernah mulai (mis. data rusak) tidak boleh
  // menggantung rantai narasi.
  const watchdog = globalThis.setTimeout(() => {
    if (seq === speakSeq) {
      stopCurrentAudio();
      finish();
    }
  }, SERVER_SPEECH_TIMEOUT_MS);

  try {
    await audio.play();
  } catch {
    globalThis.clearTimeout(watchdog);
    finish();
    return;
  }
  globalThis.clearTimeout(watchdog);
}

/**
 * Meminta suara dari server (`speech.synthesize`) lalu memutarnya.
 *
 * Memakai `fetch` langsung ke endpoint tRPC (bukan klien tRPC) karena tRPC tidak
 * mengembalikan respons biner dan kita hanya butuh satu aksi fire-and-forget
 * dengan callback `onEnd` — bukan cache React Query.
 */
function speakViaServer(text: string, options: SpeakOptions): void {
  speakSeq += 1;
  const seq = speakSeq;
  const finish = createFinisher(seq, options.onEnd);

  const controller = new AbortController();
  const watchdog = globalThis.setTimeout(() => {
    controller.abort();
    finish();
  }, SERVER_SPEECH_TIMEOUT_MS);

  const settle = () => {
    globalThis.clearTimeout(watchdog);
  };

  fetch(`${TRPC_URL}/speech.synthesize`, {
    body: JSON.stringify({
      json: {
        rate: options.rate,
        text: text.slice(0, TTS_MAX_CHARS),
      },
    }),
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    method: "POST",
    signal: controller.signal,
  })
    .then(async (response) => {
      if (!response.ok) {
        throw new Error(`TTS server gagal (HTTP ${response.status})`);
      }
      const envelope = (await response.json()) as {
        result?: { data?: { audioDataUrl?: string } };
      };
      const audioDataUrl = envelope.result?.data?.audioDataUrl;
      if (!audioDataUrl) {
        throw new Error("TTS server tidak mengembalikan audio");
      }
      await playAudioDataUrl(audioDataUrl, seq, options.onEnd);
    })
    .catch(() => {
      // Server suara tidak bisa diandalkan lagi — jangan ulangi tiap klik.
      serverTtsDisabled = true;
      finish();
    })
    .finally(settle);
}

/** Membacakan satu per satu daftar teks secara berurutan. */
export function speakSequence(
  parts: string[],
  rate: number,
  onDone?: () => void
): void {
  const queue = parts.map((part) => part.trim()).filter(Boolean);
  if (queue.length === 0) {
    onDone?.();
    return;
  }

  const playNext = (index: number) => {
    if (index >= queue.length) {
      onDone?.();
      return;
    }
    speakText(queue[index], rate, () => playNext(index + 1));
  };

  playNext(0);
}
