import type { ProfileSnapshotInput } from "@mudahin/api/routers/profile";

/**
 * Pemetaan setelan aksesibilitas UI ⇆ snapshot profil backend.
 *
 * Backend menyimpan snapshot ringkas (font, kontras, spasi, kebutuhan) agar
 * dapat dipulihkan lintas perangkat lewat "kode cadangan" tanpa akun.
 * Setelan yang tidak dikenal backend (mis. `warmTheme`) tetap hidup lokal.
 */

export interface UiAccessibilitySettings {
  dyslexiaFont: boolean;
  fontSize: "sm" | "md" | "lg" | "xl";
  readingRuler: boolean;
  speechSpeed: number;
  warmTheme: boolean;
}

const FONT_SIZE_TO_PERCENT: Record<
  UiAccessibilitySettings["fontSize"],
  number
> = {
  sm: 100,
  md: 115,
  lg: 130,
  xl: 150,
};

const PERCENT_TO_FONT_SIZE: Record<
  number,
  UiAccessibilitySettings["fontSize"]
> = {
  100: "sm",
  115: "md",
  130: "lg",
  150: "xl",
};

/** Mengubah setelan UI menjadi snapshot yang diterima `profile.save`. */
export function toProfileSnapshot(
  settings: UiAccessibilitySettings
): ProfileSnapshotInput {
  const needs: string[] = ["Umum"];
  if (settings.dyslexiaFont) {
    needs.push("Disleksia");
  }
  if (settings.fontSize === "xl" || settings.warmTheme) {
    needs.push("Penglihatan Rendah");
  }

  return {
    fontFamily: settings.dyslexiaFont ? "dyslexic" : "default",
    fontSize: FONT_SIZE_TO_PERCENT[settings.fontSize],
    highContrast: settings.warmTheme,
    letterSpacing: settings.dyslexiaFont ? 0.05 : 0.01,
    lineHeight: settings.dyslexiaFont ? 1.8 : 1.5,
    needs,
    readingRuler: settings.readingRuler,
    reduceMotion: false,
  };
}

/** Mengubah snapshot backend kembali menjadi setelan UI (untuk pemulihan). */
export function fromProfileSnapshot(
  snapshot: ProfileSnapshotInput
): UiAccessibilitySettings {
  return {
    fontSize: PERCENT_TO_FONT_SIZE[snapshot.fontSize] ?? "md",
    readingRuler: snapshot.readingRuler,
    warmTheme: snapshot.highContrast,
    dyslexiaFont: snapshot.fontFamily === "dyslexic",
    // Kecepatan bicara tidak disimpan backend — pertahankan nilai default.
    speechSpeed: 0.95,
  };
}
