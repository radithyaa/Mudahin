import { Label } from "@mudahin/ui/components/label";
import { useCallback } from "react";

interface SliderFieldProps {
  format: (value: number) => string;
  id: string;
  label: string;
  max: number;
  min: number;
  onChange: (value: number) => void;
  step: number;
  value: number;
}

/** Kontrol slider aksesibel dengan label teks, nilai tampak, dan target sentuh nyaman. */
export function SliderField({
  id,
  label,
  value,
  min,
  max,
  step,
  format,
  onChange,
}: SliderFieldProps) {
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) =>
      onChange(Number(e.target.value)),
    [onChange]
  );

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <Label htmlFor={id}>{label}</Label>
        <span className="text-muted-foreground text-sm">{format(value)}</span>
      </div>
      <input
        className="h-11 w-full cursor-pointer appearance-none bg-transparent accent-primary [&::-webkit-slider-runnable-track]:h-2 [&::-webkit-slider-runnable-track]:rounded-full [&::-webkit-slider-runnable-track]:bg-muted [&::-webkit-slider-thumb]:mt-[-0.5rem] [&::-webkit-slider-thumb]:size-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary"
        id={id}
        max={max}
        min={min}
        onChange={handleChange}
        step={step}
        type="range"
        value={value}
      />
    </div>
  );
}
