import type { QuizQuestion } from "@mudahin/api/schemas";
import { Button } from "@mudahin/ui/components/button";
import { Card } from "@mudahin/ui/components/card";
import { Skeleton } from "@mudahin/ui/components/skeleton";
import {
  createFileRoute,
  Link,
  notFound,
  useNavigate,
} from "@tanstack/react-router";
import { AlertTriangle, ArrowLeft, ListChecks, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { getFallbackMaterialById, materialToText } from "@/lib/materials/seed";
import type { FocusNeed } from "@/lib/stores/focus-profile";
import { useFocusProfile } from "@/lib/stores/focus-profile-store";

import { QuizQuestionCard } from "../components/quiz-question-card";
import { TTS_RATE_DEFAULT } from "../components/tts-controls";
import { aiErrorMessage, readOfflineQuiz, useQuiz } from "../hooks/use-ai";
import { useOfflineFallback } from "../hooks/use-offline-fallback";
import {
  matchOptionIndex,
  useSpeechRecognition,
} from "../hooks/use-speech-recognition";
import { useTextToSpeech } from "../hooks/use-text-to-speech";
import { useQuizStore } from "../stores/quiz-store";

const QUESTION_COUNT = 4;

export const Route = createFileRoute("/materi/$materialId/kuis")({
  component: KuisComponent,
  loader: ({ params }) => {
    const material = getFallbackMaterialById(params.materialId);
    if (!material) {
      throw notFound();
    }
    return { material };
  },
  head: ({ loaderData }) => ({
    meta: [{ title: `Kuis: ${loaderData?.material.title ?? "Materi"}` }],
  }),
});

function KuisComponent() {
  const { material } = Route.useLoaderData();
  const navigate = useNavigate();
  const needs = useFocusProfile((s) => s.needs);
  const setResult = useQuizStore((s) => s.setResult);

  // Format adaptif (FR-LEA-02): profil audio/low-vision → soal dibacakan.
  const speakEnabled =
    needs.includes("low-vision") || needs.includes("kendala-bahasa");

  const quiz = useQuiz();
  const { mutate, isPending, isError, error, data } = quiz;

  const profile = (needs[0] as FocusNeed | undefined) ?? undefined;
  const requestKey = `${material.id}|${profile ?? ""}`;
  const requestKeyRef = useRef<string | null>(null);

  const generate = useCallback(
    (force = false) => {
      if (!force && requestKeyRef.current === requestKey) {
        return;
      }
      requestKeyRef.current = requestKey;
      mutate({
        text: materialToText(material),
        count: QUESTION_COUNT,
        profile,
      });
    },
    [material, mutate, profile, requestKey]
  );

  useEffect(() => {
    generate();
  }, [generate]);

  // Fallback luring bila AI gagal (FR-PRF-06).
  const offlineData = useOfflineFallback(isError, material.id, readOfflineQuiz);

  const quizData = data ?? offlineData;

  const [answers, setAnswers] = useState<Record<string, number>>({});

  const handleAnswer = useCallback(
    (questionId: string, optionIndex: number) => {
      setAnswers((current) => ({ ...current, [questionId]: optionIndex }));
    },
    []
  );

  const { cancel, isSpeaking, speak } = useTextToSpeech({
    rate: TTS_RATE_DEFAULT,
  });

  // Input jawaban via suara (FR-AUD-04).
  const voice = useSpeechRecognition();
  const [voiceTargetId, setVoiceTargetId] = useState<string | null>(null);
  const pendingVoiceRef = useRef<{
    options: string[];
    questionId: string;
  } | null>(null);

  const handleVoiceToggle = useCallback(
    (questionId: string, options: string[]) => {
      if (voice.isListening && voiceTargetId === questionId) {
        voice.stop();
        setVoiceTargetId(null);
        return;
      }
      setVoiceTargetId(questionId);
      // Hasil rekaman dicocokkan saat transkrip diperbarui (effect di bawah).
      pendingVoiceRef.current = { options, questionId };
      voice.start();
    },
    [voice, voiceTargetId]
  );

  // Ketika transkrip berubah, coba cocokkan ke sebuah opsi.
  useEffect(() => {
    const pending = pendingVoiceRef.current;
    if (!(pending && voice.transcript)) {
      return;
    }
    const matched = matchOptionIndex(voice.transcript, pending.options);
    if (matched >= 0) {
      handleAnswer(pending.questionId, matched);
      voice.cancel();
      setVoiceTargetId(null);
      pendingVoiceRef.current = null;
    }
  }, [handleAnswer, voice]);

  const speakQuestion = useCallback(
    (questionText: string) => {
      if (isSpeaking) {
        cancel();
        return;
      }
      speak(questionText);
    },
    [cancel, isSpeaking, speak]
  );

  const questions = quizData?.questions ?? [];
  const answeredCount = useMemo(
    () =>
      questions.filter((question) => answers[question.id] !== undefined).length,
    [answers, questions]
  );

  const handleSubmit = useCallback(() => {
    if (!quizData) {
      return;
    }
    const entries = quizData.questions.map((question) => ({
      answerIndex: answers[question.id] ?? null,
      question,
    }));
    setResult(material.id, entries, quizData.cached);
    cancel();
    navigate({
      params: { materialId: material.id },
      to: "/materi/$materialId/hasil",
    });
  }, [answers, cancel, material.id, navigate, quizData, setResult]);

  const handleRetry = useCallback(() => {
    requestKeyRef.current = null;
    generate(true);
  }, [generate]);

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
          <ListChecks aria-hidden="true" className="size-4" /> Kuis Adaptif
        </span>
        <h1 className="font-bold text-xl sm:text-2xl">{material.title}</h1>
        {speakEnabled ? (
          <p className="text-muted-foreground text-sm">
            Soal dapat dibacakan — tekan tombol suara di tiap soal.
          </p>
        ) : null}
      </header>

      {isPending && !quizData ? <QuizSkeleton /> : null}

      {isError && !quizData ? (
        <Card className="flex flex-col gap-3 border-destructive/40 bg-destructive/5 p-4">
          <div className="flex items-center gap-2 font-medium text-destructive text-sm">
            <AlertTriangle aria-hidden="true" className="size-4" />
            Kuis belum bisa dibuat
          </div>
          <p className="text-muted-foreground text-sm">
            {aiErrorMessage(error)} Tanpa internet, kuis terakhir tetap dapat
            dicoba dari simpanan perangkat.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              className="min-h-11"
              onClick={handleRetry}
              variant="outline"
            >
              <RefreshCw aria-hidden="true" /> Coba lagi
            </Button>
            <Link params={{ materialId: material.id }} to="/materi/$materialId">
              <Button className="min-h-11" variant="ghost">
                Kembali membaca
              </Button>
            </Link>
          </div>
        </Card>
      ) : null}

      {offlineData && isError ? (
        <p className="text-muted-foreground text-xs" role="status">
          Ditampilkan dari simpanan luring — koneksi sedang tidak tersedia.
        </p>
      ) : null}

      {questions.map((question, index) => (
        <QuizQuestionItem
          answers={answers}
          index={index}
          isListening={voice.isListening && voiceTargetId === question.id}
          key={question.id}
          onAnswer={handleAnswer}
          onSpeak={speakQuestion}
          onVoiceToggle={handleVoiceToggle}
          question={question}
          speakEnabled={speakEnabled}
          total={questions.length}
          voiceEnabled={voice.isSupported}
          voiceTranscript={
            voiceTargetId === question.id ? voice.transcript : ""
          }
        />
      ))}

      {questions.length > 0 ? (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t bg-background/95 px-3 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur md:static md:border-0 md:bg-transparent md:p-0">
          <div className="mx-auto flex max-w-2xl flex-col gap-2">
            <p
              className="text-center text-muted-foreground text-xs"
              role="status"
            >
              Terjawab {answeredCount} dari {questions.length}
            </p>
            <Button
              className="min-h-12 w-full"
              disabled={answeredCount === 0}
              onClick={handleSubmit}
              size="lg"
            >
              Lihat Hasil
            </Button>
          </div>
        </div>
      ) : null}
    </main>
  );
}

function QuizQuestionItem({
  answers,
  index,
  isListening,
  onAnswer,
  onSpeak,
  onVoiceToggle,
  question,
  speakEnabled,
  total,
  voiceEnabled,
  voiceTranscript,
}: {
  answers: Record<string, number>;
  index: number;
  isListening: boolean;
  onAnswer: (questionId: string, optionIndex: number) => void;
  onSpeak: (text: string) => void;
  onVoiceToggle: (questionId: string, options: string[]) => void;
  question: QuizQuestion;
  speakEnabled: boolean;
  total: number;
  voiceEnabled: boolean;
  voiceTranscript: string;
}) {
  const handleAnswer = useCallback(
    (optionIndex: number) => onAnswer(question.id, optionIndex),
    [onAnswer, question.id]
  );
  const handleSpeak = useCallback(
    () => onSpeak(question.question),
    [onSpeak, question.question]
  );
  const handleVoice = useCallback(
    () => onVoiceToggle(question.id, question.options),
    [onVoiceToggle, question.id, question.options]
  );

  return (
    <QuizQuestionCard
      index={index}
      isListening={isListening}
      onAnswer={handleAnswer}
      onSpeak={handleSpeak}
      onVoiceToggle={handleVoice}
      question={question}
      selectedIndex={answers[question.id] ?? null}
      speakEnabled={speakEnabled}
      total={total}
      voiceEnabled={voiceEnabled}
      voiceTranscript={voiceTranscript}
    />
  );
}

function QuizSkeleton() {
  return (
    <div className="flex flex-col gap-4" role="status">
      {[0, 1].map((key) => (
        <Card className="flex flex-col gap-3 p-4" key={key}>
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </Card>
      ))}
      <span className="sr-only">Membuat soal kuis, mohon tunggu.</span>
    </div>
  );
}
