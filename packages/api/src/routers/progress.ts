import { deviceIdSchema } from "@mudahin/api/backup";
import {
  gamificationState,
  learningProgress,
  voiceAttempts,
} from "@mudahin/db/schema/ai-cache";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";

import { publicProcedure, router } from "../index";
import {
  evaluateVoiceAnswer,
  nextStreak,
  TRANSCRIPT_DISPLAY_MAX_CHARS,
  toDateOnly,
} from "../voice";

/**
 * Progres belajar per perangkat (FR-PRF-05).
 *
 * Tanpa akun, kepemilikan progres mengikuti **identitas perangkat** (`deviceId`)
 * yang dikirim klien. State lokal tetap menjadi sumber utama di klien sehingga
 * aplikasi berfungsi tanpa jaringan (SRS §4.5); prosedur ini menjaga agar
 * perangkat yang sama selalu menemukan progresnya lagi.
 */

/** Kepemilikan progres: id sesi bila login, selain itu identitas perangkat. */
function ownerIdFrom(
  ctx: { session: { user: { id: string } } | null },
  deviceId: string
): string {
  return ctx.session?.user.id ?? deviceId;
}

export const progressRouter = router({
  /** Menyimpan progres satu materi; menyimpan skor terbaik & menambah hitungan kuis. */
  record: publicProcedure
    .input(
      z.object({
        deviceId: deviceIdSchema,
        materialId: z.string().min(1),
        score: z.number().int().min(0).max(100),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ownerIdFrom(ctx, input.deviceId);
      const nowIso = new Date().toISOString();
      const [existing] = await ctx.db
        .select()
        .from(learningProgress)
        .where(eq(learningProgress.id, input.materialId))
        .limit(1);

      // Skor & hitungan hanya diwarisi bila baris itu memang milik perangkat ini;
      // kalau tidak, mulai dari nol agar progres tidak tercampur antar perangkat.
      const isSameOwner = existing === undefined || existing.userId === userId;
      const bestScore = isSameOwner
        ? Math.max(existing?.bestScore ?? 0, input.score)
        : input.score;
      const quizCount = (isSameOwner ? (existing?.quizCount ?? 0) : 0) + 1;

      await ctx.db
        .insert(learningProgress)
        .values({
          id: input.materialId,
          userId,
          materialId: input.materialId,
          lastActivityAt: nowIso,
          bestScore,
          quizCount,
        })
        .onConflictDoUpdate({
          target: learningProgress.id,
          set: {
            userId,
            bestScore,
            quizCount,
            lastActivityAt: nowIso,
            updatedAt: new Date(),
          },
        });

      return { bestScore, materialId: input.materialId, quizCount };
    }),

  /** Ringkasan progres untuk Beranda & Profil. */
  summary: publicProcedure
    .input(z.object({ deviceId: deviceIdSchema }))
    .query(async ({ ctx, input }) => {
      const rows = await ctx.db
        .select({
          materialId: learningProgress.materialId,
          bestScore: learningProgress.bestScore,
          quizCount: learningProgress.quizCount,
          lastActivityAt: learningProgress.lastActivityAt,
        })
        .from(learningProgress)
        .where(eq(learningProgress.userId, ownerIdFrom(ctx, input.deviceId)))
        .orderBy(desc(learningProgress.updatedAt))
        .limit(50);

      const items = rows.map((row) => ({
        materialId: row.materialId,
        bestScore: row.bestScore ?? 0,
        quizCount: row.quizCount,
        lastActivityAt: row.lastActivityAt,
      }));

      const averageScore =
        items.length === 0
          ? 0
          : Math.round(
              items.reduce((sum, item) => sum + item.bestScore, 0) /
                items.length
            );

      return {
        items,
        quizzedCount: items.length,
        averageScore,
      };
    }),

  /**
   * Reward XP + pembaruan rentetan harian.
   *
   * Sebelumnya XP hanya hidup di memori klien; prosedur ini menyimpannya agar
   * XP dan **progres harian** (tanggal aktivitas terakhir + rentetan) bertahan
   * lintas sesi dan ikut tercadangkan. Berlaku idempoten untuk rentetan: belajar
   * berkali-kali di hari yang sama tidak menambah hari.
   */
  reward: publicProcedure
    .input(
      z.object({
        deviceId: deviceIdSchema,
        amount: z.number().int().min(0).max(1000),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ownerIdFrom(ctx, input.deviceId);
      const now = new Date();
      const today = toDateOnly(now);
      const [existing] = await ctx.db
        .select()
        .from(gamificationState)
        .where(eq(gamificationState.id, userId))
        .limit(1);

      // Kepemilikan dijaga seperti `record`: perangkat lain mulai dari nol.
      const isSameOwner = existing === undefined || existing.userId === userId;
      const previousXp = isSameOwner ? (existing?.xp ?? 0) : 0;
      const streak = nextStreak({
        lastActiveDate: isSameOwner ? (existing?.lastActiveDate ?? null) : null,
        streakDays: isSameOwner ? (existing?.streakDays ?? 0) : 0,
        today,
      });

      const xp = previousXp + input.amount;

      await ctx.db
        .insert(gamificationState)
        .values({
          id: userId,
          userId,
          xp,
          lastActiveDate: streak.lastActiveDate,
          streakDays: streak.streakDays,
        })
        .onConflictDoUpdate({
          target: gamificationState.id,
          set: {
            userId,
            xp,
            lastActiveDate: streak.lastActiveDate,
            streakDays: streak.streakDays,
            updatedAt: now,
          },
        });

      return {
        lastActiveDate: streak.lastActiveDate,
        streakDays: streak.streakDays,
        xp,
      };
    }),

  /** Keadaan gamifikasi saat ini (XP, rentetan, tanggal aktivitas). */
  gamification: publicProcedure
    .input(z.object({ deviceId: deviceIdSchema }))
    .query(async ({ ctx, input }) => {
      const userId = ownerIdFrom(ctx, input.deviceId);
      const [row] = await ctx.db
        .select()
        .from(gamificationState)
        .where(eq(gamificationState.id, userId))
        .limit(1);

      return {
        lastActiveDate: row?.lastActiveDate ?? null,
        streakDays: row?.streakDays ?? 0,
        xp: row?.xp ?? 0,
      };
    }),

  /**
   * Menilai jawaban latihan "Jawab dengan Suara" dan mencatat riwayatnya.
   *
   * Penilaian deterministik (kata kunci) di server sehingga keputusan benar/salah
   * konsisten & tidak memakan kuota AI. Hasilnya disimpan agar halaman Riwayat
   * Latihan dapat menampilkan & mengulang percobaan sebelumnya.
   */
  recordVoiceAttempt: publicProcedure
    .input(
      z.object({
        deviceId: deviceIdSchema,
        materialId: z.string().min(1).max(120),
        materialTitle: z.string().min(1).max(120),
        question: z.string().min(1).max(500),
        expectedKeywords: z.array(z.string().min(1).max(60)).min(1).max(30),
        sampleAnswer: z.string().max(500).optional(),
        transcript: z.string().max(2000),
        /** Mode ulangan dari riwayat: dinilai & dicatat, tetapi tanpa XP. */
        replay: z.boolean().default(false),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ownerIdFrom(ctx, input.deviceId);
      const evaluation = evaluateVoiceAnswer({
        expectedKeywords: input.expectedKeywords,
        sampleAnswer: input.sampleAnswer,
        transcript: input.transcript,
      });

      await ctx.db.insert(voiceAttempts).values({
        id: crypto.randomUUID(),
        userId,
        materialId: input.materialId,
        materialTitle: input.materialTitle,
        question: input.question,
        transcript: input.transcript.slice(0, TRANSCRIPT_DISPLAY_MAX_CHARS),
        correct: evaluation.correct,
        feedback: evaluation.feedback,
        replay: input.replay,
      });

      return evaluation;
    }),

  /** Riwayat latihan lisan milik perangkat ini, terbaru lebih dulu. */
  voiceHistory: publicProcedure
    .input(
      z.object({
        deviceId: deviceIdSchema,
        materialId: z.string().min(1).max(120).optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const userId = ownerIdFrom(ctx, input.deviceId);
      const rows = await ctx.db
        .select()
        .from(voiceAttempts)
        .where(eq(voiceAttempts.userId, userId))
        .orderBy(desc(voiceAttempts.createdAt))
        .limit(100);

      const items = rows
        .filter(
          (row) =>
            input.materialId === undefined ||
            row.materialId === input.materialId
        )
        .map((row) => ({
          id: row.id,
          materialId: row.materialId,
          materialTitle: row.materialTitle,
          question: row.question,
          transcript: row.transcript,
          correct: row.correct,
          feedback: row.feedback,
          replay: row.replay,
          createdAt: row.createdAt.toISOString(),
        }));

      return {
        items,
        correctCount: items.filter((item) => item.correct).length,
        totalCount: items.length,
      };
    }),
});
