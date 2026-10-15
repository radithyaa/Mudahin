import type { Material } from "@mudahin/api/materials";

import {
  getOfflineValue,
  offlineKey,
  setOfflineValue,
} from "@/lib/offline/idb";

/**
 * Cache materi untuk mode luring (FR-PRF-06).
 *
 * Daftar materi milik pengguna dari server disalin ke IndexedDB begitu berhasil
 * dimuat, sehingga Pustaka & Focus Reader tetap dapat dibuka saat jaringan mati
 * — sesuai janji banner "materi & kuis terakhir tetap tersedia dari perangkat".
 *
 * Tidak ada lagi seed dummy: bila perangkat belum pernah memuat materi dari
 * server, cache kosong dan UI menampilkan keadaan kosong yang sebenarnya.
 */

/** Menyimpan daftar materi lengkap ke penyimpanan luring (best-effort). */
export async function cacheMaterials(materials: Material[]): Promise<void> {
  if (materials.length === 0) {
    return;
  }
  await setOfflineValue(offlineKey.materials, materials);
}

/** Membaca daftar materi yang tersimpan luring, atau `null` bila belum ada. */
export function readCachedMaterials(): Promise<Material[] | null> {
  return getOfflineValue<Material[]>(offlineKey.materials);
}
