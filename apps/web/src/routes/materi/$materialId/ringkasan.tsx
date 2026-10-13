import type { MindMap } from "@mudahin/api/schemas";
import { Button } from "@mudahin/ui/components/button";
import { Card } from "@mudahin/ui/components/card";
import { Skeleton } from "@mudahin/ui/components/skeleton";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowLeft,
  GitBranch,
  ListChecks,
  ListOrdered,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { materialToText, resolveMaterialById } from "@/lib/materials/seed";
import { offlineKey } from "@/lib/offline/idb";
import type { FocusNeed } from "@/lib/stores/focus-profile";
import { useFocusProfile } from "@/lib/stores/focus-profile-store";
import { HighlightedText } from "../components/highlighted-text";
import { MindMapView } from "../components/mind-map-view";
import { TTS_RATE_DEFAULT, TtsControls } from "../components/tts-controls";
import {
  aiErrorMessage,
  readOfflineSummary,
  useMindMap,
  useOfflineSync,
  useSimplify,
} from "../hooks/use-ai";
import { useOfflineFallback } from "../hooks/use-offline-fallback";
import {
  tokenizeWords,
  useTextToSpeech,
  wordIndexFromChar,
} from "../hooks/use-text-to-speech";

export const Route = createFileRoute("/materi/$materialId/ringkasan")({
  component: RingkasanComponent,
  loader: async ({ params }) => {
    const material = await resolveMaterialById(params.materialId);
    if (!material) {
      throw notFound();
    }
    return { material };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `Ringkasan AI: ${loaderData?.material.title ?? "Materi"}` },
    ],
  }),
});

type ViewMode = "poin" | "peta";

function RingkasanComponent() {
  const { material } = Route.useLoaderData();
  const needs = useFocusProfile((s) => s.needs);
  const [mode, setMode] = useState<ViewMode>("poin");

  const profile = (needs[0] as FocusNeed | undefined) ?? undefined;
  const level = needs.includes("kendala-bahasa")
    ? "sangat-sederhana"
    : "sederhana";

  const simplify = useSimplify();
  const mindMapQuery = useMindMap();

  // Ambil fungsi `mutate` yang identitasnya stabil agar tidak memicu
  // render/effect berulang ketika objek mutation berubah (lihat catatan di bawah).
  const { mutate: simplifyMutate } = simplify;
  const { mutate: mindMapMutate } = mindMapQuery;

  // Salin ke penyimpanan luring saat berhasil (FR-PRF-06).
  useOfflineSync(offlineKey.summary(material.id), simplify.data);
  useOfflineSync(offlineKey.mindMap(material.id), mindMapQuery.data);

  // Kunci permintaan: hanya kirim ulang saat materi/profil/level benar-benar berubah.
  const requestKey = `${material.id}|${level}|${profile ?? ""}`;
  const summaryKeyRef = useRef<string | null>(null);
  const mindMapKeyRef = useRef<string | null>(null);

  const requestSummary = useCallback(
    (force = false) => {
      if (!force && summaryKeyRef.current === requestKey) {
        return;
      }
      summaryKeyRef.current = requestKey;
      simplifyMutate({ level, profile, text: materialToText(material) });
    },
    [level, material, profile, requestKey, simplifyMutate]
  );

  const requestMindMap = useCallback(() => {
    if (mindMapKeyRef.current === requestKey) {
      return;
    }
    mindMapKeyRef.current = requestKey;
    mindMapMutate({ level, profile, text: materialToText(material) });
  }, [level, material, profile, requestKey, mindMapMutate]);

  // Jalankan sekali per materi saat halaman dibuka.
  useEffect(() => {
    requestSummary();
  }, [requestSummary]);

  // Peta pikiran diambil saat tab "peta" pertama kali dibuka.
  useEffect(() => {
    if (mode === "peta") {
      requestMindMap();
    }
  }, [mode, requestMindMap]);

  // Fallback luring untuk ringkasan bila AI gagal.
  const offlineSummary = useOfflineFallback(
    simplify.isError,
    material.id,
    readOfflineSummary
  );

  const summary = simplify.data ?? offlineSummary;

  const [rate, setRate] = useState(TTS_RATE_DEFAULT);
  const [activeWordIndex, setActiveWordIndex] = useState(-1);
  const spokenText = useMemo(() => summary?.points.join(". ") ?? "", [summary]);
  const tokens = useMemo(() => tokenizeWords(spokenText), [spokenText]);

  const { cancel, isSpeaking, isSupported, speak } = useTextToSpeech({
    onBoundary: (charIndex) =>
      setActiveWordIndex(wordIndexFromChar(tokens, charIndex, -1)),
    rate,
  });

  const toggleSpeak = useCallback(() => {
    if (isSpeaking) {
      cancel();
      return;
    }
    speak(spokenText);
  }, [cancel, isSpeaking, speak, spokenText]);

  // Tombol "Coba lagi": reset ref agar permintaan dikirim ulang.
  const retrySummary = useCallback(() => {
    summaryKeyRef.current = null;
    requestSummary(true);
  }, [requestSummary]);

  const retryMindMap = useCallback(() => {
    mindMapKeyRef.current = null;
    requestMindMap();
  }, [requestMindMap]);

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
          <Sparkles aria-hidden="true" className="size-4" /> Ringkasan Sederhana
        </span>
        <h1 className="font-bold text-xl sm:text-2xl">{material.title}</h1>
        <p className="text-muted-foreground text-sm">
          Versi bahasa yang lebih mudah dipahami, dibuat dengan bantuan AI.
        </p>
      </header>

      {/* Pemilih tampilan: poin-poin atau peta pikiran */}
      <div
        aria-label="Pilih tampilan ringkasan"
        className="grid grid-cols-2 gap-2 rounded-lg border p-1"
        role="tablist"
      >
        <ViewTab
          icon={ListOrdered}
          isActive={mode === "poin"}
          label="Poin-poin"
          onChoose={setMode}
          value="poin"
        />
        <ViewTab
          icon={GitBranch}
          isActive={mode === "peta"}
          label="Peta Pikiran"
          onChoose={setMode}
          value="peta"
        />
      </div>

      {mode === "poin" ? (
        <SummaryPoints
          activeWordIndex={activeWordIndex}
          errorMessage={
            simplify.isError ? aiErrorMessage(simplify.error) : null
          }
          isPending={simplify.isPending}
          isSpeaking={isSpeaking}
          isSupported={isSupported}
          materialId={material.id}
          meta={summaryMeta(Boolean(offlineSummary), summary?.cached ?? false)}
          onRateChange={setRate}
          onRetry={retrySummary}
          onToggleSpeak={toggleSpeak}
          points={summary?.points ?? null}
          rate={rate}
          spokenText={spokenText}
        />
      ) : (
        <MindMapPanel
          errorMessage={
            mindMapQuery.isError ? aiErrorMessage(mindMapQuery.error) : null
          }
          isPending={mindMapQuery.isPending}
          materialId={material.id}
          mindMap={mindMapQuery.data ?? null}
          onRetry={retryMindMap}
        />
      )}

      <Link
        className="w-full"
        params={{ materialId: material.id }}
        to="/materi/$materialId/kuis"
      >
        <Button className="min-h-12 w-full" size="lg">
          <ListChecks aria-hidden="true" /> Uji dengan Kuis
        </Button>
      </Link>
    </main>
  );
}

function summaryMeta(
  isOffline: boolean,
  isCached: boolean
): "offline" | "cached" | null {
  if (isOffline) {
    return "offline";
  }
  return isCached ? "cached" : null;
}

function SummaryPoints({
  activeWordIndex,
  errorMessage,
  isPending,
  isSpeaking,
  isSupported,
  materialId,
  meta,
  onRateChange,
  onRetry,
  onToggleSpeak,
  points,
  rate,
  spokenText,
}: {
  activeWordIndex: number;
  errorMessage: string | null;
  isPending: boolean;
  isSpeaking: boolean;
  isSupported: boolean;
  materialId: string;
  meta: "offline" | "cached" | null;
  onRateChange: (rate: number) => void;
  onRetry: () => void;
  onToggleSpeak: () => void;
  points: string[] | null;
  rate: number;
  spokenText: string;
}) {
  if (isPending && !points) {
    return <SummarySkeleton />;
  }

  if (errorMessage && !points) {
    return (
      <ErrorCard
        materialId={materialId}
        message={errorMessage}
        onRetry={onRetry}
      />
    );
  }

  if (!points) {
    return null;
  }

  return (
    <>
      {meta ? (
        <p className="text-muted-foreground text-xs" role="status">
          {meta === "offline"
            ? "Ditampilkan dari simpanan luring."
            : "Ditampilkan dari cache — siap saat koneksi lambat."}
        </p>
      ) : null}

      <Card className="flex flex-col gap-4 p-4">
        <h2 className="font-semibold text-lg">Poin-poin penting</h2>
        {isSpeaking ? (
          <HighlightedText
            activeWordIndex={activeWordIndex}
            className="leading-[var(--a11y-line-height)] tracking-[var(--a11y-letter-spacing)]"
            text={spokenText}
          />
        ) : (
          <ol className="flex list-decimal flex-col gap-3 pl-5">
            {points.map((point) => (
              <li
                className="leading-[var(--a11y-line-height)] tracking-[var(--a11y-letter-spacing)]"
                key={point}
              >
                {point}
              </li>
            ))}
          </ol>
        )}
      </Card>

      <div className="fixed inset-x-0 bottom-[calc(3.5rem+env(safe-area-inset-bottom))] z-30 border-t bg-background/95 px-3 py-2 backdrop-blur md:static md:bottom-0 md:border-0 md:bg-transparent md:p-0 md:backdrop-blur-none">
        <div className="mx-auto max-w-2xl">
          <TtsControls
            isSpeaking={isSpeaking}
            isSupported={isSupported}
            onRateChange={onRateChange}
            onToggle={onToggleSpeak}
            rate={rate}
          />
        </div>
      </div>
    </>
  );
}

function MindMapPanel({
  errorMessage,
  isPending,
  materialId,
  mindMap,
  onRetry,
}: {
  errorMessage: string | null;
  isPending: boolean;
  materialId: string;
  mindMap: MindMap | null;
  onRetry: () => void;
}) {
  if (isPending && !mindMap) {
    return <SummarySkeleton />;
  }
  if (errorMessage && !mindMap) {
    return (
      <ErrorCard
        materialId={materialId}
        message={errorMessage}
        onRetry={onRetry}
      />
    );
  }
  return mindMap ? <MindMapView mindMap={mindMap} /> : null;
}

function ViewTab({
  icon: Icon,
  isActive,
  label,
  value,
  onChoose,
}: {
  icon: typeof GitBranch;
  isActive: boolean;
  label: string;
  onChoose: (mode: ViewMode) => void;
  value: ViewMode;
}) {
  const handleSelect = useCallback(() => onChoose(value), [onChoose, value]);
  return (
    <button
      aria-selected={isActive}
      className={`flex min-h-11 items-center justify-center gap-2 rounded-md font-medium text-sm transition-colors ${
        isActive
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:bg-muted"
      }`}
      onClick={handleSelect}
      role="tab"
      type="button"
    >
      <Icon aria-hidden="true" className="size-4" />
      {label}
    </button>
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
        Belum bisa dibuat
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

function SummarySkeleton() {
  return (
    <Card className="flex flex-col gap-3 p-4" role="status">
      <Skeleton className="h-5 w-40" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
      <Skeleton className="h-4 w-4/6" />
      <span className="sr-only">Membuat ringkasan, mohon tunggu.</span>
    </Card>
  );
}
