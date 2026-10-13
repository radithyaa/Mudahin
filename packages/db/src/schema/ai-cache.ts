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

/**
 * Cadangan profil aksesibilitas (sinkronisasi lintas perangkat, tingkat MVP).
 *
 * `id` = kode cadangan (`syncId`) yang dibuat acak di perangkat. Tidak ada
 * akun/role — pemulihan dilakukan dengan memasukkan kode di perangkat lain.
 */
export const profileBackup = sqliteTable("profile_backup", {
  id: text("id").primaryKey(),
  /** Snapshot preferensi (JSON) — lihat `profileSnapshotSchema` di packages/api. */
  payload: text("payload").notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .$defaultFn(() => new Date())
    .notNull(),
});

/**
 * Catatan progres belajar ringan (FR-PRF-05).
 *
 * Kunci: `materialId` untuk pemakaian anonim per perangkat. Kolom `user_id`
 * disediakan agar progres dapat diikat ke akun bila autentikasi ditambahkan
 * (sinkronisasi progres lintas perangkat tetap Future Work — SRS Bagian 8).
 */
export const learningProgress = sqliteTable("learning_progress", {
  /** Kunci unik = materialId (anonim per perangkat) atau userId+materialId. */
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().default("anon"),
  materialId: text("material_id").notNull(),
  /** Skor kuis terbaik (0–100), null bila belum pernah kuis. */
  bestScore: integer("best_score"),
  /** Berapa kali kuis diselesaikan untuk materi ini. */
  quizCount: integer("quiz_count").notNull().default(0),
  /** Waktu (ISO-8601) aktivitas terakhir. */
  lastActivityAt: text("last_activity_at").notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .$defaultFn(() => new Date())
    .notNull(),
});
