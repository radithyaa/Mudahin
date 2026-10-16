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

/**
 * Flashcard hasil AI (FR-LEA-04) — Should-Have.
 * Satu kartu berisi pertanyaan singkat + jawaban, diturunkan dari materi.
 */
export const flashcardSchema = z.object({
  id: z.string().min(1),
  term: z.string().min(1),
  definition: z.string().min(1),
});
export type Flashcard = z.infer<typeof flashcardSchema>;

export const flashcardDeckSchema = z.object({
  deckTitle: z.string().min(1),
  cards: z.array(flashcardSchema).min(1, "Minimal satu kartu"),
  cached: z.boolean(),
});
export type FlashcardDeck = z.infer<typeof flashcardDeckSchema>;

export const rawFlashcardResponseSchema = z.object({
  deckTitle: z.string(),
  cards: z.array(
    z.object({
      term: z.string(),
      definition: z.string(),
    })
  ),
});

/**
 * Bentuk input ke `ocrToFlashcards` (Future F3): foto catatan tulisan tangan.
 * Gambar dikirim sebagai data URL base64 (`data:image/*;base64,...`).
 * Batas ~4 MB cukup untuk foto HP dan menjaga payload tRPC tetap wajar.
 */
export const OCR_IMAGE_MAX_BYTES = 4_000_000;

export const ocrToFlashcardsInputSchema = z.object({
  imageDataUrl: z
    .string()
    .min(1, "Gambar tidak boleh kosong")
    .max(
      Math.ceil(OCR_IMAGE_MAX_BYTES * 1.4),
      "Gambar terlalu besar (maksimal 4 MB)"
    )
    .regex(
      /^data:image\/(png|jpeg|jpg|webp);base64,/,
      "Format gambar harus PNG, JPEG, atau WEBP"
    ),
  profile: focusProfileIdSchema.optional(),
  /** Bahasa/aksen saat menyalin tulisan (opsional, membantu OCR). */
  hint: z.string().max(200).optional(),
});
export type OcrToFlashcardsInput = z.infer<typeof ocrToFlashcardsInputSchema>;

/** Hasil OCR → flashcards: teks terbaca + dek kartu. */
export const ocrFlashcardResultSchema = flashcardDeckSchema.extend({
  /** Teks mentah hasil pembacaan tulisan tangan (ditampilkan untuk koreksi). */
  extractedText: z.string(),
});
export type OcrFlashcardResult = z.infer<typeof ocrFlashcardResultSchema>;

/** Bentuk mentah dari Gemini: teks terbaca + dek kartu. */
export const rawOcrFlashcardResponseSchema = z.object({
  extractedText: z.string(),
  deckTitle: z.string(),
  cards: z.array(
    z.object({
      term: z.string(),
      definition: z.string(),
    })
  ),
});

/**
 * Input Text-to-Speech server-side (FR-AUD-01..03, fallback WebView mobile).
 *
 * Diperlukan karena WebView Android/Tauri umumnya tidak menyediakan mesin suara
 * perangkat. Teks dibatasi agar biaya & latensi tetap terkendali.
 */
export const TTS_MAX_CHARS = 1500;

export const synthesizeSpeechInputSchema = z.object({
  text: z
    .string()
    .min(1, "Teks tidak boleh kosong")
    .max(
      TTS_MAX_CHARS,
      `Teks terlalu panjang (maksimal ${TTS_MAX_CHARS} karakter)`
    ),
  /** Kecepatan bicara untuk ditampilkan/dicatat; mesin suara memakai tempo bawaannya. */
  rate: z.number().min(0.5).max(2).optional(),
});
export type SynthesizeSpeechInput = z.infer<typeof synthesizeSpeechInputSchema>;

/** Hasil TTS: audio WAV base64 (`data:audio/wav;base64,…`) siap diputar. */
export const synthesizeSpeechResultSchema = z.object({
  audioDataUrl: z.string().min(1),
  mimeType: z.string().min(1),
});
export type SynthesizeSpeechResult = z.infer<
  typeof synthesizeSpeechResultSchema
>;

/**
 * Input Speech-to-Text server-side (FR-AUD-04).
 *
 * Klip dikirim sebagai data URL base64 dari `MediaRecorder`. Batas ~3 MB jauh
 * melebihi kebutuhan rekaman 30 detik, namun tetap melindungi Worker.
 */
export const STT_MAX_BYTES = 3_000_000;

export const transcribeSpeechInputSchema = z.object({
  audioDataUrl: z
    .string()
    .min(1, "Rekaman tidak boleh kosong")
    .max(
      Math.ceil(STT_MAX_BYTES * 1.4),
      "Rekaman terlalu besar (maksimal 3 MB)"
    )
    .regex(
      /^data:audio\/[a-z0-9.+-]+(?:;[^,]*)?;base64,/i,
      "Rekaman harus berupa audio base64"
    ),
});
export type TranscribeSpeechInput = z.infer<typeof transcribeSpeechInputSchema>;

/** Hasil STT: teks yang terdengar (bisa kosong bila tidak ada suara). */
export const transcribeSpeechResultSchema = z.object({
  text: z.string(),
});
export type TranscribeSpeechResult = z.infer<
  typeof transcribeSpeechResultSchema
>;

/**
 * Evaluasi jawaban lisan (FR-AUD-04 lanjutan).
 *
 * Setelah STT menghasilkan transkrip, server menilai apakah jawabannya sudah
 * benar. Penilaian dibuat **deterministik di sini** (tanpa AI) agar hemat kuota
 * dan keputusannya konsisten: cocokkan kata kunci yang diharapkan pada ucapan.
 * Ini juga membuat jawaban benar tetap dihargai saat perangkat sedang luring.
 */
export const evaluateVoiceAnswerInputSchema = z.object({
  /** Pertanyaan yang diajukan (dipakai untuk umpan balik & riwayat). */
  question: z.string().trim().min(1).max(500),
  /** Transkrip jawaban lisan pengguna. */
  transcript: z.string().trim().min(1).max(2000),
  /** Kata kunci yang diharapkan muncul pada jawaban yang benar. */
  expectedKeywords: z.array(z.string().trim().min(1).max(60)).min(1).max(30),
  /** Contoh jawaban bagus — dipakai saat jawaban belum tepat. */
  sampleAnswer: z.string().trim().max(500).optional(),
});
export type EvaluateVoiceAnswerInput = z.infer<
  typeof evaluateVoiceAnswerInputSchema
>;

/** Hasil penilaian jawaban lisan. */
export const voiceEvaluationSchema = z.object({
  correct: z.boolean(),
  feedback: z.string().min(1),
  /** Kata kunci yang benar-benar terucap (untuk umpan balik ramah). */
  matchedKeywords: z.array(z.string()),
  /** Kata kunci yang belum terucap — dipakai menyusun saran. */
  missingKeywords: z.array(z.string()),
});
export type VoiceEvaluation = z.infer<typeof voiceEvaluationSchema>;
