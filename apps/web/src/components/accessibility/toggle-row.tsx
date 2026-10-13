import { Label } from "@mudahin/ui/components/label";
import { useCallback } from "react";

interface ToggleRowProps {
  checked: boolean;
  description: string;
  id: string;
  label: string;
  onChange: (checked: boolean) => void;
}

/** Baris toggle aksesibel (label + deskripsi + switch native). */
export function ToggleRow({
  id,
  label,
  description,
  checked,
  onChange,
}: ToggleRowProps) {
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.checked),
    [onChange]
  );

  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <Label className="flex flex-col gap-0.5 font-normal" htmlFor={id}>
        <span className="font-medium">{label}</span>
        <span className="text-muted-foreground text-sm">{description}</span>
      </Label>
      <input
        aria-checked={checked}
        checked={checked}
        className="size-5 shrink-0 cursor-pointer accent-primary"
        id={id}
        onChange={handleChange}
        role="switch"
        type="checkbox"
      />
    </div>
  );
}
