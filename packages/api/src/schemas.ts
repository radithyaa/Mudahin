import { z } from "zod";

/**
 * Kontrak bersama (DTO) untuk fitur AI — dipakai client & server.
 *
 * Output LLM mentah **tidak pernah** dipercaya: setiap respons DeepSeek
 * divalidasi dengan skema di bawah sebelum dikirim ke client (Aturan Teknis §6.4).
 */

/** Batas panjang input teks ke AI (Aturan Teknis §5.5). */
export const AI_INPUT_MAX_CHARS = 8000;

/** Versi prompt — naikkan bila isi prompt berubah (cache key ikut berubah). */
export const PROMPT_VERSION = "v1";

export const focusProfileIdSchema = z.enum([
  "disleksia",
  "adhd",
  "low-vision",
  "kendala-bahasa",
]);
export type FocusProfileId = z.infer<typeof focusProfileIdSchema>;

/** Bentuk input ke `simplify`: teks materi + tingkat kesederhanaan. */
export const simplifyInputSchema = z.object({
  text: z
    .string()
    .min(1, "Teks tidak boleh kosong")
    .max(AI_INPUT_MAX_CHARS, "Teks terlalu panjang"),
  level: z.enum(["sederhana", "sangat-sederhana"]).default("sederhana"),
  profile: focusProfileIdSchema.optional(),
});
export type SimplifyInput = z.infer<typeof simplifyInputSchema>;

/** Hasil penyederhanaan — poin-poin ringkas (FR-AI-02). */
export const simplifyResultSchema = z.object({
  points: z.array(z.string().min(1)).min(1, "Minimal satu poin"),
  cached: z.boolean(),
});
export type SimplifyResult = z.infer<typeof simplifyResultSchema>;

/** Bentuk input ke `quiz`: teks materi + jumlah soal + profil untuk penyesuaian. */
export const quizInputSchema = z.object({
  text: z
    .string()
    .min(1, "Teks tidak boleh kosong")
    .max(AI_INPUT_MAX_CHARS, "Teks terlalu panjang"),
  count: z.number().int().min(1).max(10).default(3),
  profile: focusProfileIdSchema.optional(),
});
export type QuizInput = z.infer<typeof quizInputSchema>;

/** Satu soal pilihan ganda. */
export const quizQuestionSchema = z.object({
  id: z.string().min(1),
  question: z.string().min(1),
  options: z.array(z.string().min(1)).min(2).max(4),
  /** Indeks jawaban benar di dalam `options`. */
  answerIndex: z.number().int().min(0),
  explanation: z.string().min(1),
});
export type QuizQuestion = z.infer<typeof quizQuestionSchema>;

export const quizResultSchema = z.object({
  questions: z.array(quizQuestionSchema).min(1, "Minimal satu soal"),
  cached: z.boolean(),
});
export type QuizResult = z.infer<typeof quizResultSchema>;

/**
 * Bentuk mentah yang boleh dikembalikan LLM (tanpa `id`/`cached`).
 * Dipakai untuk memvalidasi JSON mode sebelum di-normalisasi di server.
 */
export const rawSimplifyResponseSchema = z.object({
  points: z.array(z.string()),
});

export const rawQuizResponseSchema = z.object({
  questions: z.array(
    z.object({
      question: z.string(),
      options: z.array(z.string()),
      answerIndex: z.number().int(),
      explanation: z.string(),
    })
  ),
});

/** Bentuk input ke `explain`: potongan teks + konteks materi (FR-AI-03). */
export const explainInputSchema = z.object({
  text: z
    .string()
    .min(1, "Teks tidak boleh kosong")
    .max(2000, "Potongan teks terlalu panjang"),
  context: z.string().max(AI_INPUT_MAX_CHARS).optional(),
  profile: focusProfileIdSchema.optional(),
});
export type ExplainInput = z.infer<typeof explainInputSchema>;

/** Hasil penjelasan potongan teks. */
export const explainResultSchema = z.object({
  explanation: z.string().min(1, "Penjelasan kosong"),
  cached: z.boolean(),
});
export type ExplainResult = z.infer<typeof explainResultSchema>;

export const rawExplainResponseSchema = z.object({
  explanation: z.string(),
});

/**
 * Struktur mind map bagi Ringkasan AI (FR-AI-04).
 * Bentuknya pohon sederhana (topik → cabang → daun) agar mudah digambar
 * sebagai diagram berarah tanpa library graf berat.
 */
export const mindMapLeafSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
});

export const mindMapBranchSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  leaves: z.array(mindMapLeafSchema),
});
export type MindMapBranch = z.infer<typeof mindMapBranchSchema>;

export const mindMapSchema = z.object({
  root: z.string().min(1),
  branches: z.array(mindMapBranchSchema).min(1, "Minimal satu cabang"),
  cached: z.boolean(),
});
export type MindMap = z.infer<typeof mindMapSchema>;

export const rawMindMapResponseSchema = z.object({
  root: z.string(),
  branches: z.array(
    z.object({
      label: z.string(),
      leaves: z.array(z.string()),
    })
  ),
});
