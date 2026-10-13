import type { Material } from "@mudahin/api/materials";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";

import { cacheMaterials, readCachedMaterials } from "@/lib/materials/cache";
import { FALLBACK_MATERIALS } from "@/lib/materials/seed";
import { trpc } from "@/utils/trpc";

/**
 * Sumber materi tunggal untuk Pustaka & Beranda (FR-PRF-04 + FR-PRF-06).
 *
 * Urutan prioritas:
 * 1. Server (`materials.list`) — sumber kebenaran saat daring.
 * 2. Salinan luring (IndexedDB) — bila permintaan server gagal.
 * 3. Seed statis — jaring pengaman terakhir supaya demo tak pernah kosong.
 *
 * Hasil daring selalu disalin ke IndexedDB agar mode luring berikutnya bekerja.
 */
export function useMaterials(): {
  isLoading: boolean;
  materials: Material[];
  source: "server" | "offline" | "seed";
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
    if (serverMaterials) {
      cacheMaterials(serverMaterials).catch(() => undefined);
    }
  }, [serverMaterials]);

  if (serverMaterials && serverMaterials.length > 0) {
    return {
      isLoading: false,
      materials: serverMaterials,
      source: "server",
    };
  }

  if (cached.data && cached.data.length > 0) {
    return {
      isLoading: materialsQuery.isPending,
      materials: cached.data,
      source: "offline",
    };
  }

  return {
    isLoading: materialsQuery.isPending,
    materials: FALLBACK_MATERIALS,
    source: "seed",
  };
}
