import type { Material } from "@mudahin/api/materials";

import {
  getOfflineValue,
  offlineKey,
  setOfflineValue,
} from "@/lib/offline/idb";

/**
 * Cache materi untuk mode luring (FR-PRF-06).
 *
 * Daftar materi dari server disalin ke IndexedDB begitu berhasil dimuat,
 * sehingga Pustaka & Focus Reader tetap dapat dibuka saat jaringan mati —
 * sesuai janji banner "materi & kuis terakhir tetap tersedia dari perangkat".
 *
 * Dipakai lintas fitur (pustaka, materi, beranda) sehingga berada di `lib/`.
 */

/**
 * Menggabungkan satu materi ke daftar yang ada (upsert berdasarkan id).
 * Fungsi murni agar mudah diuji tanpa IndexedDB.
 */
export function mergeMaterial(
  existing: Material[],
  material: Material
): Material[] {
  return [...existing.filter((item) => item.id !== material.id), material];
}

/** Menyimpan daftar materi lengkap ke penyimpanan luring (best-effort). */
export async function cacheMaterials(materials: Material[]): Promise<void> {
  if (materials.length === 0) {
    return;
  }
  await setOfflineValue(offlineKey.materials, materials);
}

/**
 * Menambahkan/memperbarui satu materi pada salinan luring tanpa menghapus
 * materi lain yang sudah tersimpan.
 */
export async function upsertCachedMaterial(material: Material): Promise<void> {
  const existing = (await readCachedMaterials()) ?? [];
  await setOfflineValue(
    offlineKey.materials,
    mergeMaterial(existing, material)
  );
}

/** Membaca daftar materi yang tersimpan luring, atau `null` bila belum ada. */
export function readCachedMaterials(): Promise<Material[] | null> {
  return getOfflineValue<Material[]>(offlineKey.materials);
}

/** Mencari satu materi di salinan luring. */
export async function readCachedMaterialById(
  materialId: string
): Promise<Material | null> {
  const materials = await readCachedMaterials();
  return materials?.find((material) => material.id === materialId) ?? null;
}
