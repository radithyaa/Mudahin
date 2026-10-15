import {
  canSpeakText,
  hasSpeechSynthesis,
  isLikelyTtsUnsupported,
} from "./speech-support";

/**
 * Diagnostik kemampuan suara perangkat.
 *
 * Dipakai layar Aksesibilitas untuk memberi tahu pengguna secara jujur apa yang
 * tersedia di perangkatnya — bukan sekadar tombol yang diam. Berguna juga saat
 * melaporkan bug: cukup lihat baris ringkasannya.
 */
export interface SpeechDiagnostics {
  /** Platform diperkirakan tidak mendukung TTS (WebView Android). */
  platformLikelyUnsupported: boolean;
  /** Mesin pengenal suara (STT) tersedia di perangkat. */
  sttAvailable: boolean;
  /** Rekaman bisa dikirim ke server untuk dikenali (MediaRecorder + Gemini). */
  sttServerFallback: boolean;
  /** `SpeechSynthesis` ada dan dapat dipanggil. */
  ttsAvailable: boolean;
  /** Ada setidaknya satu suara Bahasa Indonesia. */
  ttsHasIndonesianVoice: boolean;
  /** Suara server (Gemini TTS) bisa dipakai sebagai pengganti. */
  ttsServerFallback: boolean;
  /** Jumlah suara (voice) yang terpasang di mesin suara. */
  ttsVoiceCount: number;
}

/** Mengumpulkan diagnostik kemampuan suara dari lingkungan saat ini. */
export function collectSpeechDiagnostics(): SpeechDiagnostics {
  const ttsAvailable = hasSpeechSynthesis();
  let voices: SpeechSynthesisVoice[] = [];
  if (ttsAvailable) {
    try {
      voices = window.speechSynthesis.getVoices();
    } catch {
      voices = [];
    }
  }

  const sttAvailable =
    typeof window !== "undefined" &&
    ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

  return {
    ttsAvailable,
    ttsVoiceCount: voices.length,
    ttsHasIndonesianVoice: voices.some((voice) =>
      voice.lang.toLowerCase().startsWith("id")
    ),
    ttsServerFallback: canSpeakText(),
    sttAvailable,
    sttServerFallback: hasMediaRecorder(),
    platformLikelyUnsupported: isLikelyTtsUnsupported(),
  };
}

/** Apakah perangkat bisa merekam suara (dasar jalur STT server). */
function hasMediaRecorder(): boolean {
  return (
    typeof window !== "undefined" &&
    "MediaRecorder" in window &&
    typeof navigator.mediaDevices?.getUserMedia === "function"
  );
}

/**
 * Ringkasan satu baris untuk ditampilkan di UI / dilaporkan saat ada masalah.
 *
 * Penting untuk jujur soal **jalur** yang dipakai: mesin suara perangkat bisa
 * tidak ada di WebView Android, namun aplikasi tetap punya suara lewat server.
 * Contoh: "Suara: mesin perangkat (12 voice, ID ✓) · Perekam: perangkat".
 */
export function describeSpeechDiagnostics(
  diagnostics: SpeechDiagnostics
): string {
  return `${describeTts(diagnostics)} · ${describeStt(diagnostics)}`;
}

/** Keterangan jalur TTS yang benar-benar tersedia. */
function describeTts(diagnostics: SpeechDiagnostics): string {
  if (diagnostics.ttsAvailable) {
    const voice = diagnostics.ttsHasIndonesianVoice ? "ID ✓" : "ID ✗";
    return `Suara: mesin perangkat (${diagnostics.ttsVoiceCount} voice, ${voice})`;
  }
  if (diagnostics.ttsServerFallback) {
    return "Suara: server (otomatis saat perangkat tidak punya mesin suara)";
  }
  return "Suara: tidak tersedia";
}

/** Keterangan jalur STT yang benar-benar tersedia. */
function describeStt(diagnostics: SpeechDiagnostics): string {
  if (diagnostics.sttAvailable) {
    return "Perekam: perangkat";
  }
  if (diagnostics.sttServerFallback) {
    return "Perekam: server (rekam lalu dikenali di server)";
  }
  return "Perekam: tidak tersedia";
}
