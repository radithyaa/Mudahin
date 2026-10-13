import { Card } from "@mudahin/ui/components/card";
import { Link } from "@tanstack/react-router";
import { BookOpen, Ruler, Sparkles, Type } from "lucide-react";
import { useCallback } from "react";

import { usePressFeedback } from "@/hooks/use-press-feedback";
import { useFocusProfile } from "@/lib/stores/focus-profile-store";

/** Toggle aksesibilitas cepat di Beranda — target sentuh besar, mobile-first. */
export function QuickAccessibilityToggle() {
  const readingRuler = useFocusProfile((s) => s.readingRuler);
  const highContrast = useFocusProfile((s) => s.highContrast);
  const fontSize = useFocusProfile((s) => s.fontSize);
  const setPreferences = useFocusProfile((s) => s.setPreferences);

  const isLargeText = fontSize > 100;

  const toggleLargeText = useCallback(
    () => setPreferences({ fontSize: isLargeText ? 100 : 140 }),
    [setPreferences, isLargeText]
  );
  const toggleRuler = useCallback(
    () => setPreferences({ readingRuler: !readingRuler }),
    [setPreferences, readingRuler]
  );
  const toggleContrast = useCallback(
    () => setPreferences({ highContrast: !highContrast }),
    [setPreferences, highContrast]
  );

  const items = [
    {
      key: "large-text",
      label: "Teks besar",
      icon: Type,
      active: isLargeText,
      onToggle: toggleLargeText,
    },
    {
      key: "ruler",
      label: "Pemandu baris",
      icon: Ruler,
      active: readingRuler,
      onToggle: toggleRuler,
    },
    {
      key: "contrast",
      label: "Kontras tinggi",
      icon: Sparkles,
      active: highContrast,
      onToggle: toggleContrast,
    },
  ];

  return (
    <Card className="p-4">
      <h2 className="mb-3 font-medium text-muted-foreground text-sm">
        Akses cepat
      </h2>
      <div className="grid grid-cols-3 gap-3">
        {items.map(({ key, label, icon: Icon, active, onToggle }) => (
          <button
            aria-pressed={active}
            className={`flex min-h-24 flex-col items-center justify-center gap-2 rounded-lg border p-2 font-medium text-xs transition-colors active:scale-[0.98] ${
              active
                ? "border-primary bg-primary/10 text-foreground"
                : "border-border text-muted-foreground hover:bg-muted"
            }`}
            key={key}
            onClick={onToggle}
            type="button"
          >
            <Icon aria-hidden="true" className="size-6" />
            {label}
            <span className="sr-only">{active ? "aktif" : "nonaktif"}</span>
          </button>
        ))}
      </div>
    </Card>
  );
}

/** Kartu ajakan membuka Pustaka (tombol utama, ramah jempol). */
export function PrimaryAction() {
  const pressRef = usePressFeedback<HTMLAnchorElement>();

  return (
    <Link
      className="flex min-h-28 items-center gap-4 rounded-xl border border-primary bg-primary/5 p-5 transition-colors hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.99]"
      ref={pressRef}
      to="/pustaka"
    >
      <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
        <BookOpen aria-hidden="true" className="size-7" />
      </span>
      <span>
        <span className="block font-semibold text-lg">Mulai Belajar</span>
        <span className="block text-muted-foreground text-sm">
          Buka pustaka materi dan pilih bacaanmu.
        </span>
      </span>
    </Link>
  );
}
