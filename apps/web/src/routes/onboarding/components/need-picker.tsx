import { Card } from "@mudahin/ui/components/card";
import { Check } from "lucide-react";
import { useCallback } from "react";

import {
  FOCUS_NEED_LABELS,
  FOCUS_NEEDS,
  type FocusNeed,
} from "@/lib/stores/focus-profile";

interface NeedPickerProps {
  onToggle: (need: FocusNeed) => void;
  selected: FocusNeed[];
}

/** Pemilih multi-pilih kebutuhan aksesibilitas. */
export function NeedPicker({ selected, onToggle }: NeedPickerProps) {
  return (
    <fieldset className="grid gap-3">
      <legend className="mb-2 text-muted-foreground text-sm">
        Pilih semua yang sesuai. Kamu bisa mengubahnya nanti.
      </legend>
      {FOCUS_NEEDS.map((need) => (
        <NeedOption
          isSelected={selected.includes(need)}
          key={need}
          need={need}
          onToggle={onToggle}
        />
      ))}
    </fieldset>
  );
}

function NeedOption({
  need,
  isSelected,
  onToggle,
}: {
  need: FocusNeed;
  isSelected: boolean;
  onToggle: (need: FocusNeed) => void;
}) {
  const { title, description } = FOCUS_NEED_LABELS[need];

  const handleChange = useCallback(() => {
    onToggle(need);
  }, [onToggle, need]);

  return (
    <label className="cursor-pointer">
      <input
        checked={isSelected}
        className="peer sr-only"
        name="focus-need"
        onChange={handleChange}
        type="checkbox"
        value={need}
      />
      <Card
        className={`flex min-h-14 flex-row items-center gap-3 p-4 transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-ring ${
          isSelected ? "border-primary bg-primary/5" : "hover:bg-muted"
        }`}
      >
        <span
          aria-hidden="true"
          className={`flex size-6 shrink-0 items-center justify-center rounded-md border ${
            isSelected
              ? "border-primary bg-primary text-primary-foreground"
              : "border-input"
          }`}
        >
          {isSelected ? <Check className="size-4" /> : null}
        </span>
        <span>
          <span className="block font-medium">{title}</span>
          <span className="block text-muted-foreground text-sm">
            {description}
          </span>
        </span>
      </Card>
    </label>
  );
}
