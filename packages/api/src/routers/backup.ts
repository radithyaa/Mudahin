import { backupSnapshotSchema, backupSyncIdSchema } from "@mudahin/api/backup";
import { deviceBackup } from "@mudahin/db/schema/ai-cache";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { publicProcedure, router } from "../index";

/**
 * Cadangan perangkat (sinkronisasi lintas perangkat tingkat MVP).
 *
 * Seluruh data belajar hidup **lokal** di perangkat (localStorage/IndexedDB).
 * Prosedur ini hanya menyimpan salinan snapshot agar dapat dipulihkan di
 * perangkat lain lewat "kode cadangan" (`syncId`) — tanpa akun: pengguna baru
 * selalu mulai dari nol, dan hanya berlanjut bila ia memulihkan datanya.
 *
 * Batas ukuran payload dijaga skema `backupSnapshotSchema` (versi 1) sehingga
 * perangkat tidak dapat mengisi D1 dengan muatan tak terbatas.
 */
export const backupRouter = router({
  /** Simpan (atau timpa) cadangan perangkat untuk kode tertentu. */
  save: publicProcedure
    .input(
      z.object({
        snapshot: backupSnapshotSchema,
        syncId: backupSyncIdSchema,
      })
    )
    .mutation(async ({ ctx, input }) => {
      const payload = JSON.stringify(input.snapshot);
      const now = new Date();

      await ctx.db
        .insert(deviceBackup)
        .values({
          id: input.syncId,
          payload,
          materialCount: input.snapshot.materials.length,
          progressCount: input.snapshot.progress.length,
          updatedAt: now,
        })
        .onConflictDoUpdate({
          target: deviceBackup.id,
          set: {
            payload,
            materialCount: input.snapshot.materials.length,
            progressCount: input.snapshot.progress.length,
            updatedAt: now,
          },
        });

      return {
        materialCount: input.snapshot.materials.length,
        ok: true as const,
        progressCount: input.snapshot.progress.length,
        syncId: input.syncId,
        updatedAt: now.toISOString(),
      };
    }),

  /** Ambil cadangan perangkat berdasarkan kode (null bila tidak ada/rusak). */
  load: publicProcedure
    .input(z.object({ syncId: backupSyncIdSchema }))
    .query(async ({ ctx, input }) => {
      const [row] = await ctx.db
        .select({
          payload: deviceBackup.payload,
          updatedAt: deviceBackup.updatedAt,
        })
        .from(deviceBackup)
        .where(eq(deviceBackup.id, input.syncId))
        .limit(1);

      if (!row) {
        return { found: false as const, savedAt: null, snapshot: null };
      }

      // Cadangan bisa rusak (mis. skema berubah) — jangan percaya mentah-mentah.
      const parsed = backupSnapshotSchema.safeParse(
        JSON.parse(row.payload) as unknown
      );
      if (!parsed.success) {
        return { found: false as const, savedAt: null, snapshot: null };
      }

      return {
        found: true as const,
        savedAt: row.updatedAt.toISOString(),
        snapshot: parsed.data,
      };
    }),
});
