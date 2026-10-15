import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { trpc } from "../trpc";

/**
 * Progres belajar per materi (FR-PRF-05).
 *
 * `record` menyimpan skor kuis terbaik; `summary` memberi ringkasan untuk
 * Beranda & Profil (rata-rata skor, jumlah materi dikerjakan).
 */
export function useProgressSummary() {
  return useQuery(trpc.progress.summary.queryOptions());
}

export function useRecordProgress() {
  const queryClient = useQueryClient();
  return useMutation(
    trpc.progress.record.mutationOptions({
      onSuccess: () => queryClient.invalidateQueries(),
    })
  );
}
