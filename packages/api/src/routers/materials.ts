import { deviceIdSchema } from "@mudahin/api/backup";
import { materials } from "@mudahin/db/schema/materials";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";

import { publicProcedure, router } from "../index";
import { type Material, materialInputSchema } from "../materials";

/**
 * Prosedur materi: pustaka milik pengguna & detail satu materi (FR-PRF-04).
 *
 * Materi berasal dari **database**, bukan konstanta seed. Kepemilikan ditentukan
 * oleh identitas perangkat (`deviceId`) yang dikirim klien — tanpa akun, tiap
 * perangkat punya pustakanya sendiri. Saat autentikasi diaktifkan, id pengguna
 * dari sesi menggantikan `deviceId`.
 */

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

/** Kepemilikan materi: id sesi bila login, selain itu identitas perangkat. */
function ownerIdFrom(
  ctx: { session: { user: { id: string } } | null },
  deviceId: string
): string {
  return ctx.session?.user.id ?? deviceId;
}

export const materialsRouter = router({
  /** Daftar pustaka materi milik perangkat ini, terbaru lebih dulu. */
  list: publicProcedure
    .input(z.object({ deviceId: deviceIdSchema }))
    .query(async ({ ctx, input }) => {
      const rows = await ctx.db
        .select()
        .from(materials)
        .where(eq(materials.userId, ownerIdFrom(ctx, input.deviceId)))
        .orderBy(desc(materials.createdAt));

      return rows.map(toMaterial);
    }),

  /** Detail satu materi milik perangkat ini (null bila tidak ada/bukan miliknya). */
  byId: publicProcedure
    .input(z.object({ deviceId: deviceIdSchema, id: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const [row] = await ctx.db
        .select()
        .from(materials)
        .where(
          and(
            eq(materials.id, input.id),
            eq(materials.userId, ownerIdFrom(ctx, input.deviceId))
          )
        )
        .limit(1);

      return row ? toMaterial(row) : null;
    }),

  /** Menyimpan materi baru hasil "Olah Materi dengan Teman AI" ke database. */
  create: publicProcedure
    .input(materialInputSchema.extend({ deviceId: deviceIdSchema }))
    .mutation(async ({ ctx, input }) => {
      const userId = ownerIdFrom(ctx, input.deviceId);
      const id = input.id?.trim() || crypto.randomUUID();
      const now = new Date();

      await ctx.db
        .insert(materials)
        .values({
          id,
          userId,
          title: input.title,
          subject: input.subject,
          gradeLevel: input.gradeLevel,
          summary: input.summary,
          readingMinutes: input.readingMinutes,
          paragraphs: JSON.stringify(input.paragraphs),
          createdAt: now,
          updatedAt: now,
        })
        .onConflictDoUpdate({
          target: materials.id,
          set: {
            title: input.title,
            subject: input.subject,
            gradeLevel: input.gradeLevel,
            summary: input.summary,
            readingMinutes: input.readingMinutes,
            paragraphs: JSON.stringify(input.paragraphs),
            updatedAt: now,
          },
        });

      return {
        id,
        title: input.title,
        subject: input.subject,
        gradeLevel: input.gradeLevel,
        summary: input.summary,
        readingMinutes: input.readingMinutes,
        paragraphs: input.paragraphs,
      } satisfies Material;
    }),
});
