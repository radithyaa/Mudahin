import { useMutation } from "@tanstack/react-query";

import { trpc } from "../trpc";

/**
 * Hook panggilan AI ke backend (DeepSeek/Gemini). Semua hasil AI di-cache di D1
 * oleh server, jadi pemanggilan ulang input identik tidak memakan kuota.
 *
 * Mutasi (bukan query) karena AI hanya dijalankan saat diminta (lazy), bukan
 * saat render — ini menjaga biaya & waktu muat tetap terkendali.
 */
export function useAi() {
  const simplify = useMutation(trpc.ai.simplify.mutationOptions());
  const quiz = useMutation(trpc.ai.quiz.mutationOptions());
  const flashcards = useMutation(trpc.ai.flashcards.mutationOptions());
  const explain = useMutation(trpc.ai.explain.mutationOptions());
  const mindMap = useMutation(trpc.ai.mindMap.mutationOptions());
  const ocrToFlashcards = useMutation(
    trpc.ai.ocrToFlashcards.mutationOptions()
  );

  return { simplify, quiz, flashcards, explain, mindMap, ocrToFlashcards };
}
