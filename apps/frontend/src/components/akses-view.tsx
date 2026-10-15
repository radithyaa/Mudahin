import type React from "react";

import {
  AccessibilitySettings,
  type AccessibilityValues,
} from "./accessibility-settings";

interface AksesViewProps extends AccessibilityValues {
  onChangeFontSize: (size: AccessibilityValues["fontSize"]) => void;
  onChangeSpeechSpeed: (speed: number) => void;
  onToggleDyslexiaFont: () => void;
  onToggleRuler: () => void;
  onToggleWarm: () => void;
}

/**
 * Halaman Akses — pusat pengaturan aksesibilitas.
 *
 * Isinya memakai komponen `AccessibilitySettings` yang sama dengan bottom sheet
 * di navbar, sehingga kedua pintu masuk selalu menawarkan pengaturan identik.
 */
export const AksesView: React.FC<AksesViewProps> = ({
  fontSize,
  onChangeFontSize,
  readingRuler,
  onToggleRuler,
  warmTheme,
  onToggleWarm,
  dyslexiaFont,
  onToggleDyslexiaFont,
  speechSpeed,
  onChangeSpeechSpeed,
}) => (
  <main className="mx-auto w-full max-w-xl space-y-5 px-4 pt-4 pb-8">
    <section className="space-y-1">
      <div className="inline-flex items-center gap-1.5 rounded-full bg-[#E8F8F0] px-3 py-1 font-extrabold text-[#006c49] text-[12px]">
        <span className="material-symbols-outlined text-[16px]">
          accessibility_new
        </span>
        <span>Desain Ramah Neurodiversitas</span>
      </div>
      <h2 className="font-extrabold text-[#131b2e] text-[24px] tracking-tight">
        Pusat Aksesibilitas Belajar
      </h2>
      <p className="font-medium text-[#464555] text-[14px] leading-relaxed">
        Atur tampilan, kontras warna, font khusus, dan panduan audio agar sesi
        belajarmu minim lelah dan bebas stres.
      </p>
    </section>

    <AccessibilitySettings
      onChangeFontSize={onChangeFontSize}
      onChangeSpeechSpeed={onChangeSpeechSpeed}
      onToggleDyslexiaFont={onToggleDyslexiaFont}
      onToggleRuler={onToggleRuler}
      onToggleWarm={onToggleWarm}
      value={{ dyslexiaFont, fontSize, readingRuler, speechSpeed, warmTheme }}
    />
  </main>
);
