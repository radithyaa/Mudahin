/**
 * Materi demo. Sumber utama adalah server (prosedur tRPC `materials.list`),
 * tetapi salinan statis disimpan di sini sebagai **fallback luring** supaya
 * demo tetap berjalan saat jaringan mati (SRS §4.5 strategi ketahanan demo).
 *
 * Salinan ini identik dengan `SEED_MATERIALS` di `@mudahin/api/materials`.
 */
import type { Material } from "@mudahin/api/materials";
import { SEED_MATERIALS } from "@mudahin/api/materials";

export const FALLBACK_MATERIALS: Material[] = SEED_MATERIALS;

export function getFallbackMaterialById(id: string): Material | undefined {
  return FALLBACK_MATERIALS.find((material) => material.id === id);
}

/** Menggabungkan paragraf materi menjadi satu teks (untuk dikirim ke AI). */
export function materialToText(material: Material): string {
  return material.paragraphs.join("\n\n");
}
