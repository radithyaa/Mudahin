import type {
  FlashcardDeck,
  MindMap,
  QuizResult,
  SimplifyResult,
} from "@mudahin/api/schemas";
import { useMutation } from "@tanstack/react-query";
import { useEffect } from "react";

import {
  getOfflineValue,
  offlineKey,
  setOfflineValue,
} from "@/lib/offline/idb";
import { trpc } from "@/utils/trpc";

/**
 * Hook AI untuk fitur materi. Semua panggilan melewati tRPC → Worker →
 * DeepSeek (Aturan Teknis §4.3: komponen tidak memanggil AI langsung).
 */

export function useSimplify() {
  return useMutation(trpc.ai.simplify.mutationOptions());
}

export function useQuiz() {
  return useMutation(trpc.ai.quiz.mutationOptions());
}

export function useExplain() {
  return useMutation(trpc.ai.explain.mutationOptions());
}

export function useMindMap() {
  return useMutation(trpc.ai.mindMap.mutationOptions());
}

export function useFlashcards() {
  return useMutation(trpc.ai.flashcards.mutationOptions());
}

/** Pesan ramah untuk error AI — UI menampilkan banner, bukan layar kosong. */
export function aiErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return "AI sedang sibuk, coba lagi sebentar lagi.";
}

/**
 * Menyalin hasil AI yang berhasil ke penyimpanan luring (FR-PRF-06).
 * Dipanggil saat data siap, sehingga demo berikutnya bisa jalan tanpa jaringan.
 */
export function useOfflineSync<T>(
  key: string,
  data: T | undefined | null
): void {
  useEffect(() => {
    if (data) {
      setOfflineValue(key, data).catch(() => undefined);
    }
  }, [data, key]);
}

/**
 * Membaca salinan luring sebagai fallback saat AI gagal (mis. offline).
 * Mengembalikan `null` bila tidak ada.
 */
export function readOfflineSummary(
  materialId: string
): Promise<SimplifyResult | null> {
  return getOfflineValue<SimplifyResult>(offlineKey.summary(materialId));
}

export function readOfflineQuiz(
  materialId: string
): Promise<QuizResult | null> {
  return getOfflineValue<QuizResult>(offlineKey.quiz(materialId));
}

export function readOfflineMindMap(
  materialId: string
): Promise<MindMap | null> {
  return getOfflineValue<MindMap>(offlineKey.mindMap(materialId));
}

export function readOfflineFlashcards(
  materialId: string
): Promise<FlashcardDeck | null> {
  return getOfflineValue<FlashcardDeck>(offlineKey.flashcards(materialId));
}
