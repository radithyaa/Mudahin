import type { QuizQuestion } from "@mudahin/api/schemas";
import { create } from "zustand";

/**
 * Menyimpan hasil sesi kuis sementara di memori (per tab).
 *
 * Dipakai untuk mengoper jawaban dari halaman Kuis ke halaman Hasil tanpa
 * menaruh jawaban di URL.
 */
export interface QuizResultEntry {
  answerIndex: number | null;
  question: QuizQuestion;
}

interface QuizState {
  cached: boolean;
  entries: QuizResultEntry[];
  materialId: string | null;
  reset: () => void;
  setResult: (
    materialId: string,
    entries: QuizResultEntry[],
    cached: boolean
  ) => void;
}

export const useQuizStore = create<QuizState>((set) => ({
  cached: false,
  entries: [],
  materialId: null,
  reset: () => set({ cached: false, entries: [], materialId: null }),
  setResult: (materialId, entries, cached) =>
    set({ cached, entries, materialId }),
}));

/** Menghitung skor (0–100) dari daftar jawaban. */
export function scoreOf(entries: QuizResultEntry[]): number {
  if (entries.length === 0) {
    return 0;
  }
  const correct = entries.filter(
    (entry) => entry.answerIndex === entry.question.answerIndex
  ).length;
  return Math.round((correct / entries.length) * 100);
}
