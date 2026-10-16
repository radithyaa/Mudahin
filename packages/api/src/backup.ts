import { z } from "zod";

/**
 * Kontrak cadangan perangkat (sinkronisasi lintas perangkat tingkat MVP).
 *
 * Satu snapshot menampung **seluruh** data yang hidup lokal di perangkat:
 * 1. `accessibility` — setelan aksesibilitas UI.
 * 2. `materials` — pustaka materi milik pengguna.
 * 3. `progress` — skor kuis terbaik per materi.
 * 4. `gamification` — XP, rentetan, dan tanggal aktivitas terakhir.
 *
 * Dipakai bersama client & server: skema di sini adalah satu-satunya sumber
 * kebenaran bentuk snapshot, sehingga data lokal dapat dipulihkan utuh di
 * perangkat lain lewat "kode cadangan" (`syncId`) — tanpa akun.
 */

/** Kode cadangan yang dipakai pengguna untuk memulihkan data di perangkat lain. */
export const backupSyncIdSchema = z.string().trim().min(4).max(64);

/**
 * Identitas perangkat (kunci kepemilikan data tanpa akun).
 *
 * Dibuat acak di klien dan tidak pernah diketik pengguna — berbeda dengan
 * `syncId`, yang justru harus mudah diingat agar bisa dipakai di perangkat lain.
 */
export const deviceIdSchema = z.string().trim().min(4).max(64);

export const accessibilityBackupSchema = z.object({
  dyslexiaFont: z.boolean(),
  fontSize: z.enum(["sm", "md", "lg", "xl"]),
  readingRuler: z.boolean(),
  speechSpeed: z.number().min(0.5).max(2),
  warmTheme: z.boolean(),
});
export type AccessibilityBackup = z.infer<typeof accessibilityBackupSchema>;

/** Satu entri progres: skor kuis terbaik (0–100) per materi. */
export const progressBackupEntrySchema = z.object({
  materialId: z.string().min(1).max(120),
  bestScore: z.number().int().min(0).max(100),
});
export type ProgressBackupEntry = z.infer<typeof progressBackupEntrySchema>;

/**
 * Progres gamifikasi yang ikut dicadangkan: XP, rentetan, & tanggal aktivitas.
 *
 * Sebelumnya XP hanya hidup di memori sehingga hilang saat reload dan tidak
 * pernah tersalin ke perangkat lain. Bentuk ini membuat kedua hal itu bertahan.
 *
 * `lastActiveDate` disimpan sebagai tanggal tanpa zona (`YYYY-MM-DD`) agar
 * perhitungan rentetan tidak goyah saat perangkat berpindah zona waktu.
 */
export const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export const gamificationBackupSchema = z.object({
  xp: z.number().int().min(0).max(1_000_000),
  /** Tanggal aktivitas terakhir (`YYYY-MM-DD`), null bila belum pernah. */
  lastActiveDate: z.string().regex(DATE_ONLY_PATTERN).nullable(),
  streakDays: z.number().int().min(0).max(10_000),
});
export type GamificationBackup = z.infer<typeof gamificationBackupSchema>;

/** Batas ukuran snapshot agar payload tetap wajar untuk D1 & kuota lokal. */
export const BACKUP_LIMITS = {
  materials: 200,
  paragraphsPerMaterial: 30,
  progressEntries: 500,
} as const;

export const backupSnapshotSchema = z.object({
  accessibility: accessibilityBackupSchema,
  gamification: gamificationBackupSchema,
  /** Judul/subjek dipakai kembali untuk menyusun entri materi yang dipulihkan. */
  materials: z
    .array(
      z.object({
        gradeLevel: z.string().min(1).max(40),
        id: z.string().min(1).max(120),
        paragraphs: z
          .array(z.string().min(1).max(2000))
          .min(1)
          .max(BACKUP_LIMITS.paragraphsPerMaterial),
        readingMinutes: z.number().int().min(1).max(60),
        subject: z.string().min(1).max(40),
        summary: z.string().min(1).max(400),
        title: z.string().min(1).max(120),
      })
    )
    .max(BACKUP_LIMITS.materials),
  progress: z
    .array(progressBackupEntrySchema)
    .max(BACKUP_LIMITS.progressEntries),
  /** Versi skema snapshot — naikkan bila bentuknya berubah. */
  version: z.literal(2),
});
export type BackupSnapshot = z.infer<typeof backupSnapshotSchema>;

/** Snapshot perangkat yang siap dicadangkan: data lokal yang sudah terisi. */
export interface DeviceBackupInput {
  accessibility: AccessibilityBackup;
  gamification: GamificationBackup;
  materials: BackupSnapshot["materials"];
  progress: ProgressBackupEntry[];
  /** Waktu cadangan dibuat (ISO-8601), ditampilkan agar pengguna yakin. */
  savedAt: string | null;
}

/** Gamifikasi awal untuk perangkat yang belum pernah belajar. */
export const EMPTY_GAMIFICATION: GamificationBackup = {
  xp: 0,
  lastActiveDate: null,
  streakDays: 0,
};

/**
 * Membentuk snapshot dari data lokal sambil memaksakan batas jumlah.
 *
 * Dipakai klien (sebelum `backup.save`) maupun server saat memvalidasi ulang,
 * sehingga perangkat tidak pernah mengirim payload yang ditolak validator.
 */
export function toBackupSnapshot(input: DeviceBackupInput): BackupSnapshot {
  return {
    version: 2,
    accessibility: input.accessibility,
    gamification: input.gamification,
    materials: input.materials.slice(0, BACKUP_LIMITS.materials),
    progress: input.progress.slice(0, BACKUP_LIMITS.progressEntries),
  };
}

/** Cermin `toBackupSnapshot` untuk data yang datang kembali dari server. */
export function fromBackupSnapshot(
  snapshot: BackupSnapshot
): DeviceBackupInput {
  return {
    accessibility: snapshot.accessibility,
    gamification: snapshot.gamification,
    materials: snapshot.materials,
    progress: snapshot.progress,
    savedAt: null,
  };
}

/**
 * Menggabungkan data lokal dengan snapshot hasil pemulihan.
 *
 * Aturan (aman untuk dijalankan berulang, idempoten):
 * - materi: snapshot menang untuk id yang sama; materi lokal yang tidak ada di
 *   snapshot tetap dipertahankan (tidak ada data hilang).
 * - progres: skor **terbaik** di antara lokal & snapshot.
 * - gamifikasi: XP tertinggi, rentetan terpanjang, tanggal aktivitas terbaru
 *   (agar XP & progres harian tidak pernah turun karena pemulihan).
 */
export function mergeBackupSnapshot(
  local: DeviceBackupInput,
  snapshot: BackupSnapshot
): DeviceBackupInput {
  const restored = fromBackupSnapshot(snapshot);
  const byId = new Map(
    local.materials.map((material) => [material.id, material])
  );
  for (const material of restored.materials) {
    byId.set(material.id, material);
  }

  const bestScoreById = new Map(
    local.progress.map((entry) => [entry.materialId, entry.bestScore])
  );
  for (const entry of restored.progress) {
    const previous = bestScoreById.get(entry.materialId) ?? 0;
    bestScoreById.set(entry.materialId, Math.max(previous, entry.bestScore));
  }

  return {
    accessibility: restored.accessibility,
    gamification: mergeGamification(local.gamification, restored.gamification),
    materials: [...byId.values()],
    progress: [...bestScoreById.entries()].map(([materialId, bestScore]) => ({
      materialId,
      bestScore,
    })),
    savedAt: local.savedAt,
  };
}

/** Mengambil yang terbaik dari dua keadaan gamifikasi (aman diulang). */
export function mergeGamification(
  local: GamificationBackup,
  restored: GamificationBackup
): GamificationBackup {
  return {
    xp: Math.max(local.xp, restored.xp),
    lastActiveDate: latestDate(local.lastActiveDate, restored.lastActiveDate),
    streakDays: Math.max(local.streakDays, restored.streakDays),
  };
}

/** Tanggal terbaru dari dua tanggal `YYYY-MM-DD` (null selalu kalah). */
function latestDate(a: string | null, b: string | null): string | null {
  if (a === null) {
    return b;
  }
  if (b === null) {
    return a;
  }
  // Format `YYYY-MM-DD` aman dibandingkan sebagai string (leksikografis = kronologis).
  return a > b ? a : b;
}
