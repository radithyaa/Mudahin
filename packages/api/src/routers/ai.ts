import { TRPCError } from "@trpc/server";

import {
  AiError,
  chatJson,
  chatJsonVision,
  type DeepSeekConfig,
  GEMINI_DEFAULT_BASE_URL,
  GEMINI_DEFAULT_MODEL,
  type GeminiConfig,
} from "../ai";
import { hashKey, readCache, writeCache } from "../cache";
import { publicProcedure, router } from "../index";
import {
  buildExplainMessages,
  buildFlashcardMessages,
  buildMindMapMessages,
  buildOcrFlashcardMessages,
  buildQuizMessages,
  buildSimplifyMessages,
} from "../prompts";
import {
  type ExplainResult,
  explainInputSchema,
  type Flashcard,
  type FlashcardDeck,
  flashcardDeckSchema,
  type MindMap,
  type MindMapBranch,
  mindMapSchema,
  type OcrFlashcardResult,
  ocrFlashcardResultSchema,
  ocrToFlashcardsInputSchema,
  PROMPT_VERSION,
  type QuizQuestion,
  type QuizResult,
  quizInputSchema,
  rawExplainResponseSchema,
  rawFlashcardResponseSchema,
  rawMindMapResponseSchema,
  rawOcrFlashcardResponseSchema,
  rawQuizResponseSchema,
  rawSimplifyResponseSchema,
  type SimplifyResult,
  simplifyInputSchema,
} from "../schemas";

/**
 * Router AI. Semua panggilan DeepSeek lewat sini (Aturan Teknis §4.3 & §6.8).
 *
 * Alur: cache D1 → (miss) DeepSeek JSON mode → validasi Zod → simpan cache → balas.
 * Kegagalan AI dikembalikan sebagai TRPCError dengan pesan Bahasa Indonesia
 * agar UI dapat menampilkan banner fallback (SRS §4.5 strategi ketahanan demo).
 */

type ApiContext = Parameters<
  Parameters<typeof publicProcedure.query>[0]
>[0]["ctx"];

function deepSeekConfig(ctx: ApiContext): DeepSeekConfig {
  const { env } = ctx;
  return {
    apiKey: env.DEEPSEEK_API_KEY ?? "",
    baseUrl: env.DEEPSEEK_BASE_URL ?? "https://api.deepseek.com",
    model: env.DEEPSEEK_MODEL ?? "deepseek-chat",
  };
}

/**
 * Konfigurasi Gemini — dipakai khusus oleh `ocrToFlashcards` (Future F3).
 * Base URL default adalah endpoint OpenAI-compatible Gemini, sehingga klien
 * HTTP di `ai.ts` bisa dipakai bersama DeepSeek.
 */
function geminiConfig(ctx: ApiContext): GeminiConfig {
  const { env } = ctx;
  return {
    apiKey: env.GEMINI_API_KEY ?? "",
    baseUrl: env.GEMINI_BASE_URL ?? GEMINI_DEFAULT_BASE_URL,
    model: env.GEMINI_MODEL ?? GEMINI_DEFAULT_MODEL,
  };
}

export const aiRouter = router({
  simplify: publicProcedure
    .input(simplifyInputSchema)
    .mutation(async ({ ctx, input, signal }): Promise<SimplifyResult> => {
      const key = await hashKey(
        "simplify",
        PROMPT_VERSION,
        JSON.stringify(input)
      );

      const cached = await readCache<SimplifyResult>(ctx.db, key);
      if (cached) {
        return { ...cached, cached: true };
      }

      const raw = await callAi(
        () =>
          chatJson({
            config: deepSeekConfig(ctx),
            messages: buildSimplifyMessages(input),
            signal,
          }),
        "Gagal menyederhanakan teks"
      );

      const parsed = rawSimplifyResponseSchema.safeParse(raw);
      if (!parsed.success) {
        throw new TRPCError({
          code: "BAD_GATEWAY",
          message: "Format ringkasan dari AI tidak sesuai.",
        });
      }

      const points = parsed.data.points
        .map((point) => point.trim())
        .filter((point) => point.length > 0)
        .slice(0, 6);

      if (points.length === 0) {
        throw new TRPCError({
          code: "BAD_GATEWAY",
          message: "AI tidak menghasilkan ringkasan.",
        });
      }

      const result: SimplifyResult = { points, cached: false };
      await writeCache(ctx.db, key, "simplify", { points });
      return result;
    }),

  quiz: publicProcedure
    .input(quizInputSchema)
    .mutation(async ({ ctx, input, signal }): Promise<QuizResult> => {
      const key = await hashKey("quiz", PROMPT_VERSION, JSON.stringify(input));

      const cached = await readCache<QuizResult>(ctx.db, key);
      if (cached) {
        return { ...cached, cached: true };
      }

      const raw = await callAi(
        () =>
          chatJson({
            config: deepSeekConfig(ctx),
            messages: buildQuizMessages(input),
            signal,
          }),
        "Gagal membuat kuis"
      );

      const parsed = rawQuizResponseSchema.safeParse(raw);
      if (!parsed.success) {
        throw new TRPCError({
          code: "BAD_GATEWAY",
          message: "Format soal dari AI tidak sesuai.",
        });
      }

      const questions = parsed.data.questions
        .map((question, index): QuizQuestion | null => {
          const options = question.options
            .map((option) => option.trim())
            .filter((option) => option.length > 0);
          if (options.length < 2) {
            return null;
          }
          const answerIndex =
            question.answerIndex >= 0 && question.answerIndex < options.length
              ? question.answerIndex
              : 0;
          return {
            id: `q${index + 1}`,
            question: question.question.trim(),
            options,
            answerIndex,
            explanation: question.explanation.trim(),
          };
        })
        .filter((question): question is QuizQuestion => question !== null)
        .slice(0, input.count);

      if (questions.length === 0) {
        throw new TRPCError({
          code: "BAD_GATEWAY",
          message: "AI tidak menghasilkan soal yang valid.",
        });
      }

      const result: QuizResult = { questions, cached: false };
      await writeCache(ctx.db, key, "quiz", { questions });
      return result;
    }),

  explain: publicProcedure
    .input(explainInputSchema)
    .mutation(async ({ ctx, input, signal }): Promise<ExplainResult> => {
      const key = await hashKey(
        "explain",
        PROMPT_VERSION,
        JSON.stringify(input)
      );

      const cached = await readCache<ExplainResult>(ctx.db, key);
      if (cached) {
        return { ...cached, cached: true };
      }

      const raw = await callAi(
        () =>
          chatJson({
            config: deepSeekConfig(ctx),
            messages: buildExplainMessages(input),
            signal,
          }),
        "Gagal menjelaskan teks"
      );

      const parsed = rawExplainResponseSchema.safeParse(raw);
      const explanation = parsed.success ? parsed.data.explanation.trim() : "";
      if (explanation.length === 0) {
        throw new TRPCError({
          code: "BAD_GATEWAY",
          message: "AI tidak menghasilkan penjelasan.",
        });
      }

      const result: ExplainResult = { explanation, cached: false };
      await writeCache(ctx.db, key, "explain", { explanation });
      return result;
    }),

  mindMap: publicProcedure
    .input(simplifyInputSchema)
    .mutation(async ({ ctx, input, signal }): Promise<MindMap> => {
      const key = await hashKey(
        "mindmap",
        PROMPT_VERSION,
        JSON.stringify(input)
      );

      const cached = await readCache<MindMap>(ctx.db, key);
      if (cached) {
        return { ...cached, cached: true };
      }

      const raw = await callAi(
        () =>
          chatJson({
            config: deepSeekConfig(ctx),
            messages: buildMindMapMessages(input),
            signal,
          }),
        "Gagal membuat peta pikiran"
      );

      const result = normalizeMindMap(raw);
      await writeCache(ctx.db, key, "mindmap", {
        root: result.root,
        branches: result.branches,
      });
      return result;
    }),

  flashcards: publicProcedure
    .input(simplifyInputSchema)
    .mutation(async ({ ctx, input, signal }): Promise<FlashcardDeck> => {
      const key = await hashKey(
        "flashcards",
        PROMPT_VERSION,
        JSON.stringify(input)
      );

      const cached = await readCache<FlashcardDeck>(ctx.db, key);
      if (cached) {
        return { ...cached, cached: true };
      }

      const raw = await callAi(
        () =>
          chatJson({
            config: deepSeekConfig(ctx),
            messages: buildFlashcardMessages(input),
            signal,
          }),
        "Gagal membuat kartu belajar"
      );

      const result = normalizeFlashcards(raw);
      await writeCache(ctx.db, key, "flashcards", {
        deckTitle: result.deckTitle,
        cards: result.cards,
      });
      return result;
    }),

  /**
   * Future F3: foto catatan tulisan tangan → teks (OCR) → dek kartu belajar.
   * Memakai **Gemini** (vision) alih-alih DeepSeek, karena Gemini unggul
   * membaca teks pada gambar. Klien mengirim gambar sebagai data URL base64.
   */
  ocrToFlashcards: publicProcedure
    .input(ocrToFlashcardsInputSchema)
    .mutation(async ({ ctx, input, signal }): Promise<OcrFlashcardResult> => {
      // Hash memakai ukuran + awalan data URL, bukan seluruh base64, agar
      // key tetap pendek dan stabil tanpa membuang waktu hashing MB data.
      const imageFingerprint = `${input.imageDataUrl.slice(0, 64)}|${input.imageDataUrl.length}`;
      const key = await hashKey(
        "ocr-flashcards",
        PROMPT_VERSION,
        JSON.stringify({
          imageFingerprint,
          profile: input.profile,
          hint: input.hint,
        })
      );

      const cached = await readCache<OcrFlashcardResult>(ctx.db, key);
      if (cached) {
        return { ...cached, cached: true };
      }

      const raw = await callAi(
        () =>
          chatJsonVision({
            config: geminiConfig(ctx),
            messages: buildOcrFlashcardMessages(input),
            signal,
          }),
        "Gagal membaca tulisan pada gambar"
      );

      const result = normalizeOcrFlashcards(raw);
      await writeCache(ctx.db, key, "ocr-flashcards", {
        deckTitle: result.deckTitle,
        cards: result.cards,
        extractedText: result.extractedText,
      });
      return result;
    }),
});

/** Menormalkan respons flashcard mentah menjadi dek yang valid (FR-LEA-04). */
function normalizeFlashcards(raw: unknown): FlashcardDeck {
  const parsed = rawFlashcardResponseSchema.safeParse(raw);
  if (!parsed.success) {
    throw new TRPCError({
      code: "BAD_GATEWAY",
      message: "Format kartu belajar dari AI tidak sesuai.",
    });
  }

  return buildDeck(parsed.data.deckTitle, parsed.data.cards);
}

/** Menormalkan respons OCR mentah (teks + kartu) menjadi hasil yang valid (F3). */
function normalizeOcrFlashcards(raw: unknown): OcrFlashcardResult {
  const parsed = rawOcrFlashcardResponseSchema.safeParse(raw);
  if (!parsed.success) {
    throw new TRPCError({
      code: "BAD_GATEWAY",
      message: "Format hasil pembacaan gambar tidak sesuai.",
    });
  }

  const extractedText = parsed.data.extractedText.trim();
  const cards = parsed.data.cards.filter(
    (card) => card.term.trim() && card.definition.trim()
  );

  if (!extractedText && cards.length === 0) {
    throw new TRPCError({
      code: "UNPROCESSABLE_CONTENT",
      message:
        "Tulisan pada gambar tidak terbaca. Coba foto ulang dengan pencahayaan lebih terang.",
    });
  }

  const deck = buildDeck(parsed.data.deckTitle, parsed.data.cards);
  return ocrFlashcardResultSchema.parse({
    ...deck,
    extractedText,
    cached: false,
  });
}

/** Membangun dek kartu ternormalisasi dari judul + kartu mentah. */
function buildDeck(
  rawTitle: string,
  rawCards: { term: string; definition: string }[]
): FlashcardDeck {
  const deckTitle = rawTitle.trim() || "Kartu Belajar";
  const cards = rawCards
    .map((card, index): Flashcard | null => {
      const term = card.term.trim();
      const definition = card.definition.trim();
      if (term.length === 0 || definition.length === 0) {
        return null;
      }
      return { id: `c${index + 1}`, term, definition };
    })
    .filter((card): card is Flashcard => card !== null)
    .slice(0, 6);

  if (cards.length === 0) {
    throw new TRPCError({
      code: "BAD_GATEWAY",
      message: "AI tidak menghasilkan kartu belajar yang valid.",
    });
  }

  return flashcardDeckSchema.parse({ deckTitle, cards, cached: false });
}

/** Menormalkan respons mind map mentah menjadi struktur pohon yang valid. */
function normalizeMindMap(raw: unknown): MindMap {
  const parsed = rawMindMapResponseSchema.safeParse(raw);
  if (!parsed.success) {
    throw new TRPCError({
      code: "BAD_GATEWAY",
      message: "Format peta pikiran dari AI tidak sesuai.",
    });
  }

  const root = parsed.data.root.trim();
  const branches = parsed.data.branches
    .map((branch, branchIndex) => {
      const label = branch.label.trim();
      if (label.length === 0) {
        return null;
      }
      return {
        id: `b${branchIndex + 1}`,
        label,
        leaves: branch.leaves
          .map((leaf) => leaf.trim())
          .filter((leaf) => leaf.length > 0)
          .slice(0, 3)
          .map((leaf, leafIndex) => ({
            id: `b${branchIndex + 1}-l${leafIndex + 1}`,
            label: leaf,
          })),
      };
    })
    .filter((branch): branch is MindMapBranch => branch !== null)
    .slice(0, 4);

  if (root.length === 0 || branches.length === 0) {
    throw new TRPCError({
      code: "BAD_GATEWAY",
      message: "AI tidak menghasilkan peta pikiran yang valid.",
    });
  }

  return mindMapSchema.parse({ root, branches, cached: false });
}

/** Menjalankan panggilan AI dan memetakan kegagalan ke TRPCError yang ramah UI. */
async function callAi<T>(
  run: () => Promise<T>,
  fallbackMessage: string
): Promise<T> {
  try {
    return await run();
  } catch (error) {
    if (error instanceof AiError && error.kind === "disabled") {
      const which = error.provider === "gemini" ? "Gemini" : "DeepSeek";
      // biome-ignore lint/style/useErrorCause: TRPCError menerima `cause` di opsi objeknya; rule belum mengenali kelas ini.
      throw new TRPCError({
        code: "PRECONDITION_FAILED",
        message: `Fitur AI (${which}) belum dikonfigurasi di server.`,
        cause: error,
      });
    }
    // biome-ignore lint/style/useErrorCause: TRPCError menerima `cause` di opsi objeknya; rule belum mengenali kelas ini.
    throw new TRPCError({
      code: "BAD_GATEWAY",
      message: `${fallbackMessage}. AI sedang sibuk, coba lagi.`,
      cause: error,
    });
  }
}
