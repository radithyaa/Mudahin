/**
 * Haptic feedback (getar) — Future Work yang dapat dikerjakan cepat.
 *
 * Di web, haptic diakses lewat `navigator.vibrate` (didukung Chrome/Android).
 * Bersifat best-effort: bila perangkat tidak mendukung, tidak terjadi apa-apa.
 *
 * Prinsip aksesibilitas:
 * - Menghormati preferensi "Kurangi animasi" (reduced-motion) agar tidak
 *   mengganggu pengguna yang sensitif terhadap gerakan/getaran.
 * - Tidak pernah menjadi satu-satunya cara menyampaikan informasi.
 */

/** Pola getar singkat untuk setelan yang berbeda-beda (ms). */
export const HAPTIC = {
  /** Ketukan ringan saat menekan. */
  tap: 8,
  /** Umpan balik saat aksi berhasil. */
  success: [12, 40, 12],
  /** Peringatan singkat (mis. jawaban salah). */
  warning: [20, 60, 20],
} as const;

type HapticPattern = number | readonly number[];

function supportsVibrate(): boolean {
  return (
    typeof navigator !== "undefined" && typeof navigator.vibrate === "function"
  );
}

/**
 * Menjalankan pola getar bila didukung & tidak diminta mengurangi animasi.
 *
 * @param pattern pola getar (ms) atau daftar ms
 * @param reduceMotion `true` bila pengguna memilih mengurangi gerakan
 */
export function vibrate(
  pattern: HapticPattern = HAPTIC.tap,
  reduceMotion = false
): void {
  if (reduceMotion || !supportsVibrate()) {
    return;
  }
  try {
    navigator.vibrate(typeof pattern === "number" ? pattern : [...pattern]);
  } catch {
    // Best-effort: kegagalan haptic tidak boleh mengganggu interaksi.
  }
}
