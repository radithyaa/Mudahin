import gsap from "gsap";
import { type ReactNode, useEffect, useRef } from "react";

import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { animatePageEnter } from "@/lib/motion";

interface PageTransitionProps {
  children: ReactNode;
  /** Kunci perubahan animasi — biasanya pathname. */
  routeKey: string;
}

/**
 * Membungkus konten route dengan transisi masuk halus (GSAP).
 *
 * - Dijalankan ulang setiap `routeKey` (pathname) berubah.
 * - Otomatis dilewati saat `prefers-reduced-motion` atau "Kurangi animasi" aktif.
 * - Menggunakan `clearProps` sehingga tidak meninggalkan transform permanen
 *   yang bisa merusak `position: sticky` anak.
 */
export function PageTransition({ children, routeKey }: PageTransitionProps) {
  const reducedMotion = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);
  const previousKey = useRef<string | null>(null);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) {
      return;
    }

    // Hanya animasikan saat key berubah, bukan di setiap render.
    if (previousKey.current === routeKey) {
      return;
    }
    previousKey.current = routeKey;

    if (reducedMotion) {
      gsap.set(element, { clearProps: "transform,opacity" });
      return;
    }

    const tween = animatePageEnter(element);
    return () => {
      tween.kill();
    };
  }, [routeKey, reducedMotion]);

  return <div ref={containerRef}>{children}</div>;
}
