import { Button } from "@mudahin/ui/components/button";
import { Card } from "@mudahin/ui/components/card";
import { cn } from "@mudahin/ui/lib/utils";
import {
  createFileRoute,
  Link,
  notFound,
  useNavigate,
} from "@tanstack/react-router";
import {
  AlertTriangle,
  Check,
  ListChecks,
  RefreshCw,
  Sparkles,
  X,
} from "lucide-react";
import { useCallback, useEffect } from "react";

import { resolveMaterialById } from "@/lib/materials/seed";
import { useProgressStore } from "@/lib/stores/progress-store";

import { useQuizStore } from "../stores/quiz-store";

export const Route = createFileRoute("/materi/$materialId/hasil")({
  component: HasilComponent,
  loader: async ({ params }) => {
    const material = await resolveMaterialById(params.materialId);
    if (!material) {
      throw notFound();
    }
    return { material };
  },
  head: ({ loaderData }) => ({
    meta: [{ title: `Hasil Kuis: ${loaderData?.material.title ?? "Materi"}` }],
  }),
});

function HasilComponent() {
  const { material } = Route.useLoaderData();
  const navigate = useNavigate();
  const { entries, materialId, reset } = useQuizStore();
  const recordQuiz = useProgressStore((s) => s.recordQuiz);

  const total = entries.length;
  const correctCount = entries.filter(
    (entry) => entry.answerIndex === entry.question.answerIndex
  ).length;
  const score = total > 0 ? Math.round((correctCount / total) * 100) : 0;

  // Simpan progres ke penyimpanan lokal (FR-PRF-05) — best score.
  useEffect(() => {
    if (materialId === material.id && entries.length > 0) {
      recordQuiz(material.id, score);
    }
  }, [entries.length, material.id, materialId, recordQuiz, score]);

  // Tanpa data sesi (mis. refresh halaman) → arahkan kembali ke kuis.
  useEffect(() => {
    if (materialId !== material.id || entries.length === 0) {
      navigate({
        params: { materialId: material.id },
        replace: true,
        to: "/materi/$materialId/kuis",
      });
    }
  }, [entries.length, material.id, materialId, navigate]);

  const retryWrong = useCallback(() => {
    reset();
    navigate({
      params: { materialId: material.id },
      to: "/materi/$materialId/kuis",
    });
  }, [material.id, navigate, reset]);

  if (materialId !== material.id || entries.length === 0) {
    return null;
  }

  const wrongEntries = entries.filter(
    (entry) => entry.answerIndex !== entry.question.answerIndex
  );
  const isGreat = score >= 80;

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-5 px-4 py-5 sm:gap-6 sm:py-6">
      <header className="flex flex-col gap-2">
        <span className="flex items-center gap-2 font-medium text-primary text-sm">
          <ListChecks aria-hidden="true" className="size-4" /> Hasil Kuis
        </span>
        <h1 className="font-bold text-xl sm:text-2xl">{material.title}</h1>
      </header>

      <Card
        className={cn(
          "flex flex-col items-center gap-2 p-6 text-center",
          isGreat ? "border-primary bg-primary/5" : ""
        )}
      >
        <p className="text-muted-foreground text-sm">Skor kamu</p>
        <p className="font-bold text-5xl">
          {score}
          <span className="sr-only"> dari 100</span>
        </p>
        <p className="text-muted-foreground text-sm">
          {correctCount} benar dari {total} soal
        </p>
        <p className="font-medium">
          {isGreat
            ? "Hebat! Kamu sudah paham materi ini. 🎉"
            : "Semangat! Ayo pelajari bagian yang belum pas."}
        </p>
      </Card>

      {wrongEntries.length > 0 ? (
        <section className="flex flex-col gap-3">
          <h2 className="font-semibold text-lg">
            Perlu diperbaiki ({wrongEntries.length})
          </h2>
          {wrongEntries.map((entry) => {
            const correctOption =
              entry.question.options[entry.question.answerIndex];
            const chosenOption =
              entry.answerIndex === null
                ? "Tidak dijawab"
                : entry.question.options[entry.answerIndex];
            return (
              <Card className="flex flex-col gap-3 p-4" key={entry.question.id}>
                <p className="font-medium">{entry.question.question}</p>
                <ul className="flex flex-col gap-2 text-sm">
                  <li className="flex items-start gap-2 text-destructive">
                    <X aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
                    <span>
                      Jawabanmu: <strong>{chosenOption}</strong>
                    </span>
                  </li>
                  <li className="flex items-start gap-2 text-primary">
                    <Check
                      aria-hidden="true"
                      className="mt-0.5 size-4 shrink-0"
                    />
                    <span>
                      Jawaban benar: <strong>{correctOption}</strong>
                    </span>
                  </li>
                </ul>
                <p className="rounded-lg bg-muted p-3 text-muted-foreground text-sm">
                  {entry.question.explanation}
                </p>
              </Card>
            );
          })}
        </section>
      ) : (
        <Card className="flex items-center gap-3 p-4">
          <Sparkles aria-hidden="true" className="size-5 text-primary" />
          <p className="text-sm">
            Semua jawaban benar! Coba materi lain untuk tantangan baru.
          </p>
        </Card>
      )}

      <div className="flex flex-col gap-2 sm:flex-row">
        {wrongEntries.length > 0 ? (
          <Button className="min-h-12 flex-1" onClick={retryWrong} size="lg">
            <RefreshCw aria-hidden="true" /> Ulangi Bagian Salah
          </Button>
        ) : null}
        <Link
          className="flex-1"
          params={{ materialId: material.id }}
          to="/materi/$materialId/ringkasan"
        >
          <Button className="min-h-12 w-full" size="lg" variant="outline">
            <Sparkles aria-hidden="true" /> Lihat Ringkasan
          </Button>
        </Link>
      </div>

      {wrongEntries.length > 0 ? (
        <p className="flex items-center justify-center gap-2 text-muted-foreground text-xs">
          <AlertTriangle aria-hidden="true" className="size-3.5" />
          Tips: baca ulang ringkasan, lalu ulangi kuis.
        </p>
      ) : null}
    </main>
  );
}
