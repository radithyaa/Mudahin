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
        onboardingComplete: state.onboardingComplete,
        needs: state.needs,
      }),
    }
  )
);
