/**
 * Focus Profile — preferensi aksesibilitas global.
 *
 * Dipakai lintas fitur (onboarding, beranda, focus reader, pengaturan),
 * sehingga diletakkan di level global (`src/lib/stores`) sebagai satu sumber kebenaran.
 * Persistensi: Zustand `persist` → localStorage.
 */

export const FOCUS_NEEDS = [
  "disleksia",
  "adhd",
  "low-vision",
  "kendala-bahasa",
] as const;
export type FocusNeed = (typeof FOCUS_NEEDS)[number];

export const FOCUS_NEED_LABELS: Record<
  FocusNeed,
  { title: string; description: string }
> = {
  disleksia: {
    title: "Disleksia",
    description: "Teks lebih mudah dibaca dengan font dan spasi khusus.",
  },
  adhd: {
    title: "ADHD / Sulit Fokus",
    description: "Bantuan pemandu baris agar tetap fokus saat membaca.",
  },
  "low-vision": {
    title: "Penglihatan Rendah",
    description: "Teks lebih besar dan kontras lebih tinggi.",
  },
  "kendala-bahasa": {
    title: "Kendala Bahasa",
    description: "Ringkasan bahasa sederhana dan dibacakan.",
  },
};

export const FONT_FAMILIES = ["default", "dyslexic"] as const;
export type FontFamily = (typeof FONT_FAMILIES)[number];

/** Nilai minimal & maksimal untuk kontrol tipografi. */
export const FONT_SCALE_MIN = 100;
export const FONT_SCALE_MAX = 200;
export const LINE_HEIGHT_MIN = 1.2;
export const LINE_HEIGHT_MAX = 2.4;
export const LETTER_SPACING_MIN = 0;
export const LETTER_SPACING_MAX = 0.2;

/** Nilai default Netral (tanpa penyesuaian). */
export const NEUTRAL_PROFILE = {
  fontSize: 100,
  lineHeight: 1.6,
  letterSpacing: 0,
  fontFamily: "default",
  highContrast: false,
  readingRuler: false,
  reduceMotion: false,
} as const;

export interface AccessibilityPreferences {
  fontFamily: FontFamily;
  fontSize: number;
  highContrast: boolean;
  letterSpacing: number;
  lineHeight: number;
  readingRuler: boolean;
  reduceMotion: boolean;
}

export interface FocusProfileState extends AccessibilityPreferences {
  /** Terapkan preset tipografi bawaan untuk sekumpulan kebutuhan. */
  applyPresetForNeeds: (needs: FocusNeed[]) => void;
  completeOnboarding: () => void;
  /** Kebutuhan aksesibilitas yang dipilih (multi-pilih). */
  needs: FocusNeed[];
  /** Apakah pengguna sudah menyelesaikan onboarding + memilih profil. */
  onboardingComplete: boolean;
  resetPreferences: () => void;
  setNeeds: (needs: FocusNeed[]) => void;
  setPreferences: (prefs: Partial<AccessibilityPreferences>) => void;
  toggleNeed: (need: FocusNeed) => void;
}

/**
 * Preset tipografi per kebutuhan. Digabung bila banyak kebutuhan dipilih,
 * mengambil nilai paling "ramah" (mis. font terbesar, spasi terlebar).
 */
export function presetForNeeds(needs: FocusNeed[]): AccessibilityPreferences {
  const preset: AccessibilityPreferences = { ...NEUTRAL_PROFILE };

  for (const need of needs) {
    if (need === "disleksia") {
      preset.fontFamily = "dyslexic";
      preset.lineHeight = Math.max(preset.lineHeight, 1.8);
      preset.letterSpacing = Math.max(preset.letterSpacing, 0.05);
    }
    if (need === "adhd") {
      preset.readingRuler = true;
      preset.lineHeight = Math.max(preset.lineHeight, 1.8);
    }
    if (need === "low-vision") {
      preset.fontSize = Math.max(preset.fontSize, 140);
      preset.highContrast = true;
    }
    if (need === "kendala-bahasa") {
      preset.lineHeight = Math.max(preset.lineHeight, 1.7);
    }
  }

  return preset;
}
