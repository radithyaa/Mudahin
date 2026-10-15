import gsap from "gsap";

/**
 * Lapisan animasi bersama (GSAP).
 *
 * Prinsip:
 * - **Reduced-motion aware** — semua animasi dicek dulu lewat `useReducedMotion`.
 * - **Mobile-first & gesture friendly** — durasi pendek, easing halus, tidak
 *   mengganggu interaksi jempol.
 * - **Satu sumber baseline** — durasi/easing baku ada di sini agar konsisten.
 *
 * GSAP dipilih sebagai satu-satunya library animasi (Aturan Teknis §1 — dilarang
 * memakai GSAP dan Framer Motion sekaligus).
 */

export const MOTION = {
  /** Durasi transisi halaman (detik). */
  pageDuration: 0.28,
  /** Geser awal transisi halaman (px). */
  pageOffset: 12,
  /** Durasi mikro-interaksi (detik). */
  microDuration: 0.15,
  /** Skala saat ditekan (tap feedback). */
  pressScale: 0.97,
  /** Easing standar — keluar cepat, masuk lembut. */
  ease: "power2.out",
} as const;

gsap.defaults({ ease: MOTION.ease, duration: MOTION.microDuration });

/** Nilai awal transisi masuk halaman. */
export function pageEnterFrom() {
  return { opacity: 0, y: MOTION.pageOffset };
}

/** Menjalankan transisi masuk halaman. Mengembalikan tween agar bisa dibatalkan. */
export function animatePageEnter(element: Element): gsap.core.Tween {
  return gsap.fromTo(element, pageEnterFrom(), {
    opacity: 1,
    y: 0,
    duration: MOTION.pageDuration,
    clearProps: "transform,opacity",
  });
}

/** Animasi tekan (tap feedback) untuk elemen interaktif. */
export function animatePress(
  element: Element,
  pressed: boolean
): gsap.core.Tween {
  return gsap.to(element, {
    scale: pressed ? MOTION.pressScale : 1,
    duration: MOTION.microDuration,
    clearProps: pressed ? undefined : "scale",
  });
}
