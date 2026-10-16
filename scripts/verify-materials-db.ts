/**
 * Verifikasi tabel `materials` + kontrak materi (tanpa D1).
 *
 * Menguji:
 * 1. Migrasi `materials` dapat diterapkan ke SQLite dan kolomnya lengkap.
 * 2. Predikat kepemilikan (`user_id`) memisahkan materi antar pengguna.
 * 3. `materialToText` & skema input berperilaku sesuai kontrak.
 */

import { Database } from "bun:sqlite";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import {
  type AccessibilityBackup,
  backupSnapshotSchema,
  mergeBackupSnapshot,
  toBackupSnapshot,
} from "../packages/api/src/backup";
import {
  materialInputSchema,
  materialToText,
} from "../packages/api/src/materials";

let pass = 0;
let fail = 0;
const check = (name: string, cond: boolean) => {
  if (cond) {
    pass += 1;
    console.log("  ok:", name);
  } else {
    fail += 1;
    console.log("  FAIL:", name);
  }
};

const sqlitePath = `/tmp/mudahin-verify-${Date.now()}.sqlite`;
const sqlite = new Database(sqlitePath);

// 1. Terapkan seluruh migrasi berurutan (seperti `db:migrate:deploy`) agar
// pernyataan DROP pada migrasi terbaru tetap sah.
const migrationsDir = join(import.meta.dir, "../packages/db/src/migrations");
const migrationDirs = readdirSync(migrationsDir, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort();

for (const dir of migrationDirs) {
  const file = join(migrationsDir, dir, "migration.sql");
  sqlite.exec(
    readFileSync(file, "utf8").replace(/-->\s*statement-breakpoint/g, ";")
  );
}
check("seluruh migrasi diterapkan", migrationDirs.length >= 6);

const columns = sqlite.query("PRAGMA table_info(materials)").all() as {
  name: string;
  notnull: number;
  dflt_value: string | null;
}[];
const columnNames = columns.map((column) => column.name);

check("tabel materials dibuat", columnNames.length > 0);
for (const expected of [
  "id",
  "user_id",
  "title",
  "subject",
  "grade_level",
  "summary",
  "reading_minutes",
  "paragraphs",
  "created_at",
  "updated_at",
]) {
  check(`kolom ${expected} ada`, columnNames.includes(expected));
}

const userIdColumn = columns.find((column) => column.name === "user_id");
check("user_id default 'anon'", userIdColumn?.dflt_value === "'anon'");
check("user_id NOT NULL", userIdColumn?.notnull === 1);

// Tabel cadangan perangkat juga harus dibuat oleh migrasinya.
const backupColumns = (
  sqlite.query("PRAGMA table_info(device_backup)").all() as {
    name: string;
  }[]
).map((column) => column.name);
for (const expected of [
  "id",
  "payload",
  "material_count",
  "progress_count",
  "updated_at",
]) {
  check(
    `kolom device_backup.${expected} ada`,
    backupColumns.includes(expected)
  );
}

sqlite.run(
  "INSERT INTO device_backup (id, payload, material_count, progress_count, updated_at) VALUES (?, ?, ?, ?, ?)",
  "kode-belajarku",
  JSON.stringify([{ id: "m1" }]),
  1,
  1,
  Date.now()
);
const storedBackup = sqlite
  .query("SELECT payload FROM device_backup WHERE id = ?")
  .get("kode-belajarku") as { payload: string };
check(
  "cadangan tersimpan & terbaca kembali",
  JSON.parse(storedBackup.payload)[0].id === "m1"
);

// Tabel cadangan lama sudah tidak dipakai — pemulihan kini penuh (device_backup).
const legacyTable = sqlite
  .query(
    "SELECT name FROM sqlite_master WHERE type='table' AND name='profile_backup'"
  )
  .all();
check("tabel profile_backup sudah dihapus", legacyTable.length === 0);

const indexes = sqlite
  .query(
    "SELECT name FROM sqlite_master WHERE type='index' AND tbl_name='materials'"
  )
  .all() as { name: string }[];
check(
  "indeks user_id ada",
  indexes.some((entry) => entry.name === "materials_userId_idx")
);

// Tabel riwayat latihan lisan & gamifikasi dibuat oleh migrasi terbaru.
const voiceColumns = (
  sqlite.query("PRAGMA table_info(voice_attempts)").all() as {
    name: string;
  }[]
).map((column) => column.name);
for (const expected of [
  "id",
  "user_id",
  "material_id",
  "material_title",
  "question",
  "transcript",
  "correct",
  "feedback",
  "replay",
  "created_at",
]) {
  check(
    `kolom voice_attempts.${expected} ada`,
    voiceColumns.includes(expected)
  );
}

const gamificationColumns = (
  sqlite.query("PRAGMA table_info(gamification_state)").all() as {
    name: string;
  }[]
).map((column) => column.name);
for (const expected of [
  "id",
  "user_id",
  "xp",
  "last_active_date",
  "streak_days",
  "updated_at",
]) {
  check(
    `kolom gamification_state.${expected} ada`,
    gamificationColumns.includes(expected)
  );
}

// 2. Isolasi kepemilikan: dua pengguna tidak saling melihat materi.
const insert = sqlite.prepare(
  `INSERT INTO materials (id, user_id, title, subject, grade_level, summary, reading_minutes, paragraphs, created_at, updated_at)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
);
const now = Date.now();
insert.run(
  "m1",
  "anon",
  "Materi Anonim",
  "AI",
  "Umum",
  "S",
  3,
  '["a"]',
  now,
  now
);
insert.run(
  "m2",
  "user-1",
  "Materi User",
  "IPA",
  "SD",
  "S",
  3,
  '["b"]',
  now,
  now
);

const listBy = (userId: string) =>
  sqlite
    .prepare(
      "SELECT id FROM materials WHERE user_id = ? ORDER BY created_at DESC"
    )
    .all(userId) as { id: string }[];

check("anon melihat 1 materi", listBy("anon").length === 1);
check("user-1 melihat 1 materi", listBy("user-1").length === 1);
check("anon melihat materi anonim", listBy("anon")[0]?.id === "m1");
check("user-1 melihat materi user-1", listBy("user-1")[0]?.id === "m2");

const byIdScoped = sqlite
  .prepare("SELECT id FROM materials WHERE id = ? AND user_id = ?")
  .all("m1", "user-1") as { id: string }[];
check("byId lintas pemilik → kosong", byIdScoped.length === 0);

// Round-trip JSON paragraf.
const row = sqlite
  .prepare("SELECT paragraphs FROM materials WHERE id = ?")
  .get("m1") as { paragraphs: string };
check(
  "paragraf JSON round-trip",
  JSON.stringify(JSON.parse(row.paragraphs)) === JSON.stringify(["a"])
);

// 3. Kontrak murni.
check(
  "materialToText menggabungkan paragraf",
  materialToText({
    id: "x",
    title: "T",
    subject: "S",
    gradeLevel: "G",
    summary: "Sm",
    readingMinutes: 1,
    paragraphs: ["P1", "P2"],
  }) === "P1\n\nP2"
);

check(
  "schema menolak paragraphs kosong",
  !materialInputSchema.safeParse({
    title: "X",
    subject: "X",
    gradeLevel: "X",
    summary: "X",
    readingMinutes: 1,
    paragraphs: [],
  }).success
);

check(
  "schema menerima materi valid",
  materialInputSchema.safeParse({
    title: "Catatan",
    subject: "IPA",
    gradeLevel: "SD Kelas 5",
    summary: "Ringkasan.",
    readingMinutes: 3,
    paragraphs: ["Satu.", "Dua."],
  }).success
);

// 4. Cadangan perangkat: snapshot, batas, & penggabungan tanpa kehilangan data.
const accessibility: AccessibilityBackup = {
  dyslexiaFont: false,
  fontSize: "md",
  readingRuler: false,
  speechSpeed: 0.95,
  warmTheme: false,
};
const material = {
  gradeLevel: "Umum",
  id: "m1",
  paragraphs: ["Isi materi."],
  readingMinutes: 2,
  subject: "Materi AI",
  summary: "Ringkasan.",
  title: "Materi Satu",
};

const snapshot = toBackupSnapshot({
  accessibility,
  gamification: { xp: 120, lastActiveDate: "2026-10-16", streakDays: 2 },
  materials: [material],
  progress: [{ materialId: "m1", bestScore: 80 }],
  savedAt: null,
});
check("snapshot versi 2", snapshot.version === 2);
check(
  "snapshot lolos validasi",
  backupSnapshotSchema.safeParse(snapshot).success
);
check(
  "snapshot menolak versi asing",
  !backupSnapshotSchema.safeParse({ ...snapshot, version: 1 }).success
);
check(
  "snapshot menolak materi tanpa paragraf",
  !backupSnapshotSchema.safeParse({
    ...snapshot,
    materials: [{ ...material, paragraphs: [] }],
  }).success
);

// Penggabungan: materi lokal yang tak ada di snapshot tetap dipertahankan,
// dan skor diambil yang terbaik di antara lokal & snapshot.
const merged = mergeBackupSnapshot(
  {
    accessibility: { ...accessibility, fontSize: "xl" },
    gamification: { xp: 300, lastActiveDate: "2026-10-18", streakDays: 5 },
    materials: [
      material,
      {
        gradeLevel: "Umum",
        id: "m2",
        paragraphs: ["Materi lokal saja."],
        readingMinutes: 1,
        subject: "Materi AI",
        summary: "Ringkasan.",
        title: "Materi Dua",
      },
    ],
    progress: [
      { materialId: "m1", bestScore: 90 },
      { materialId: "m2", bestScore: 50 },
    ],
    savedAt: null,
  },
  snapshot
);

const mergedIds = merged.materials.map((entry) => entry.id).sort();
check(
  "gabungan menyimpan materi lokal & cadangan",
  mergedIds.join(",") === "m1,m2"
);
check(
  "setelan mengikuti snapshot yang dipulihkan",
  merged.accessibility.fontSize === "md"
);
check(
  "skor diambil yang terbaik",
  merged.progress.find((entry) => entry.materialId === "m1")?.bestScore ===
    90 &&
    merged.progress.find((entry) => entry.materialId === "m2")?.bestScore === 50
);
check(
  "gamifikasi diambil yang terbaik (XP lokal tertinggi)",
  merged.gamification.xp === 300 &&
    merged.gamification.streakDays === 5 &&
    merged.gamification.lastActiveDate === "2026-10-18"
);
check(
  "gabungan tetap valid (idempoten)",
  backupSnapshotSchema.safeParse(toBackupSnapshot(merged)).success
);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
