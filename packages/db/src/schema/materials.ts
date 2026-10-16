import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

/**
 * Materi belajar milik pengguna (FR-PRF-04).
 *
 * Berbeda dengan progres (yang boleh anonim per perangkat), materi pustaka
 * diikat ke `userId` agar tiap pengguna hanya melihat koleksi miliknya sendiri.
 * Sebelum autentikasi aktif, materi disimpan dengan `userId = "anon"`.
 *
 * Paragraf disimpan sebagai JSON array string agar kontrak `Material` di
 * `packages/api` tidak perlu dipecah ke tabel anak (cukup untuk skala MVP).
 */
export const materials = sqliteTable(
  "materials",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull().default("anon"),
    title: text("title").notNull(),
    subject: text("subject").notNull(),
    gradeLevel: text("grade_level").notNull(),
    summary: text("summary").notNull(),
    /** Estimasi waktu baca dalam menit. */
    readingMinutes: integer("reading_minutes").notNull().default(3),
    /** JSON array string — isi paragraf materi berurutan. */
    paragraphs: text("paragraphs").notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .$defaultFn(() => new Date())
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("materials_userId_idx").on(table.userId)]
);
