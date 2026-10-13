import { profileBackup } from "@mudahin/db/schema/ai-cache";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { publicProcedure, router } from "../index";

/**
 * Pencadangan profil aksesibilitas (sinkronisasi lintas perangkat tingkat MVP).
 *
 * Preferensi tetap hidup lokal (offline-first); prosedur ini hanya menyimpan
 * cadangan agar dapat dipulihkan di perangkat lain lewat "kode cadangan"
 * (`syncId`). Berbeda dengan Future Work "Teacher & Parent Dashboard", tidak
 * ada akun/role di sini.
 */
const profileSnapshotSchema = z.object({
  fontFamily: z.enum(["default", "dyslexic"]),
  fontSize: z.number().int().min(100).max(200),
  highContrast: z.boolean(),
  letterSpacing: z.number().min(0).max(0.2),
  lineHeight: z.number().min(1.2).max(2.4),
  needs: z.array(z.string().max(40)).max(10),
  readingRuler: z.boolean(),
  reduceMotion: z.boolean(),
});

export type ProfileSnapshotInput = z.infer<typeof profileSnapshotSchema>;

export const profileRouter = router({
  /** Menyimpan (atau memperbarui) cadangan profil untuk `syncId`. */
  save: publicProcedure
    .input(
      z.object({
        syncId: z.string().min(4).max(64),
        snapshot: profileSnapshotSchema,
      })
    )
    .mutation(async ({ ctx, input }) => {
      const nowIso = new Date().toISOString();
      await ctx.db
        .insert(profileBackup)
        .values({
          id: input.syncId,
          payload: JSON.stringify(input.snapshot),
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: profileBackup.id,
          set: {
            payload: JSON.stringify(input.snapshot),
            updatedAt: new Date(),
          },
        });
      return { ok: true, syncId: input.syncId, updatedAt: nowIso };
    }),

  /** Mengambil cadangan profil berdasarkan `syncId` (null bila tidak ada). */
  load: publicProcedure
    .input(z.object({ syncId: z.string().min(4).max(64) }))
    .query(async ({ ctx, input }) => {
      const [row] = await ctx.db
        .select({ payload: profileBackup.payload })
        .from(profileBackup)
        .where(eq(profileBackup.id, input.syncId))
        .limit(1);

      if (!row) {
        return { found: false as const, snapshot: null };
      }

      const parsed = profileSnapshotSchema.safeParse(
        JSON.parse(row.payload) as unknown
      );
      if (!parsed.success) {
        return { found: false as const, snapshot: null };
      }
      return { found: true as const, snapshot: parsed.data };
    }),
});
