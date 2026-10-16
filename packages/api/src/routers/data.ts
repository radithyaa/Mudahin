import {
  type AccessibilityBackup,
  BACKUP_LIMITS,
  EMPTY_GAMIFICATION,
  type GamificationBackup,
  gamificationBackupSchema,
} from "@mudahin/api/backup";
import {
  gamificationState,
  learningProgress,
} from "@mudahin/db/schema/ai-cache";
import { materials } from "@mudahin/db/schema/materials";
import { desc, eq, inArray, sql } from "drizzle-orm";
import { z } from "zod";

import { publicProcedure, router } from "../index";
import { type Material, materialInputSchema } from "../materials";

/**
 * Data lokal pengguna (tanpa akun) — **ekspor untuk cadangan & impor pemulihan**.
 *
 * Tanpa backend akun, seluruh data belajar hidup di perangkat. Dua prosedur di
 * sini menutup celah "mulai dari nol" saat pengguna berganti perangkat:
 *
 * 1. `export` — membaca apa yang tersimpan di server untuk `deviceId` ini.
 * 2. `import` — menulis snapshot hasil pemulihan kembali ke server.
 *
 * Pemisahan `deviceId` (identitas perangkat, acak & lokal) dari `syncId`
 * (kode cadangan yang diketik pengguna) membuat pemulihan lintas perangkat
 * bekerja: perangkat baru dengan `deviceId` berbeda menarik data milik kode
 * cadangan ke dirinya sendiri.
 */

/** Batas jumlah entri per permintaan, sejalan dengan batas snapshot. */
const EXPORT_MATERIAL_LIMIT = BACKUP_LIMITS.materials;
const EXPORT_PROGRESS_LIMIT = BACKUP_LIMITS.progressEntries;

const deviceIdSchema = z.string().trim().min(4).max(64);

const accessibilityBackupSchema = z.object({
  dyslexiaFont: z.boolean(),
  fontSize: z.enum(["sm", "md", "lg", "xl"]),
  readingRuler: z.boolean(),
  speechSpeed: z.number().min(0.5).max(2),
  warmTheme: z.boolean(),
});

/** Baris DB → kontrak `Material` (paragraf JSON diparse kembali). */
function toMaterial(row: {
  id: string;
  title: string;
  subject: string;
  gradeLevel: string;
  summary: string;
  readingMinutes: number;
  paragraphs: string;
}): Material {
  let paragraphs: string[] = [];
  try {
    const parsed: unknown = JSON.parse(row.paragraphs);
    if (Array.isArray(parsed)) {
      paragraphs = parsed.filter(
        (item): item is string => typeof item === "string"
      );
    }
  } catch {
    paragraphs = [];
  }

  return {
    id: row.id,
    title: row.title,
    subject: row.subject,
    gradeLevel: row.gradeLevel,
    summary: row.summary,
    readingMinutes: row.readingMinutes,
    paragraphs,
  };
}

/** Baris DB gamifikasi → kontrak cadangan (null berarti perangkat baru). */
function readGamification(
  row:
    | { lastActiveDate: string | null; streakDays: number; xp: number }
    | undefined
): GamificationBackup {
  if (!row) {
    return EMPTY_GAMIFICATION;
  }
  return {
    xp: row.xp,
    lastActiveDate: row.lastActiveDate,
    streakDays: row.streakDays,
  };
}

export const dataRouter = router({
  /**
   * Snapshot data pengguna untuk dijadikan kode cadangan.
   *
   * `accessibility` diterima dari klien (setelan memang hidup lokal); materi &
   * progres dibaca dari server agar ikut tercadangkan meskipun cache luring
   * perangkat sedang kosong.
   */
  export: publicProcedure
    .input(
      z.object({
        accessibility: accessibilityBackupSchema,
        deviceId: deviceIdSchema,
      })
    )
    .query(async ({ ctx, input }) => {
      const materialRows = await ctx.db
        .select()
        .from(materials)
        .where(eq(materials.userId, input.deviceId))
        .orderBy(desc(materials.createdAt))
        .limit(EXPORT_MATERIAL_LIMIT);

      const progressRows = await ctx.db
        .select({
          bestScore: learningProgress.bestScore,
          materialId: learningProgress.materialId,
        })
        .from(learningProgress)
        .where(eq(learningProgress.userId, input.deviceId))
        .orderBy(desc(learningProgress.updatedAt))
        .limit(EXPORT_PROGRESS_LIMIT);

      const [gamificationRow] = await ctx.db
        .select()
        .from(gamificationState)
        .where(eq(gamificationState.id, input.deviceId))
        .limit(1);

      return {
        accessibility: input.accessibility satisfies AccessibilityBackup,
        gamification: readGamification(gamificationRow),
        materials: materialRows.map(toMaterial),
        progress: progressRows.map((row) => ({
          bestScore: row.bestScore ?? 0,
          materialId: row.materialId,
        })),
      };
    }),

  /**
   * Memulihkan snapshot (hasil `backup.load`) ke server milik perangkat ini.
   *
   * Bersifat **menambahkan/merapikan**, bukan menghapus: materi yang belum ada
   * disimpan, progres memakai skor terbaik. Dengan begitu memulihkan dua kali
   * tidak merusak data.
   */
  import: publicProcedure
    .input(
      z.object({
        deviceId: deviceIdSchema,
        /** Gamifikasi opsional: pemulihan dari cadangan versi lama (v1) tidak memilikinya. */
        gamification: gamificationBackupSchema.optional(),
        materials: z.array(materialInputSchema).max(EXPORT_MATERIAL_LIMIT),
        progress: z
          .array(
            z.object({
              bestScore: z.number().int().min(0).max(100),
              materialId: z.string().min(1).max(120),
            })
          )
          .max(EXPORT_PROGRESS_LIMIT),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const now = new Date();
      const materialIds = input.materials.map(
        (material) => material.id?.trim() || crypto.randomUUID()
      );

      // Ditulis berkelompok (bukan satu-per-satu di dalam loop) agar pemulihan
      // puluhan materi tetap gesit saat demo di jaringan ruangan.
      //
      // `onConflictDoUpdate` WAJIB: `materials.id` adalah PRIMARY KEY global,
      // sehingga memulihkan kode yang sama dua kali — atau memulihkan ke
      // perangkat yang sudah punya materi itu — akan menabrak UNIQUE dan D1
      // menolak seluruh pernyataan. Perilaku upsert-nya sengaja menyamai
      // `materials.create`: pemulih adalah pemilik baru baris tersebut.
      if (input.materials.length > 0) {
        await ctx.db
          .insert(materials)
          .values(
            input.materials.map((material, index) => ({
              id: materialIds[index] ?? crypto.randomUUID(),
              userId: input.deviceId,
              title: material.title,
              subject: material.subject,
              gradeLevel: material.gradeLevel,
              summary: material.summary,
              readingMinutes: material.readingMinutes,
              paragraphs: JSON.stringify(material.paragraphs),
              createdAt: now,
              updatedAt: now,
            }))
          )
          .onConflictDoUpdate({
            target: materials.id,
            set: {
              userId: input.deviceId,
              title: sql`excluded.title`,
              subject: sql`excluded.subject`,
              gradeLevel: sql`excluded.grade_level`,
              summary: sql`excluded.summary`,
              readingMinutes: sql`excluded.reading_minutes`,
              paragraphs: sql`excluded.paragraphs`,
              updatedAt: now,
            },
          });
      }

      const progressIds = input.progress.map((entry) => entry.materialId);
      if (progressIds.length > 0) {
        // Skor terbaik dipertahankan: baca dulu nilai yang ada, baru tulis.
        const existingRows = await ctx.db
          .select({
            bestScore: learningProgress.bestScore,
            id: learningProgress.id,
          })
          .from(learningProgress)
          .where(inArray(learningProgress.id, progressIds));
        const existingBest = new Map(
          existingRows.map((row) => [row.id, row.bestScore ?? 0])
        );

        await ctx.db
          .insert(learningProgress)
          .values(
            input.progress.map((entry) => ({
              id: entry.materialId,
              userId: input.deviceId,
              materialId: entry.materialId,
              bestScore: Math.max(
                existingBest.get(entry.materialId) ?? 0,
                entry.bestScore
              ),
              quizCount: 0,
              lastActivityAt: now.toISOString(),
            }))
          )
          .onConflictDoUpdate({
            target: learningProgress.id,
            set: {
              // Pemulihan berulang harus aman: naikkan skor hanya bila snapshot
              // lebih baik, dan jangan reset `quizCount` (statistik perangkat).
              userId: input.deviceId,
              lastActivityAt: now.toISOString(),
              updatedAt: now,
              bestScore: sql`max(coalesce(learning_progress.best_score, 0), coalesce(excluded.best_score, 0))`,
            },
          });
      }

      if (input.gamification) {
        // XP & rentetan hanya pernah naik: pemulihan berulang tidak boleh
        // menurunkannya (mis. cadangan lama dipulihkan setelah belajar lagi).
        await ctx.db
          .insert(gamificationState)
          .values({
            id: input.deviceId,
            userId: input.deviceId,
            xp: input.gamification.xp,
            lastActiveDate: input.gamification.lastActiveDate,
            streakDays: input.gamification.streakDays,
          })
          .onConflictDoUpdate({
            target: gamificationState.id,
            set: {
              userId: input.deviceId,
              xp: sql`max(${gamificationState.xp}, excluded.xp)`,
              streakDays: sql`max(${gamificationState.streakDays}, excluded.streak_days)`,
              lastActiveDate: sql`case when ${gamificationState.lastActiveDate} is null then excluded.last_active_date when excluded.last_active_date is null then ${gamificationState.lastActiveDate} when excluded.last_active_date > ${gamificationState.lastActiveDate} then excluded.last_active_date else ${gamificationState.lastActiveDate} end`,
              updatedAt: now,
            },
          });
      }

      return {
        materialsImported: input.materials.length,
        progressImported: input.progress.length,
      };
    }),
});
