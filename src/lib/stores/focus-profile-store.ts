import { create } from "zustand";
import { persist } from "zustand/middleware";

import {
  type AccessibilityPreferences,
  type FocusNeed,
  type FocusProfileState,
  NEUTRAL_PROFILE,
  presetForNeeds,
} from "./focus-profile";

export const FOCUS_PROFILE_STORAGE_KEY = "mudahin-focus-profile";

/** Kecepatan bicara bawaan — dipakai saat snapshot dibaca tanpa nilai tersimpan. */
const DEFAULT_TTS_RATE = 0.95;

/** Ambang skala huruf → pilihan ukuran UI (`sm`|`md`|`lg`|`xl`). */
const FONT_SIZE_THRESHOLDS = [
  { min: 140, size: "xl" },
  { min: 127, size: "lg" },
  { min: 107, size: "md" },
] as const satisfies readonly {
  min: number;
  size: "sm" | "md" | "lg" | "xl";
}[];

function toFontSizeOption(scale: number): "sm" | "md" | "lg" | "xl" {
  return FONT_SIZE_THRESHOLDS.find((entry) => scale >= entry.min)?.size ?? "sm";
}

export const useFocusProfile = create<FocusProfileState>()(
  persist(
    (set) => ({
      ...NEUTRAL_PROFILE,
      onboardingComplete: false,
      needs: [],

      setPreferences: (prefs) => set((state) => ({ ...state, ...prefs })),

      setNeeds: (needs) => set((state) => ({ ...state, needs })),

      toggleNeed: (need) =>
        set((state) => {
          const needs = state.needs.includes(need)
            ? state.needs.filter((n) => n !== need)
            : [...state.needs, need];
          return { ...state, needs };
        }),

      applyPresetForNeeds: (needs) =>
        set((state) => ({ ...state, ...presetForNeeds(needs) })),

      resetPreferences: () =>
        set((state) => ({ ...state, ...NEUTRAL_PROFILE, needs: [] })),

      completeOnboarding: () =>
        set((state) => ({ ...state, onboardingComplete: true })),
    }),
    {
      name: FOCUS_PROFILE_STORAGE_KEY,
      version: 1,
      partialize: (
        state
      ): AccessibilityPreferences & {
        onboardingComplete: boolean;
        needs: FocusNeed[];
      } => ({
        fontSize: state.fontSize,
        lineHeight: state.lineHeight,
        letterSpacing: state.letterSpacing,
        fontFamily: state.fontFamily,
        highContrast: state.highContrast,
        readingRuler: state.readingRuler,
        reduceMotion: state.reduceMotion,
        haptics: state.haptics,
        onboardingComplete: state.onboardingComplete,
        needs: state.needs,
      }),
    }
  )
);

/**
 * Membaca preferensi aksesibilitas terkini sebagai snapshot ringkas.
 *
 * Versi fungsi (bukan hook) dipakai saat mencadangkan data: `getState()` selalu
 * memberi nilai terbaru tanpa perlu me-render ulang komponen.
 */
export function readProfileSnapshot(): {
  dyslexiaFont: boolean;
  fontSize: "sm" | "md" | "lg" | "xl";
  readingRuler: boolean;
  speechSpeed: number;
  warmTheme: boolean;
} {
  const state = useFocusProfile.getState();
  return {
    dyslexiaFont: state.fontFamily === "dyslexic",
    fontSize: toFontSizeOption(state.fontSize),
    readingRuler: state.readingRuler,
    speechSpeed: DEFAULT_TTS_RATE,
    warmTheme: state.highContrast,
  };
}
