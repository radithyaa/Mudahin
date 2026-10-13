import { useCallback } from "react";

import {
  FONT_SCALE_MAX,
  FONT_SCALE_MIN,
  type FontFamily,
  LETTER_SPACING_MAX,
  LETTER_SPACING_MIN,
  LINE_HEIGHT_MAX,
  LINE_HEIGHT_MIN,
} from "@/lib/stores/focus-profile";
import { useFocusProfile } from "@/lib/stores/focus-profile-store";

import { SliderField } from "./slider-field";
import { ToggleRow } from "./toggle-row";

const asPercent = (v: number) => `${v}%`;
const asDecimal1 = (v: number) => v.toFixed(1);
const asEm = (v: number) => `${v.toFixed(2)}em`;

const FONT_FAMILY_OPTIONS: { value: FontFamily; label: string }[] = [
  { value: "default", label: "Standar" },
  { value: "dyslexic", label: "Ramah Disleksia" },
];

/**
 * Kontrol aksesibilitas inti (tipografi + bantuan fokus).
 * Dipakai bersama oleh halaman Pengaturan dan bottom sheet Pengaturan Cepat.
 */
export function QuickSettingsControls() {
  const {
    fontSize,
    lineHeight,
    letterSpacing,
    fontFamily,
    highContrast,
    readingRuler,
    reduceMotion,
    setPreferences,
  } = useFocusProfile();

  const handleFontSize = useCallback(
    (v: number) => setPreferences({ fontSize: v }),
    [setPreferences]
  );
  const handleLineHeight = useCallback(
    (v: number) => setPreferences({ lineHeight: v }),
    [setPreferences]
  );
  const handleLetterSpacing = useCallback(
    (v: number) => setPreferences({ letterSpacing: v }),
    [setPreferences]
  );
  const handleFontFamily = useCallback(
    (family: FontFamily) => setPreferences({ fontFamily: family }),
    [setPreferences]
  );
  const handleHighContrast = useCallback(
    (checked: boolean) => setPreferences({ highContrast: checked }),
    [setPreferences]
  );
  const handleReadingRuler = useCallback(
    (checked: boolean) => setPreferences({ readingRuler: checked }),
    [setPreferences]
  );
  const handleReduceMotion = useCallback(
    (checked: boolean) => setPreferences({ reduceMotion: checked }),
    [setPreferences]
  );

  return (
    <div className="flex flex-col gap-5">
      <SliderField
        format={asPercent}
        id="quick-font-size"
        label="Ukuran teks"
        max={FONT_SCALE_MAX}
        min={FONT_SCALE_MIN}
        onChange={handleFontSize}
        step={5}
        value={fontSize}
      />
      <SliderField
        format={asDecimal1}
        id="quick-line-height"
        label="Jarak antar-baris"
        max={LINE_HEIGHT_MAX}
        min={LINE_HEIGHT_MIN}
        onChange={handleLineHeight}
        step={0.1}
        value={lineHeight}
      />
      <SliderField
        format={asEm}
        id="quick-letter-spacing"
        label="Jarak antar-huruf"
        max={LETTER_SPACING_MAX}
        min={LETTER_SPACING_MIN}
        onChange={handleLetterSpacing}
        step={0.01}
        value={letterSpacing}
      />

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 font-medium text-sm">Jenis huruf</legend>
        <div className="flex gap-3">
          {FONT_FAMILY_OPTIONS.map((option) => (
            <FontFamilyButton
              family={option.value}
              isSelected={fontFamily === option.value}
              key={option.value}
              label={option.label}
              onSelect={handleFontFamily}
            />
          ))}
        </div>
      </fieldset>

      <div className="flex flex-col divide-y">
        <ToggleRow
          checked={highContrast}
          description="Pertegas perbedaan warna teks dan latar."
          id="quick-high-contrast"
          label="Kontras tinggi"
          onChange={handleHighContrast}
        />
        <ToggleRow
          checked={readingRuler}
          description="Garis bantu untuk mengikuti baris saat membaca."
          id="quick-reading-ruler"
          label="Pemandu baris"
          onChange={handleReadingRuler}
        />
        <ToggleRow
          checked={reduceMotion}
          description="Matikan animasi yang mengganggu fokus."
          id="quick-reduce-motion"
          label="Kurangi animasi"
          onChange={handleReduceMotion}
        />
      </div>
    </div>
  );
}

interface FontFamilyButtonProps {
  family: FontFamily;
  isSelected: boolean;
  label: string;
  onSelect: (family: FontFamily) => void;
}

function FontFamilyButton({
  family,
  label,
  isSelected,
  onSelect,
}: FontFamilyButtonProps) {
  const handleChange = useCallback(() => onSelect(family), [onSelect, family]);

  return (
    <label
      className={`flex min-h-11 flex-1 cursor-pointer items-center justify-center rounded-lg border px-3 font-medium text-sm transition-colors ${
        isSelected
          ? "border-primary bg-primary/10"
          : "border-border hover:bg-muted"
      }`}
    >
      <input
        checked={isSelected}
        className="sr-only"
        name={`font-family-${family}`}
        onChange={handleChange}
        type="radio"
        value={family}
      />
      {label}
    </label>
  );
}
