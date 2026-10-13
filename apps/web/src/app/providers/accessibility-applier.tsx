import { useEffect } from "react";

import { useFocusProfile } from "@/lib/stores/focus-profile-store";

/**
 * Menerapkan Focus Profile ke seluruh dokumen sebagai CSS variable.
 *
 * Kenapa di root (bukan per-komponen): preferensi aksesibilitas harus
 * berlaku global dan instan tanpa me-remount pohon komponen.
 */
export function AccessibilityApplier() {
  const fontSize = useFocusProfile((s) => s.fontSize);
  const lineHeight = useFocusProfile((s) => s.lineHeight);
  const letterSpacing = useFocusProfile((s) => s.letterSpacing);
  const fontFamily = useFocusProfile((s) => s.fontFamily);
  const highContrast = useFocusProfile((s) => s.highContrast);
  const reduceMotion = useFocusProfile((s) => s.reduceMotion);

  useEffect(() => {
    const root = document.documentElement;

    root.style.setProperty("--a11y-font-scale", `${fontSize / 100}`);
    root.style.setProperty("--a11y-line-height", `${lineHeight}`);
    root.style.setProperty("--a11y-letter-spacing", `${letterSpacing}em`);
    root.dataset.font = fontFamily;
    root.classList.toggle("high-contrast", highContrast);
    root.classList.toggle("reduce-motion", reduceMotion);

    return () => {
      root.style.removeProperty("--a11y-font-scale");
      root.style.removeProperty("--a11y-line-height");
      root.style.removeProperty("--a11y-letter-spacing");
    };
  }, [
    fontSize,
    lineHeight,
    letterSpacing,
    fontFamily,
    highContrast,
    reduceMotion,
  ]);

  return null;
}
