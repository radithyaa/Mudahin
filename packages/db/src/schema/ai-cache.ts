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
 * Cadangan perangkat — snapshot luring penuh yang dipulihkan lewat kode.
 *
 * Berbeda dengan `profileBackup` (hanya setelan aksesibilitas), tabel ini
 * menyimpan **seluruh** data lokal: setelan, pustaka materi, dan progres skor.
 * Bentuk payload mengikuti `backupSnapshotSchema` di `packages/api/src/backup.ts`,
 * yang juga menjadi batas ukuran payload (anti-lonjakan biaya/kuota).
 */
export const deviceBackup = sqliteTable("device_backup", {
  /** Kode cadangan (`syncId`) — divalidasi minimal 4 karakter di kontrak API. */
  id: text("id").primaryKey(),
  /** Snapshot perangkat (JSON) — lihat `backupSnapshotSchema`. */
  payload: text("payload").notNull(),
  /** Jumlah entri, hanya untuk inspeksi cepat & diagnostik. */
  materialCount: integer("material_count").notNull().default(0),
  progressCount: integer("progress_count").notNull().default(0),
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

/**
 * Riwayat latihan lisan (FR-AUD-04 lanjutan).
 *
 * Setiap percobaan "Jawab dengan Suara" dicatat lengkap: pertanyaan, transkrip
 * yang terdengar, dan putusan benar/salah dari AI. Riwayat ini dipakai untuk
 * halaman **Riwayat Latihan** sehingga pengguna dapat melihat apa yang pernah
 * ia jawab dan mengulanginya. Kepemilikan mengikuti `user_id` (deviceId tanpa
 * akun), sama seperti `learning_progress`.
 */
export const voiceAttempts = sqliteTable("voice_attempts", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().default("anon"),
  materialId: text("material_id").notNull(),
  materialTitle: text("material_title").notNull(),
  /** Pertanyaan yang diajukan ke pengguna. */
  question: text("question").notNull(),
  /** Transkrip jawaban lisan pengguna (bisa kosong bila tak ada suara). */
  transcript: text("transcript").notNull(),
  /** Putusan AI: 1 benar, 0 belum tepat. */
  correct: integer("correct", { mode: "boolean" }).notNull(),
  /** Umpan balik ramah yang ditampilkan ke pengguna. */
  feedback: text("feedback").notNull(),
  /** Bila percobaan ini **tidak** memberi XP (mis. mode ulangan riwayat). */
  replay: integer("replay", { mode: "boolean" }).notNull().default(false),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .$defaultFn(() => new Date())
    .notNull(),
});

/**
 * Ringkasan gamifikasi per perangkat (XP & rentetan harian).
 *
 * XP sebelumnya hanya hidup di memori (`useState` di `app.tsx`) sehingga hilang
 * setiap reload dan tidak ikut tercadangkan. Tabel ini menyimpannya agar XP dan
 * **progres harian** (tanggal aktivitas terakhir + rentetan) bertahan lintas sesi
 * dan lintas perangkat lewat kode cadangan.
 */
export const gamificationState = sqliteTable("gamification_state", {
  /** Kunci = userId (deviceId tanpa akun). */
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().default("anon"),
  /** Total poin pengalaman belajar. */
  xp: integer("xp").notNull().default(0),
  /** Tanggal (YYYY-MM-DD) aktivitas terakhir — dasar perhitungan rentetan. */
  lastActiveDate: text("last_active_date"),
  /** Jumlah hari berturut-turut belajar. */
  streakDays: integer("streak_days").notNull().default(0),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .$defaultFn(() => new Date())
    .notNull(),
});
