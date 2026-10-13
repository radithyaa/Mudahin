import { Button } from "@mudahin/ui/components/button";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@mudahin/ui/components/drawer";
import { Check, ListFilter } from "lucide-react";
import { useCallback } from "react";

interface SubjectFilterSheetProps {
  onToggle: (subject: string) => void;
  selected: string[];
  subjects: string[];
}

/** Bottom sheet filter mapel — pola mobile, muncul dari bawah dengan swipe handle. */
export function SubjectFilterSheet({
  subjects,
  selected,
  onToggle,
}: SubjectFilterSheetProps) {
  const activeCount = selected.length;

  return (
    <Drawer showSwipeHandle swipeDirection="down">
      <DrawerTrigger
        render={
          <Button
            aria-label="Filter mata pelajaran"
            size="sm"
            variant="outline"
          >
            <ListFilter aria-hidden="true" />
            Filter
            {activeCount > 0 ? (
              <span className="ml-1 rounded-full bg-primary px-1.5 text-primary-foreground text-xs">
                {activeCount}
              </span>
            ) : null}
          </Button>
        }
      />
      <DrawerContent className="mx-auto max-w-lg rounded-t-2xl border shadow-xl">
        <DrawerHeader>
          <DrawerTitle className="text-base">Filter Mata Pelajaran</DrawerTitle>
        </DrawerHeader>
        <div className="flex flex-col gap-2 p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          {subjects.map((subject) => (
            <FilterOption
              isSelected={selected.includes(subject)}
              key={subject}
              onToggle={onToggle}
              subject={subject}
            />
          ))}
        </div>
      </DrawerContent>
    </Drawer>
  );
}

interface FilterOptionProps {
  isSelected: boolean;
  onToggle: (subject: string) => void;
  subject: string;
}

function FilterOption({ subject, isSelected, onToggle }: FilterOptionProps) {
  const handleClick = useCallback(() => onToggle(subject), [onToggle, subject]);

  return (
    <button
      aria-pressed={isSelected}
      className={`flex min-h-12 items-center justify-between rounded-lg border px-4 text-left font-medium text-sm transition-colors ${
        isSelected
          ? "border-primary bg-primary/10"
          : "border-border hover:bg-muted"
      }`}
      onClick={handleClick}
      type="button"
    >
      {subject}
      {isSelected ? (
        <Check aria-hidden="true" className="size-4 text-primary" />
      ) : null}
    </button>
  );
}
