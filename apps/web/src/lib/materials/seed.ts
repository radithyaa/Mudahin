/**
 * Materi demo. Sumber utama adalah server (prosedur tRPC `materials.list`),
 * tetapi salinan statis disimpan di sini sebagai **fallback luring** supaya
 * demo tetap berjalan saat jaringan mati (SRS §4.5 strategi ketahanan demo).
 *
 * Salinan ini identik dengan `SEED_MATERIALS` di `@mudahin/api/materials`.
 */
import type { Material } from "@mudahin/api/materials";
import { SEED_MATERIALS } from "@mudahin/api/materials";

import { readCachedMaterialById } from "@/lib/materials/cache";

export const FALLBACK_MATERIALS: Material[] = SEED_MATERIALS;

export function getFallbackMaterialById(id: string): Material | undefined {
  return FALLBACK_MATERIALS.find((material) => material.id === id);
}

/**
 * Resolver materi untuk loader route (FR-PRF-06).
 *
 * Saat daring, materi berasal dari seed server (identik). Saat luring, salinan
 * IndexedDB dipakai lebih dulu agar contoh materi terbaru tetap terbaca tanpa
 * jaringan; seed statis menjadi jaring pengaman terakhir.
 */
export async function resolveMaterialById(
  id: string
): Promise<Material | undefined> {
  const cached = await readCachedMaterialById(id).catch(() => null);
  return cached ?? getFallbackMaterialById(id);
}

/** Menggabungkan paragraf materi menjadi satu teks (untuk dikirim ke AI). */
export function materialToText(material: Material): string {
  return material.paragraphs.join("\n\n");
}
