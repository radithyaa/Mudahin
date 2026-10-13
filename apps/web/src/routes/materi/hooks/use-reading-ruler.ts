import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Reading Ruler (FR-VIS-04) — memandu fokus pada satu baris.
 *
 * Dua mode:
 * 1. **Auto-follow** (default, ramah mobile): garis mengikuti titik tengah
 *    viewport saat pengguna menggulir — tidak perlu menyentuh layar.
 * 2. **Drag**: pengguna menahan & menggeser gagang di tepi kanan. Mode otomatis
 *    kembali aktif sesaat setelah interaksi selesai.
 *
 * Menghormati "kurangi animasi" (tidak ada transisi yang dipaksakan dari sini).
 */

export interface ReadingRulerControls {
  /** Apakah pengguna sedang menggeser garis. */
  isDragging: boolean;
  /** Memulai drag dari sebuah posisi sentuh/pointer. */
  startDrag: (clientY: number) => void;
  /** Posisi Y garis (px, relatif viewport). */
  y: number;
}

const RESUME_AUTO_MS = 1200;

export function useReadingRuler(enabled: boolean): ReadingRulerControls {
  const [y, setY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isManual, setIsManual] = useState(false);
  const resumeTimerRef = useRef<number | undefined>(undefined);

  const followMiddle = useCallback(() => {
    if (isManual) {
      return;
    }
    setY(window.innerHeight / 2);
  }, [isManual]);

  const startDrag = useCallback((clientY: number) => {
    setIsManual(true);
    setIsDragging(true);
    setY(clientY);
  }, []);

  // Auto-follow saat menggulir.
  useEffect(() => {
    if (!enabled) {
      return;
    }
    followMiddle();
    window.addEventListener("scroll", followMiddle, { passive: true });
    return () => window.removeEventListener("scroll", followMiddle);
  }, [enabled, followMiddle]);

  // Menangani gerakan & akhir drag.
  useEffect(() => {
    if (!(enabled && isDragging)) {
      return;
    }

    const handleMove = (event: PointerEvent) => {
      setY(event.clientY);
    };
    const handleEnd = () => {
      setIsDragging(false);
      resumeTimerRef.current = window.setTimeout(() => {
        setIsManual(false);
      }, RESUME_AUTO_MS);
    };

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleEnd);
    window.addEventListener("pointercancel", handleEnd);
    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleEnd);
      window.removeEventListener("pointercancel", handleEnd);
    };
  }, [enabled, isDragging]);

  // Bersihkan timer saat unmount.
  useEffect(
    () => () => {
      if (resumeTimerRef.current !== undefined) {
        window.clearTimeout(resumeTimerRef.current);
      }
    },
    []
  );

  return { isDragging, startDrag, y };
}
