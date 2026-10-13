import { Button } from "@mudahin/ui/components/button";
import { cn } from "@mudahin/ui/lib/utils";
import { Pause, Volume2 } from "lucide-react";
import { useCallback } from "react";

import { SliderField } from "@/components/accessibility/slider-field";

export const TTS_RATE_MIN = 0.5;
export const TTS_RATE_MAX = 2;
export const TTS_RATE_DEFAULT = 1;

const asRate = (value: number) => `${value.toFixed(1)}×`;

/**
 * Kontrol TTS yang ramah jempol: tombol besar + pengatur kecepatan.
 * Dipakai Focus Reader dan halaman Ringkasan AI.
 */
export function TtsControls({
  isSpeaking,
  isSupported,
  onRateChange,
  onToggle,
  rate,
  className,
}: {
  className?: string;
  isSpeaking: boolean;
  isSupported: boolean;
  onRateChange: (rate: number) => void;
  onToggle: () => void;
  rate: number;
}) {
  const handleRate = useCallback(
    (value: number) => onRateChange(value),
    [onRateChange]
  );

  if (!isSupported) {
    return (
      <p className="text-muted-foreground text-sm">
        Pembacaan suara tidak didukung di peramban ini. Teks tetap dapat dibaca
        seperti biasa.
      </p>
    );
  }

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <Button
        aria-label={isSpeaking ? "Hentikan pembacaan" : "Bacakan teks"}
        className="min-h-12 w-full text-sm"
        onClick={onToggle}
        size="lg"
        variant={isSpeaking ? "secondary" : "default"}
      >
        {isSpeaking ? (
          <Pause aria-hidden="true" />
        ) : (
          <Volume2 aria-hidden="true" />
        )}
        {isSpeaking ? "Hentikan" : "Bacakan"}
      </Button>

      <SliderField
        format={asRate}
        id="tts-rate"
        label="Kecepatan suara"
        max={TTS_RATE_MAX}
        min={TTS_RATE_MIN}
        onChange={handleRate}
        step={0.1}
        value={rate}
      />
    </div>
  );
}
