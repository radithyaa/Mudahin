/**
 * Deteksi kemampuan & kendala platform untuk fitur suara (TTS/STT).
 *
 * Mengapa dipisah dari `audio.ts`: logika ini murni (tanpa DOM saat diuji),
 * dipakai bersama oleh TTS (`speakText`), UI (menampilkan pesan status), dan
 * dapat diverifikasi lewat `scripts/verify-tts.ts`.
 */

/**
 * Mengembalikan platform user agent bila bisa dibaca, atau string kosong.
 * Dibungkus `try/catch` karena sebagian WebView membatasi akses ini.
 */
function readUserAgent(): string {
  try {
    return navigator.userAgent ?? "";
  } catch {
    return "";
  }
}

/** Apakah string user agent tertentu menandakan cangkang Tauri. */
export function isTauriUserAgent(userAgent: string): boolean {
  return userAgent.includes("Tauri") || userAgent.includes("tauri");
}

/** Apakah aplikasi berjalan sebagai aplikasi asli (Tauri Android/iOS/desktop)? */
export function isNativeShell(): boolean {
  return isTauriUserAgent(readUserAgent());
}

/**
 * Apakah platform kemungkinan besar **tidak** menyediakan mesin suara
 * `SpeechSynthesis`.
 *
 * WebView Android (yang dipakai Tauri) tidak mengekspos `speechSynthesis`,
 * sehingga tombol "Dengarkan"/"Bacakan" tampak mati di APK mobile. Deteksi ini
 * membuat UI dapat menampilkan penjelasan + jalur cadangan, bukan tombol mati.
 */
export function isLikelyTtsUnsupported(userAgent?: string): boolean {
  const ua = userAgent ?? readUserAgent();
  if (!ua.includes("Android")) {
    return false;
  }
  // WebView Android ("...; wv)") maupun cangkang Tauri Android sama-sama tidak
  // mengekspos mesin suara sistem pada banyak perangkat.
  return ua.includes("; wv") || isTauriUserAgent(ua);
}

/** Apakah `SpeechSynthesis` benar-benar ada di lingkungan saat ini. */
export function hasSpeechSynthesis(): boolean {
  return (
    typeof window !== "undefined" &&
    "speechSynthesis" in window &&
    typeof window.speechSynthesis?.speak === "function"
  );
}

/**
 * Apakah pembacaan suara **dapat dipakai** di lingkungan ini.
 *
 * Sejak TTS punya fallback server (`lib/speech.ts` → `speech.synthesize`),
 * tombol suara tidak lagi dinonaktifkan hanya karena perangkat tidak punya
 * mesin suara. Fungsi ini tetap disediakan untuk kasus yang memang tidak bisa
 * ditolong sama sekali (mis. peramban tanpa `Audio`).
 */
export function canSpeakText(): boolean {
  if (hasSpeechSynthesis()) {
    return true;
  }
  return typeof window !== "undefined" && typeof window.Audio === "function";
}

/**
 * Apakah perekaman suara dapat dipakai (dasar latihan "Jawab dengan Suara").
 *
 * Latihan lisan membutuhkan **mikrofon**, bukan mesin suara: Web Speech API bila
 * ada, atau `MediaRecorder` untuk jalur server-side. Karena itu pemeriksaannya
 * terpisah dari `canSpeakText` — dulu tombol lisan keliru dinonaktifkan di mobile
 * hanya karena `speechSynthesis` tidak tersedia.
 */
export function canRecordSpeech(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  const hasRecognition =
    "SpeechRecognition" in window || "webkitSpeechRecognition" in window;
  const hasRecorder =
    "MediaRecorder" in window &&
    typeof navigator.mediaDevices?.getUserMedia === "function";

  return hasRecognition || hasRecorder;
}

/** Pesan ramah saat pembacaan suara tidak tersedia di perangkat pengguna. */
export const TTS_UNAVAILABLE_MESSAGE =
  "Pembacaan suara belum tersedia di perangkat ini. Di Android, pasang “Speech Recognition & Synthesis” (Google) lalu buka kembali aplikasi; di peramban desktop fitur ini langsung aktif.";
