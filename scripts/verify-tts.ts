import { speechErrorMessage } from "../apps/frontend/src/lib/speech-recognition";
import {
  canRecordSpeech,
  canSpeakText,
  isLikelyTtsUnsupported,
  isTauriUserAgent,
} from "../apps/frontend/src/lib/speech-support";

/**
 * Verifikasi util deteksi platform untuk fitur suara.
 *
 * Logika ini menjaga agar tombol TTS tidak tampak "mati" pada perangkat yang
 * memang tidak punya mesin suara (WebView Android/Tauri), dengan menampilkan
 * pesan panduan sebagai gantinya.
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

const ANDROID_WEBVIEW =
  "Mozilla/5.0 (Linux; Android 14; Pixel 7 Build/UP1A; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/120.0 Mobile Safari/537.36";
const ANDROID_TAURI =
  "Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Mobile Safari/537.36 Tauri/2.0";
const DESKTOP_CHROME =
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36";
const IPHONE_SAFARI =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";

// Deteksi cangkang asli (Tauri)
check(
  "UA Tauri dikenali sebagai cangkang asli",
  isTauriUserAgent(ANDROID_TAURI)
);
check(
  "UA Chrome desktop bukan cangkang asli",
  !isTauriUserAgent(DESKTOP_CHROME)
);
check(
  "WebView Android dikenali sebagai kemungkinan tanpa TTS",
  isLikelyTtsUnsupported(ANDROID_WEBVIEW)
);
check(
  "Tauri Android dikenali sebagai kemungkinan tanpa TTS",
  isLikelyTtsUnsupported(ANDROID_TAURI)
);
check(
  "Chrome desktop bukan kasus tanpa TTS",
  !isLikelyTtsUnsupported(DESKTOP_CHROME)
);
check(
  "Safari iPhone bukan kasus tanpa TTS",
  !isLikelyTtsUnsupported(IPHONE_SAFARI)
);

// Pesan kesalahan STT dipetakan dengan ramah
check(
  "izin ditolak → pesan izin mikrofon",
  speechErrorMessage("not-allowed").includes("Izin mikrofon ditolak")
);
check(
  "tanpa jaringan → pesan koneksi",
  speechErrorMessage("network").includes("koneksi internet")
);
check(
  "mikrofon tak ada → pesan perangkat",
  speechErrorMessage("audio-capture").includes("Mikrofon tidak terdeteksi")
);
check(
  "kode tak dikenal → pesan umum",
  speechErrorMessage("entah-apa").includes("Perekaman suara gagal")
);

// Deteksi jalur suara: TTS & STT dipilih terpisah (mikrofon vs mesin suara).
// Di luar peramban (Bun), keduanya harus jujur mengembalikan false.
check("tanpa window: perekaman tidak tersedia", !canRecordSpeech());
check("tanpa window: pembacaan tidak tersedia", !canSpeakText());

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
