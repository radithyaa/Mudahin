import type React from "react";
import { useEffect, useState } from "react";

interface ReadingGuideOverlayProps {
  active: boolean;
}

/** Tinggi area pandu (px) — dibuat ganjil agar sekitar 2 baris terlihat. */
const RULER_HEIGHT = 44;
const TOP_GUARD = 60;

/**
 * Garis pembimbing baca (Reading Ruler) — mobile & desktop friendly.
 *
 * - **Mobile (gesture first):** garis mengikuti satu per tiga atas area pandang
 *   dan disetel lewat geseran jari secara mendatar — tanpa perlu menepuk.
 * - **Desktop:** garis tetap mengikuti kursor.
 *
 * Posisinya diikat ke tinggi area pandang yang benar-benar terlihat sehingga
 * tetap akurat saat bilah alamat ponsel menyembunyikan diri.
 */
export const ReadingGuideOverlay: React.FC<ReadingGuideOverlayProps> = ({
  active,
}) => {
  const [viewportHeight, setViewportHeight] = useState(0);
  const [pointerY, setPointerY] = useState<number | null>(null);

  useEffect(() => {
    if (!active) {
      return;
    }

    const updateViewport = () => setViewportHeight(window.innerHeight);
    updateViewport();
    window.addEventListener("resize", updateViewport);

    const handlePointerMove = (event: MouseEvent | TouchEvent) => {
      if ("clientY" in event) {
        setPointerY(event.clientY);
      } else if (event.touches?.[0]) {
        setPointerY(event.touches[0].clientY);
      }
    };
    // Geseran mendatar di mobile juga memperbarui posisi garis.
    window.addEventListener("mousemove", handlePointerMove);
    window.addEventListener("touchmove", handlePointerMove, { passive: true });

    return () => {
      window.removeEventListener("resize", updateViewport);
      window.removeEventListener("mousemove", handlePointerMove);
      window.removeEventListener("touchmove", handlePointerMove);
    };
  }, [active]);

  if (!active) {
    return null;
  }

  /** Posisi bawaan: satu per tiga atas layar. Sentuhan menggesernya sesuai jari. */
  const baseY = viewportHeight > 0 ? viewportHeight / 3 : 200;
  const centerY = pointerY ?? baseY;
  const top = Math.max(TOP_GUARD, Math.min(centerY - RULER_HEIGHT / 2, baseY));

  return (
    <div
      aria-hidden="true"
      className="reading-guide-line"
      style={{ top: `${top}px` }}
    />
  );
};
