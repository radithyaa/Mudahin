import { Button } from "@mudahin/ui/components/button";
import { Card } from "@mudahin/ui/components/card";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, Layers, ListChecks, Ruler, Sparkles } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { upsertCachedMaterial } from "@/lib/materials/cache";
import { materialToText, resolveMaterialById } from "@/lib/materials/seed";
import { useFocusProfile } from "@/lib/stores/focus-profile-store";
import { useProgressStore } from "@/lib/stores/progress-store";
import { ExplainSheet, useSelectedText } from "../components/explain-sheet";
import { FocusModeToggle, FocusModeView } from "../components/focus-mode-view";
import { HighlightedText } from "../components/highlighted-text";
import { ReaderSettingsSheet } from "../components/reader-settings-sheet";
import { ReadingRuler } from "../components/reading-ruler";
import { TTS_RATE_DEFAULT, TtsControls } from "../components/tts-controls";
import { useReadingRuler } from "../hooks/use-reading-ruler";
import {
  tokenizeWords,
  useTextToSpeech,
  wordIndexFromChar,
} from "../hooks/use-text-to-speech";

export const Route = createFileRoute("/materi/$materialId/")({
  component: FocusReaderComponent,
  loader: async ({ params }) => {
    const material = await resolveMaterialById(params.materialId);
    if (!material) {
      throw notFound();
    }
    return { material };
  },
  head: ({ loaderData }) => ({
    meta: [{ title: `${loaderData?.material.title ?? "Materi"} — Mudahin` }],
  }),
});

function FocusReaderComponent() {
  const { material } = Route.useLoaderData();
  const readingRulerEnabled = useFocusProfile((s) => s.readingRuler);
  const setPreferences = useFocusProfile((s) => s.setPreferences);
  const markRead = useProgressStore((s) => s.markRead);
  const { isDragging, startDrag, y } = useReadingRuler(readingRulerEnabled);
  const { getSelectedText, hasSelection } = useSelectedText();

  useEffect(() => {
    markRead(material.id);
  }, [markRead, material.id]);

  // Simpan materi ini ke salinan luring agar pembacaan berikutnya tetap jalan
  // tanpa jaringan (FR-PRF-06).
  useEffect(() => {
    upsertCachedMaterial(material).catch(() => undefined);
  }, [material]);

  const [rate, setRate] = useState(TTS_RATE_DEFAULT);
  const [activeParagraph, setActiveParagraph] = useState(0);
  const [activeWordIndex, setActiveWordIndex] = useState(-1);

  const fullText = useMemo(() => materialToText(material), [material]);
  const tokens = useMemo(() => tokenizeWords(fullText), [fullText]);

  const handleBoundary = useCallback(
    (charIndex: number) => {
      // Perbarui paragraf aktif agar hanya paragraf itu yang disorot kata.
      setActiveParagraph(
        paragraphIndexFromChar(material.paragraphs, charIndex)
      );
      setActiveWordIndex(wordIndexFromChar(tokens, charIndex, -1));
    },
    [material.paragraphs, tokens]
  );

  const { cancel, isSpeaking, isSupported, speak } = useTextToSpeech({
    onBoundary: handleBoundary,
    rate,
  });

  const toggleSpeak = useCallback(() => {
    if (isSpeaking) {
      cancel();
      return;
    }
    speak(fullText);
  }, [cancel, fullText, isSpeaking, speak]);

  const toggleRuler = useCallback(() => {
    setPreferences({ readingRuler: !readingRulerEnabled });
  }, [setPreferences, readingRulerEnabled]);

  return (
    <>
      {readingRulerEnabled ? (
        <ReadingRuler isDragging={isDragging} onStartDrag={startDrag} y={y} />
      ) : null}

      <FocusModeView
        activeParagraph={activeParagraph}
        isSpeaking={isSpeaking}
        material={material}
      />

      <main className="mx-auto flex w-full max-w-2xl flex-col gap-4 px-4 py-4 pb-40 sm:gap-6 sm:py-6">
        <header className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-muted-foreground text-xs">
            <span className="rounded-full bg-secondary px-2 py-0.5 text-secondary-foreground">
              {material.subject}
            </span>
            <span>{material.gradeLevel}</span>
            <span aria-hidden="true">·</span>
            <span>{material.readingMinutes} menit</span>
          </div>
          <h1 className="font-bold text-xl sm:text-2xl">{material.title}</h1>
        </header>

        <article className="flex flex-col gap-4 pb-2">
          {material.paragraphs.map((paragraph, index) => {
            const isActiveParagraph = isSpeaking && index === activeParagraph;
            // Offset kata global → lokal paragraf (jumlah kata semua paragraf sebelumnya).
            const localWordIndex = isActiveParagraph
              ? activeWordIndex - wordOffsetBefore(material.paragraphs, index)
              : -1;

            return isActiveParagraph ? (
              <HighlightedText
                activeWordIndex={localWordIndex}
                className="leading-[var(--a11y-line-height)] tracking-[var(--a11y-letter-spacing)]"
                key={paragraph}
                text={paragraph}
              />
            ) : (
              <p
                className="leading-[var(--a11y-line-height)] tracking-[var(--a11y-letter-spacing)]"
                key={paragraph}
              >
                {paragraph}
              </p>
            );
          })}
        </article>

        <Card className="flex flex-col gap-3 p-4">
          <div className="flex items-center gap-2 font-medium text-sm">
            <Sparkles aria-hidden="true" className="size-4 text-primary" />
            Belajar lebih lanjut
          </div>
          <p className="text-muted-foreground text-sm">
            Ubah materi ini menjadi poin-poin sederhana, lalu uji pemahamanmu
            dengan kuis singkat.
          </p>
          <div className="grid gap-2 sm:grid-cols-3">
            <Link
              className="w-full"
              params={{ materialId: material.id }}
              to="/materi/$materialId/ringkasan"
            >
              <Button className="min-h-11 w-full text-sm" variant="outline">
                <Sparkles aria-hidden="true" /> Sederhanakan
              </Button>
            </Link>
            <Link
              className="w-full"
              params={{ materialId: material.id }}
              to="/materi/$materialId/flashcard"
            >
              <Button className="min-h-11 w-full text-sm" variant="outline">
                <Layers aria-hidden="true" /> Kartu Belajar
              </Button>
            </Link>
            <Link
              className="w-full"
              params={{ materialId: material.id }}
              to="/materi/$materialId/kuis"
            >
              <Button className="min-h-11 w-full text-sm" variant="outline">
                <ListChecks aria-hidden="true" /> Mulai Kuis
              </Button>
            </Link>
          </div>
        </Card>
      </main>

      {/* Bottom action bar — kontrol ramah jempol, tetap di atas tab bar. */}
      <div className="fixed inset-x-0 bottom-[calc(3.5rem+env(safe-area-inset-bottom))] z-30 border-t bg-background/95 px-3 py-2 backdrop-blur supports-[backdrop-filter]:bg-background/80 md:bottom-0">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-2">
          <Link to="/pustaka">
            <Button aria-label="Kembali ke Pustaka" size="sm" variant="ghost">
              <ArrowLeft aria-hidden="true" /> Pustaka
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <FocusModeToggle />
            <Button
              aria-pressed={readingRulerEnabled}
              onClick={toggleRuler}
              size="sm"
              variant={readingRulerEnabled ? "default" : "outline"}
            >
              <Ruler aria-hidden="true" /> Pemandu
            </Button>
            <ExplainSheet
              hasSelection={hasSelection}
              materialTitle={material.title}
              onRequestText={getSelectedText}
            />
            <ReaderSettingsSheet />
          </div>
        </div>
      </div>

      {/* Pemutar TTS mengambang di atas action bar. */}
      <div className="fixed inset-x-0 bottom-[calc(7rem+env(safe-area-inset-bottom))] z-30 md:bottom-14">
        <div className="mx-auto max-w-2xl px-3">
          <div className="rounded-xl border bg-background/95 p-3 shadow-lg backdrop-blur">
            <TtsControls
              isSpeaking={isSpeaking}
              isSupported={isSupported}
              onRateChange={setRate}
              onToggle={toggleSpeak}
              rate={rate}
            />
          </div>
        </div>
      </div>
    </>
  );
}

/** Jumlah kata pada semua paragraf sebelum indeks `paragraphIndex`. */
function wordOffsetBefore(
  paragraphs: string[],
  paragraphIndex: number
): number {
  let total = 0;
  for (let index = 0; index < paragraphIndex; index += 1) {
    total += tokenizeWords(paragraphs[index] ?? "").length;
  }
  return total;
}

/** Menentukan indeks paragraf dari posisi karakter global. */
function paragraphIndexFromChar(
  paragraphs: string[],
  charIndex: number
): number {
  let cursor = 0;
  for (let index = 0; index < paragraphs.length; index += 1) {
    const paragraph = paragraphs[index] ?? "";
    const length = paragraph.length + 2; // +2 untuk pemisah "\n\n".
    if (charIndex < cursor + length) {
      return index;
    }
    cursor += length;
  }
  return paragraphs.length - 1;
}
