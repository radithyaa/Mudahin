import { z } from "zod";

/**
 * Kontrak materi pelajaran (FR-PRF-04).
 * Dipakai bersama client & server via prosedur tRPC `materials`.
 */
export const materialSchema = z.object({
  id: z.string(),
  title: z.string(),
  subject: z.string(),
  gradeLevel: z.string(),
  summary: z.string(),
  /** Estimasi waktu baca dalam menit. */
  readingMinutes: z.number(),
  /** Paragraf isi materi. */
  paragraphs: z.array(z.string()),
});
export type Material = z.infer<typeof materialSchema>;

/**
 * Input pembuatan materi dari hasil "Olah Materi dengan Teman AI".
 *
 * `id` opsional agar klien dapat memakai id yang dibuat server; bila kosong,
 * server menghasilkan id baru yang unik per pengguna.
 */
export const materialInputSchema = materialSchema.omit({ id: true }).extend({
  id: z.string().min(1).optional(),
  subject: z.string().min(1).max(40),
  gradeLevel: z.string().min(1).max(40),
  title: z.string().min(1).max(120),
  summary: z.string().min(1).max(400),
  readingMinutes: z.number().int().min(1).max(60),
  paragraphs: z.array(z.string().min(1).max(2000)).min(1).max(30),
});
export type MaterialInput = z.infer<typeof materialInputSchema>;

/** Menggabungkan paragraf materi menjadi satu teks untuk dikirim ke AI. */
export function materialToText(material: Material): string {
  return material.paragraphs.join("\n\n");
}
