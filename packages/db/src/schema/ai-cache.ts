import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

/**
 * Cache hasil AI (FR-AI-05, Aturan Teknis §6.7).
 *
 * `key` = hash SHA-256 dari `(endpoint + PROMPT_VERSION + input)`.
 * Cache hit → prosedur tRPC tidak memanggil DeepSeek sama sekali.
 */
export const aiCache = sqliteTable("ai_cache", {
  key: text("key").primaryKey(),
  /** Nama prosedur, mis. "simplify" / "quiz" — memudahkan inspeksi & invalidasi. */
  endpoint: text("endpoint").notNull(),
  /** Respons yang sudah tervalidasi Zod, diserialisasi sebagai JSON. */
  payload: text("payload").notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .$defaultFn(() => new Date())
    .notNull(),
});

/** Catatan progres belajar ringan (FR-PRF-05). */
export const learningProgress = sqliteTable("learning_progress", {
  /** Kunci unik per pengguna (anonim → "anon") + materi. */
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().default("anon"),
  materialId: text("material_id").notNull(),
  /** Skor kuis terakhir (0–100), null bila belum pernah kuis. */
  lastScore: integer("last_score"),
  /** Jumlah kata terakhir yang dibacakan/dibaca. */
  lastReadAt: integer("last_read_at", { mode: "timestamp_ms" }),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .$defaultFn(() => new Date())
    .notNull(),
});
