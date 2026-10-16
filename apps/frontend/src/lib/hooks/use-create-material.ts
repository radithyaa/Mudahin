import type { MaterialInput } from "@mudahin/api/materials";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useDeviceIdentity } from "../stores/device-identity-store";
import { trpc } from "../trpc";

/** Bentuk input dari halaman Belajar: tanpa `deviceId` (disuntik otomatis). */
type CreateMaterialPayload = Omit<MaterialInput, "id"> & { id?: string };

/**
 * Menyimpan materi baru ke database (`materials.create`).
 *
 * Dipakai halaman Beranda setelah "Olah Materi dengan Teman AI" menghasilkan
 * ringkasan & kuis. Materi diikat ke identitas perangkat (`deviceId`) agar
 * pustaka tetap sama setiap kali aplikasi dibuka. Setelah sukses, daftar
 * pustaka (`materials.list`) di-invalidate agar materi baru langsung tampil.
 */
export function useCreateMaterial() {
  const queryClient = useQueryClient();
  const deviceId = useDeviceIdentity((state) => state.deviceId);

  const mutation = useMutation(
    trpc.materials.create.mutationOptions({
      onSuccess: () => queryClient.invalidateQueries(),
    })
  );

  /** Menandai materi dengan identitas perangkat sebelum dikirim ke server. */
  const create = (
    input: CreateMaterialPayload,
    options?: Parameters<typeof mutation.mutate>[1]
  ) => mutation.mutate({ ...input, deviceId }, options);

  /** Varian `mutateAsync` agar halaman Belajar bisa menunggu `created.id`. */
  const createAsync = (input: CreateMaterialPayload) =>
    mutation.mutateAsync({ ...input, deviceId });

  return { ...mutation, mutate: create, mutateAsync: createAsync };
}
