import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";

import { soundEffects } from "../utils/audio";
import {
  AccessibilitySettings,
  type AccessibilitySettingsProps,
  type AccessibilityValues,
} from "./accessibility-settings";

export interface AccessibilitySheetProps
  extends Omit<AccessibilitySettingsProps, "value"> {
  dyslexiaFont: boolean;
  fontSize: AccessibilityValues["fontSize"];
  onClose: () => void;
  open: boolean;
  readingRuler: boolean;
  speechSpeed: number;
  warmTheme: boolean;
}

/** Jarak geser (px) yang dianggap sebagai niat menutup sheet. */
const DISMISS_THRESHOLD = 90;

/**
 * Bottom sheet aksesibilitas — dibuka dari tombol "tune" di navbar paling kanan.
 *
 * Mobile-first & gesture friendly:
 * - muncul dari bawah (pola sheet),
 * - **geser ke bawah** untuk menutup (dengan umpan balik visual mengikuti jari),
 * - ketuk latar gelap untuk menutup,
 * - tombol tutup besar di kanan atas untuk jangkauan jempol,
 * - tombol Escape untuk pengguna keyboard.
 *
 * Isi pengaturannya identik dengan halaman Akses (memakai komponen yang sama).
 */
export const AccessibilitySheet: React.FC<AccessibilitySheetProps> = ({
  open,
  onClose,
  dyslexiaFont,
  fontSize,
  readingRuler,
  speechSpeed,
  warmTheme,
  ...handlers
}) => {
  const [dragOffset, setDragOffset] = useState(0);
  const startYRef = useRef<number | null>(null);

  // Kunci gulir latar + tutup dengan tombol Escape saat sheet terbuka.
  useEffect(() => {
    if (!open) {
      return;
    }
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  // Reset posisi geser setiap kali sheet dibuka kembali.
  useEffect(() => {
    if (!open) {
      setDragOffset(0);
      startYRef.current = null;
    }
  }, [open]);

  const handlePointerDown = useCallback((event: React.PointerEvent) => {
    startYRef.current = event.clientY;
  }, []);

  const handlePointerMove = useCallback((event: React.PointerEvent) => {
    if (startYRef.current === null) {
      return;
    }
    // Hanya mengikuti geseran ke bawah (nilai positif).
    setDragOffset(Math.max(0, event.clientY - startYRef.current));
  }, []);

  const handlePointerUp = useCallback(() => {
    if (startYRef.current === null) {
      return;
    }
    const shouldDismiss = dragOffset > DISMISS_THRESHOLD;
    startYRef.current = null;
    setDragOffset(0);
    if (shouldDismiss) {
      soundEffects.playTap();
      onClose();
    }
  }, [dragOffset, onClose]);

  if (!open) {
    return null;
  }

  const handleClose = () => {
    soundEffects.playTap();
    onClose();
  };

  const isDragging = dragOffset > 0;

  return (
    <div className="dialog-layer dialog-layer--bottom">
      <button
        aria-label="Tutup pengaturan aksesibilitas"
        className="absolute inset-0 h-full w-full cursor-default bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
        type="button"
      />

      <div
        className="dialog-panel fade-in slide-in-from-bottom-6 z-10 max-h-[85%] animate-in rounded-t-3xl border-2 border-[#4f46e5] bg-[#faf8ff] shadow-2xl duration-200"
        style={{
          transform: `translateY(${dragOffset}px)`,
          transition: isDragging ? "none" : undefined,
        }}
      >
        {/* Gagang geser (area sentuh untuk menutup) + judul + tombol tutup */}
        <div
          className="flex shrink-0 cursor-grab touch-none items-center justify-between border-[#c7c4d8] border-b-2 bg-white px-4 pt-2 pb-3 active:cursor-grabbing"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
        >
          <div className="min-w-0">
            <span
              aria-hidden="true"
              className="mx-auto mb-1.5 block h-1.5 w-12 rounded-full bg-[#c7c4d8]"
            />
            <span className="block font-extrabold text-[#3525cd] text-[11px] uppercase tracking-wider">
              Aksesibilitas
            </span>
            <h3 className="truncate font-extrabold text-[#131b2e] text-[17px]">
              Pengaturan Cepat
            </h3>
          </div>
          <button
            aria-label="Tutup"
            className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#eaedff] text-[#3525cd] transition-colors hover:bg-[#dae2fd]"
            onClick={handleClose}
            type="button"
          >
            <span className="material-symbols-outlined text-[22px]">close</span>
          </button>
        </div>

        {/* Area gulir berisi seluruh pengaturan aksesibilitas. */}
        <div
          className="flex-1 overflow-y-auto overscroll-contain p-4"
          style={{ paddingBottom: "calc(1rem + var(--safe-bottom))" }}
        >
          <p className="mb-4 font-medium text-[#464555] text-[13px] leading-relaxed">
            Ubah tampilan dan suara sesuai kenyamananmu — otomatis tersimpan.
          </p>
          <AccessibilitySettings
            {...handlers}
            value={{
              dyslexiaFont,
              fontSize,
              readingRuler,
              speechSpeed,
              warmTheme,
            }}
          />
        </div>
      </div>
    </div>
  );
};
