import type { Material } from "@mudahin/api/materials";
import { Button } from "@mudahin/ui/components/button";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@mudahin/ui/components/drawer";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Minimize2,
  SlidersHorizontal,
  Type,
} from "lucide-react";
import { useCallback, useEffect, useMemo } from "react";

import { SliderField } from "@/components/accessibility/slider-field";
import { usePressFeedback } from "@/hooks/use-press-feedback";

import {
  buildFocusBlocks,
  firstBlockIndexOfParagraph,
} from "../lib/focus-blocks";
import {
  FOCUS_MODE_WORDS_MAX,
  FOCUS_MODE_WORDS_MIN,
  useFocusModeStore,
} from "../stores/focus-mode-store";

const formatWordsPerBlock = (value: number) => `${value} kata`;

/**
 * Mode Fokus — satu blok teks pada satu waktu, tipografi besar, minim distraksi.
 *
 * Dirancang mobile-first & gesture friendly: kartu dapat ditepuk (kanan = maju,
 * kiri = mundur), tombol besar ramah jempol, dan dapat dibalik dengan TTS.
 */
export function FocusModeView({
  material,
  activeParagraph,
  isSpeaking,
}: {
  activeParagraph: number;
  isSpeaking: boolean;
  material: Material;
}) {
  const isActive = useFocusModeStore((s) => s.isActive);
  const wordsPerBlock = useFocusModeStore((s) => s.wordsPerBlock);
  const index = useFocusModeStore((s) => s.index);
  const setActive = useFocusModeStore((s) => s.setActive);
  const setIndex = useFocusModeStore((s) => s.setIndex);

  const blocks = useMemo(
    () => buildFocusBlocks(material.paragraphs, wordsPerBlock),
    [material.paragraphs, wordsPerBlock]
  );

  const total = blocks.length;
  const clampedIndex = Math.min(index, Math.max(total - 1, 0));
  const current = blocks[clampedIndex];

  const goNext = useCallback(() => {
    setIndex(Math.min(clampedIndex + 1, Math.max(total - 1, 0)));
  }, [clampedIndex, setIndex, total]);

  const goPrev = useCallback(() => {
    setIndex(Math.max(clampedIndex - 1, 0));
  }, [clampedIndex, setIndex]);

  const exit = useCallback(() => setActive(false), [setActive]);

  // Saat TTS berjalan, ikuti paragraf yang sedang dibacakan (FR-AUD-02).
  useEffect(() => {
    if (!(isSpeaking && isActive)) {
      return;
    }
    const target = firstBlockIndexOfParagraph(blocks, activeParagraph);
    if (target >= 0) {
      setIndex(target);
    }
  }, [activeParagraph, blocks, isActive, isSpeaking, setIndex]);

  const cardRef = usePressFeedback<HTMLButtonElement>();

  const handleCardKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLButtonElement>) => {
      if (event.key === "ArrowLeft") {
        goPrev();
      }
      if (event.key === "ArrowRight") {
        goNext();
      }
    },
    [goNext, goPrev]
  );

  // Gesture mobile: ketuk pada sepertiga kiri kartu untuk mundur.
  const handleCardPointerUp = useCallback(
    (event: React.PointerEvent<HTMLButtonElement>) => {
      const rect = event.currentTarget.getBoundingClientRect();
      if (event.clientX - rect.left < rect.width / 3) {
        goPrev();
      }
    },
    [goPrev]
  );

  if (!(isActive && current)) {
    return null;
  }

  const isFirst = clampedIndex === 0;
  const isLast = clampedIndex >= total - 1;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
      <header className="flex items-center justify-between gap-2 border-b px-3 py-2">
        <Button className="min-h-11" onClick={exit} variant="ghost">
          <Minimize2 aria-hidden="true" /> Keluar
        </Button>
        <p className="truncate font-medium text-muted-foreground text-sm">
          {material.title}
        </p>
        <FocusModeSettings />
      </header>

      <main className="flex flex-1 flex-col items-center justify-center gap-6 px-4 py-4">
        <button
          aria-label={`Teks fokus: ${current.text}. Ketuk sisi kanan untuk lanjut, kiri untuk mundur.`}
          className="flex min-h-56 w-full max-w-xl flex-1 cursor-pointer items-center justify-center rounded-2xl border bg-card p-6 text-center"
          onClick={goNext}
          onKeyDown={handleCardKeyDown}
          onPointerUp={handleCardPointerUp}
          ref={cardRef}
          type="button"
        >
          <span className="font-semibold text-3xl leading-snug tracking-[var(--a11y-letter-spacing)] sm:text-4xl">
            {current.text}
          </span>
        </button>

        <div className="flex w-full max-w-xl flex-col gap-3">
          <div
            aria-label={`Kemajuan membaca: blok ${clampedIndex + 1} dari ${total}`}
            aria-valuemax={total}
            aria-valuemin={1}
            aria-valuenow={clampedIndex + 1}
            className="h-2 w-full overflow-hidden rounded-full bg-muted"
            role="progressbar"
          >
            <div
              className="h-full rounded-full bg-primary transition-[width] duration-300"
              style={{
                width: `${total === 0 ? 0 : ((clampedIndex + 1) / total) * 100}%`,
              }}
            />
          </div>

          <div className="flex items-center gap-3">
            <Button
              aria-label="Blok sebelumnya"
              className="min-h-14 flex-1"
              disabled={isFirst}
              onClick={goPrev}
              variant="outline"
            >
              <ArrowLeft aria-hidden="true" /> Sebelumnya
            </Button>
            <Button
              aria-label="Blok berikutnya"
              className="min-h-14 flex-1"
              disabled={isLast}
              onClick={goNext}
            >
              {isLast ? (
                <>
                  <Check aria-hidden="true" /> Selesai
                </>
              ) : (
                <>
                  Lanjut <ArrowRight aria-hidden="true" />
                </>
              )}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}

/** Tombol pembuka mode fokus di bar aksi reader. */
export function FocusModeToggle() {
  const isActive = useFocusModeStore((s) => s.isActive);
  const toggle = useFocusModeStore((s) => s.toggle);

  return (
    <Button
      aria-pressed={isActive}
      className="min-h-11"
      onClick={toggle}
      size="sm"
      variant="outline"
    >
      <Type aria-hidden="true" /> Fokus
    </Button>
  );
}

/** Bottom sheet pengaturan mode fokus (jumlah kata per blok). */
function FocusModeSettings() {
  const wordsPerBlock = useFocusModeStore((s) => s.wordsPerBlock);
  const setWordsPerBlock = useFocusModeStore((s) => s.setWordsPerBlock);

  const handleChange = useCallback(
    (value: number) => setWordsPerBlock(value),
    [setWordsPerBlock]
  );

  return (
    <Drawer showSwipeHandle swipeDirection="down">
      <DrawerTrigger
        render={
          <Button
            aria-label="Pengaturan mode fokus"
            size="icon"
            variant="outline"
          />
        }
      >
        <SlidersHorizontal aria-hidden="true" />
      </DrawerTrigger>
      <DrawerContent className="mx-auto max-w-lg rounded-t-2xl border shadow-xl">
        <DrawerHeader>
          <DrawerTitle className="text-base">Pengaturan Mode Fokus</DrawerTitle>
        </DrawerHeader>
        <div className="flex flex-col gap-4 p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <SliderField
            format={formatWordsPerBlock}
            id="focus-words-per-block"
            label="Kata per blok"
            max={FOCUS_MODE_WORDS_MAX}
            min={FOCUS_MODE_WORDS_MIN}
            onChange={handleChange}
            step={1}
            value={wordsPerBlock}
          />
          <p className="text-muted-foreground text-xs">
            Blok kecil membantu menjaga fokus. Ubah sesuai kenyamananmu.
          </p>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
