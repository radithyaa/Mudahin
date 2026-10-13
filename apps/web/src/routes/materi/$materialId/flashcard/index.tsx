import type { Flashcard } from "@mudahin/api/schemas";
import { Button } from "@mudahin/ui/components/button";
import { Card } from "@mudahin/ui/components/card";
import { Skeleton } from "@mudahin/ui/components/skeleton";
import { cn } from "@mudahin/ui/lib/utils";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Check,
  Layers,
  RefreshCw,
  RotateCcw,
  Volume2,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { materialToText, resolveMaterialById } from "@/lib/materials/seed";
import { offlineKey } from "@/lib/offline/idb";
import type { FocusNeed } from "@/lib/stores/focus-profile";
import { useFocusProfile } from "@/lib/stores/focus-profile-store";

import { TTS_RATE_DEFAULT, TtsControls } from "../../components/tts-controls";
import {
  aiErrorMessage,
  readOfflineFlashcards,
  useFlashcards,
  useOfflineSync,
} from "../../hooks/use-ai";
import { useOfflineFallback } from "../../hooks/use-offline-fallback";
import { useTextToSpeech } from "../../hooks/use-text-to-speech";

export const Route = createFileRoute("/materi/$materialId/flashcard/")({
  component: FlashcardComponent,
  loader: async ({ params }) => {
    const material = await resolveMaterialById(params.materialId);
    if (!material) {
      throw notFound();
    }
    return { material };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `Kartu Belajar: ${loaderData?.material.title ?? "Materi"}` },
    ],
  }),
});

function FlashcardComponent() {
  const { material } = Route.useLoaderData();
  const needs = useFocusProfile((s) => s.needs);
  const profile = (needs[0] as FocusNeed | undefined) ?? undefined;

  const flashcards = useFlashcards();
  const { mutate, isPending, isError, error, data } = flashcards;

  // Salin ke penyimpanan luring saat berhasil (FR-PRF-06).
  useOfflineSync(offlineKey.flashcards(material.id), data);

  const requestKey = `${material.id}|${profile ?? ""}`;
  const requestKeyRef = useRef<string | null>(null);

  const generate = useCallback(
    (force = false) => {
      if (!force && requestKeyRef.current === requestKey) {
        return;
      }
      requestKeyRef.current = requestKey;
      mutate({ level: "sederhana", profile, text: materialToText(material) });
    },
    [material, mutate, profile, requestKey]
  );

  useEffect(() => {
    generate();
  }, [generate]);

  const offlineDeck = useOfflineFallback(
    isError,
    material.id,
    readOfflineFlashcards
  );
  const deck = data ?? offlineDeck;

  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [known, setKnown] = useState<string[]>([]);

  const cards = deck?.cards ?? [];
  const current = cards[index];

  const { cancel, isSpeaking, isSupported, speak } = useTextToSpeech({
    rate: TTS_RATE_DEFAULT,
  });

  // Reset posisi bila dek berubah (mis. setelah "Coba lagi").
  useEffect(() => {
    setIndex(0);
    setFlipped(false);
  }, []);

  const goNext = useCallback(() => {
    setFlipped(false);
    setIndex((value) => Math.min(value + 1, Math.max(cards.length - 1, 0)));
  }, [cards.length]);

  const goPrev = useCallback(() => {
    setFlipped(false);
    setIndex((value) => Math.max(value - 1, 0));
  }, []);

  const speakCard = useCallback(() => {
    if (!current) {
      return;
    }
    if (isSpeaking) {
      cancel();
      return;
    }
    speak(`${current.term}. ${current.definition}`);
  }, [cancel, current, isSpeaking, speak]);
  const handleFlip = useCallback(() => {
    if (flipped && current) {
      const { id } = current;
      setKnown((list) => (list.includes(id) ? list : [...list, id]));
      goNext();
      return;
    }
    setFlipped((value) => !value);
  }, [current, flipped, goNext]);

  const handleRateChange = useCallback(() => undefined, []);
  const handleResetKnown = useCallback(() => setKnown([]), []);

  const retry = useCallback(() => {
    requestKeyRef.current = null;
    generate(true);
  }, [generate]);

  const isLast = index >= cards.length - 1;

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-5 px-4 py-5 pb-28 sm:gap-6 sm:py-6">
      <div>
        <Link
          className="inline-flex min-h-11 items-center gap-1 text-muted-foreground text-sm hover:text-foreground"
          params={{ materialId: material.id }}
          to="/materi/$materialId"
        >
          <ArrowLeft aria-hidden="true" className="size-4" /> Kembali ke materi
        </Link>
      </div>

      <header className="flex flex-col gap-2">
        <span className="flex items-center gap-2 font-medium text-primary text-sm">
          <Layers aria-hidden="true" className="size-4" /> Kartu Belajar
        </span>
        <h1 className="font-bold text-xl sm:text-2xl">
          {deck?.deckTitle ?? material.title}
        </h1>
        <p className="text-muted-foreground text-sm">
          Ketuk kartu untuk melihat jawabannya. Dibuat otomatis dari materi.
        </p>
      </header>

      {isPending && !deck ? <FlashcardSkeleton /> : null}

      {isError && !deck ? (
        <ErrorCard
          materialId={material.id}
          message={aiErrorMessage(error)}
          onRetry={retry}
        />
      ) : null}

      {offlineDeck && isError ? (
        <p className="text-muted-foreground text-xs" role="status">
          Ditampilkan dari simpanan luring — koneksi sedang tidak tersedia.
        </p>
      ) : null}

      {current ? (
        <>
          <p
            className="text-center text-muted-foreground text-xs"
            role="status"
          >
            Kartu {index + 1} dari {cards.length}
          </p>

          <FlashcardFace
            card={current}
            flipped={flipped}
            onFlip={handleFlip}
            onSpeak={speakCard}
            speakEnabled={isSupported}
          />

          <CardProgress knownCount={known.length} total={cards.length} />

          <div className="flex items-center gap-3">
            <Button
              aria-label="Kartu sebelumnya"
              className="min-h-12"
              disabled={index === 0}
              onClick={goPrev}
              variant="outline"
            >
              <ArrowLeft aria-hidden="true" />
            </Button>
            <Button className="min-h-12 flex-1" onClick={handleFlip}>
              {flipped ? (
                <>
                  <Check aria-hidden="true" /> Sudah paham
                </>
              ) : (
                "Lihat jawaban"
              )}
            </Button>
            <Button
              aria-label="Kartu berikutnya"
              className="min-h-12"
              disabled={isLast}
              onClick={goNext}
              variant="outline"
            >
              <ArrowRight aria-hidden="true" />
            </Button>
          </div>

          {isSupported ? (
            <TtsControls
              isSpeaking={isSpeaking}
              isSupported={isSupported}
              onRateChange={handleRateChange}
              onToggle={speakCard}
              rate={TTS_RATE_DEFAULT}
            />
          ) : null}

          {known.length === cards.length && cards.length > 0 ? (
            <Card className="flex flex-col items-center gap-2 border-primary bg-primary/5 p-5 text-center">
              <p className="font-medium">
                Semua kartu sudah kamu tandai paham! 🎉
              </p>
              <Button
                className="min-h-11"
                onClick={handleResetKnown}
                variant="outline"
              >
                <RotateCcw aria-hidden="true" /> Ulangi dari awal
              </Button>
            </Card>
          ) : null}
        </>
      ) : null}
    </main>
  );
}

function CardProgress({
  knownCount,
  total,
}: {
  knownCount: number;
  total: number;
}) {
  return (
    <div
      aria-label={`Kemajuan kartu: ${knownCount} dari ${total} dikuasai`}
      aria-valuemax={total}
      aria-valuemin={0}
      aria-valuenow={knownCount}
      className="h-2 w-full overflow-hidden rounded-full bg-muted"
      role="progressbar"
    >
      <div
        className="h-full rounded-full bg-primary transition-[width] duration-300"
        style={{
          width: `${total === 0 ? 0 : (knownCount / total) * 100}%`,
        }}
      />
    </div>
  );
}

function ErrorCard({
  message,
  materialId,
  onRetry,
}: {
  message: string;
  materialId: string;
  onRetry: () => void;
}) {
  return (
    <Card className="flex flex-col gap-3 border-destructive/40 bg-destructive/5 p-4">
      <div className="flex items-center gap-2 font-medium text-destructive text-sm">
        <AlertTriangle aria-hidden="true" className="size-4" />
        Kartu belum bisa dibuat
      </div>
      <p className="text-muted-foreground text-sm">
        {message} Materimu tetap bisa dibaca seperti biasa.
      </p>
      <div className="flex flex-wrap gap-2">
        <Button className="min-h-11" onClick={onRetry} variant="outline">
          <RefreshCw aria-hidden="true" /> Coba lagi
        </Button>
        <Link params={{ materialId }} to="/materi/$materialId">
          <Button className="min-h-11" variant="ghost">
            Baca materi asli
          </Button>
        </Link>
      </div>
    </Card>
  );
}

function FlashcardFace({
  card,
  flipped,
  onFlip,
  onSpeak,
  speakEnabled,
}: {
  card: Flashcard;
  flipped: boolean;
  onFlip: () => void;
  onSpeak: () => void;
  speakEnabled: boolean;
}) {
  const label = flipped ? "Jawaban" : "Kata kunci";
  const text = flipped ? card.definition : card.term;

  return (
    <div className="flex flex-col gap-2">
      <button
        aria-label={`Kartu belajar. ${label}: ${text}. Ketuk untuk ${
          flipped ? "melihat kata kunci" : "melihat jawaban"
        }.`}
        aria-pressed={flipped}
        className={cn(
          "flex min-h-56 w-full cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border p-6 text-center transition-colors",
          flipped
            ? "border-primary bg-primary/5"
            : "border-border bg-card hover:bg-muted"
        )}
        onClick={onFlip}
        type="button"
      >
        <span className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
          {label}
        </span>
        <span className="font-semibold text-2xl leading-snug sm:text-3xl">
          {text}
        </span>
        <span className="text-muted-foreground text-xs">
          Ketuk untuk membalik
        </span>
      </button>

      {speakEnabled ? (
        <button
          aria-label="Bacakan kartu ini"
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg text-muted-foreground text-sm hover:text-foreground"
          onClick={onSpeak}
          type="button"
        >
          <Volume2 aria-hidden="true" className="size-4" /> Bacakan kartu
        </button>
      ) : null}
    </div>
  );
}

function FlashcardSkeleton() {
  return (
    <div className="flex flex-col gap-3" role="status">
      <Skeleton className="h-56 w-full rounded-2xl" />
      <Skeleton className="h-4 w-1/3 self-center" />
      <span className="sr-only">Membuat kartu belajar, mohon tunggu.</span>
    </div>
  );
}
