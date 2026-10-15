import type { Material } from "@mudahin/api/materials";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";

import { toLearningModules } from "../api/materials";
import { cacheMaterials, readCachedMaterials } from "../materials/cache";
import { trpc } from "../trpc";

/**
 * Sumber materi tunggal untuk Pustaka & Beranda (FR-PRF-04 + FR-PRF-06).
 *
 * Urutan prioritas (mobile-first & tahan luring):
 * 1. Server (`materials.list`) — materi milik pengguna dari database.
 * 2. Salinan luring (IndexedDB) — bila permintaan server gagal.
 *
 * Tidak ada lagi seed demo: pustaka yang kosong berarti pengguna memang belum
 * memiliki materi, sehingga UI dapat menampilkan ajakan membuat materi.
 *
 * Hasil daring selalu disalin ke IndexedDB agar mode luring berikutnya bekerja.
 * Materi mentah (`Material`) diubah ke bentuk UI (`LearningModule`) di tepi ini.
 */
export function useMaterials(): {
  data: ReturnType<typeof toLearningModules> | undefined;
  error: unknown;
  isLoading: boolean;
  isError: boolean;
  isPending: boolean;
  source: "server" | "offline" | "empty";
} {
  const materialsQuery = useQuery(trpc.materials.list.queryOptions());
  const cached = useQuery({
    queryFn: readCachedMaterials,
    queryKey: ["offline-materials"],
    // Cukup sekali per sesi; tidak perlu polling penyimpanan lokal.
    staleTime: Number.POSITIVE_INFINITY,
  });

  const serverMaterials = materialsQuery.data;

  // Salin hasil server ke IndexedDB untuk pemakaian luring.
  useEffect(() => {
    if (serverMaterials && serverMaterials.length > 0) {
      cacheMaterials(serverMaterials).catch(() => undefined);
    }
  }, [serverMaterials]);

  const cachedMaterials: Material[] | undefined = cached.data ?? undefined;

  if (serverMaterials) {
    return {
      data: toLearningModules(serverMaterials),
      error: materialsQuery.error,
      isLoading: false,
      isError: false,
      isPending: false,
      source: "server",
    };
  }

  if (cachedMaterials && cachedMaterials.length > 0) {
    return {
      data: toLearningModules(cachedMaterials),
      error: materialsQuery.error,
      isLoading: materialsQuery.isPending,
      isError: false,
      isPending: materialsQuery.isPending,
      source: "offline",
    };
  }

  return {
    data: undefined,
    error: materialsQuery.error,
    isLoading: materialsQuery.isPending,
    isError: materialsQuery.isError,
    isPending: materialsQuery.isPending,
    source: "empty",
  };
}
