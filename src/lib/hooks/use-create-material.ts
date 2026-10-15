import { useMutation, useQueryClient } from "@tanstack/react-query";

import { trpc } from "../trpc";

/**
 * Menyimpan materi baru ke database (`materials.create`).
 *
 * Dipakai halaman Beranda setelah "Olah Materi dengan Teman AI" menghasilkan
 * ringkasan & kuis. Setelah sukses, daftar pustaka (`materials.list`)
 * di-invalidate agar materi baru langsung tampil dari sumber kebenaran (DB).
 */
export function useCreateMaterial() {
  const queryClient = useQueryClient();
  return useMutation(
    trpc.materials.create.mutationOptions({
      onSuccess: () => queryClient.invalidateQueries(),
    })
  );
}
