import { learningProgress } from "@mudahin/db/schema/ai-cache";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";

import { publicProcedure, router } from "../index";

/**
 * Progres belajar ringan per perangkat (FR-PRF-05).
 *
 * Pemakaian anonim: kunci = `materialId`. Ringkasan progres dibaca Beranda/Profil
 * dan tetap dilapisi state lokal (localStorage) di klien, sehingga aplikasi
 * tetap berfungsi tanpa jaringan (SRS §4.5).
 */
export const progressRouter = router({
  /** Menyimpan progres satu materi; menyimpan skor terbaik & menambah hitungan kuis. */
  record: publicProcedure
    .input(
      z.object({
        materialId: z.string().min(1),
        score: z.number().int().min(0).max(100),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const nowIso = new Date().toISOString();
      const [existing] = await ctx.db
        .select()
        .from(learningProgress)
        .where(eq(learningProgress.id, input.materialId))
        .limit(1);

      const bestScore = Math.max(existing?.bestScore ?? 0, input.score);
      const quizCount = (existing?.quizCount ?? 0) + 1;

      await ctx.db
        .insert(learningProgress)
        .values({
          id: input.materialId,
          materialId: input.materialId,
          lastActivityAt: nowIso,
          bestScore,
          quizCount,
        })
        .onConflictDoUpdate({
          target: learningProgress.id,
          set: {
            bestScore,
            quizCount,
            lastActivityAt: nowIso,
            updatedAt: new Date(),
          },
        });

      return { bestScore, materialId: input.materialId, quizCount };
    }),

  /** Ringkasan progres untuk Beranda & Profil. */
  summary: publicProcedure.query(async ({ ctx }) => {
    const rows = await ctx.db
      .select({
        materialId: learningProgress.materialId,
        bestScore: learningProgress.bestScore,
        quizCount: learningProgress.quizCount,
        lastActivityAt: learningProgress.lastActivityAt,
      })
      .from(learningProgress)
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
            items.reduce((sum, item) => sum + item.bestScore, 0) / items.length
          );

    return {
      items,
      quizzedCount: items.length,
      averageScore,
    };
  }),
});
