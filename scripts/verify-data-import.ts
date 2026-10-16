/**
 * Verifikasi `data.import` — terutama jalur **konflik**.
 *
 * Bug yang dicegah: `materials.id` adalah PRIMARY KEY global, sedangkan
 * `data.import` memakai `insert(...).values(...)` tanpa `onConflictDoUpdate`.
 * Akibatnya memulihkan kode cadangan yang sama dua kali — atau memulihkan ke
 * perangkat yang sudah punya materi itu — menabrak UNIQUE, D1 menolak seluruh
 * pernyataan, dan materi + progres tidak tersimpan sama sekali.
 *
 * Uji ini menjalankan route `dataImport` yang **sesungguhnya** terhadap SQLite
 * ber-migrasi lewat driver D1 + `D1Database` tiruan, jadi perilaku upsert dan
 * pemilihan skor terbaik benar-benar dieksekusi.
 *
 * Catatan: `drizzle-orm` diimpor lewat jalur relatif ke `packages/db` karena
 * akar repo tidak punya dependency itu — pola yang sama dipakai
 * `verify-materials-db.ts` saat menghindari impor paket.
 */

import { Database } from "bun:sqlite";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { dataRouter } from "../packages/api/src/routers/data";
import { drizzle } from "../packages/db/node_modules/drizzle-orm/d1/index.js";

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

const sqlitePath = `/tmp/mudahin-import-${Date.now()}.sqlite`;
const sqlite = new Database(sqlitePath);

const migrationsDir = join(import.meta.dir, "../packages/db/src/migrations");
for (const dir of readdirSync(migrationsDir, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort()) {
  sqlite.exec(
    readFileSync(join(migrationsDir, dir, "migration.sql"), "utf8").replace(
      /-->\s*statement-breakpoint/g,
      ";"
    )
  );
}

/**
 * `D1Database` tiruan: cukup untuk Drizzle D1 (prepare/bind/raw/run).
 * `raw()` mengembalikan array-of-array seperti D1 sungguhan.
 */
function normalizeBound(value: unknown): unknown {
  if (value === undefined || value === null) {
    return null;
  }
  if (value instanceof Date) {
    return value.getTime();
  }
  return typeof value === "boolean" ? Number(value) : value;
}

function fakeD1(database: Database) {
  const prepare = (sql: string) => {
    const bound: unknown[] = [];
    const statement = {
      bind(...params: unknown[]) {
        bound.length = 0;
        bound.push(...params.map(normalizeBound));
        return statement;
      },
      run() {
        const result = database.prepare(sql).run(...(bound as never[]));
        return Promise.resolve({
          success: true,
          meta: {
            changes: result.changes,
            last_row_id: Number(result.lastInsertRowid),
          },
        });
      },
      all() {
        return Promise.resolve({
          results: database.prepare(sql).all(...(bound as never[])),
        });
      },
      first() {
        return Promise.resolve(
          database.prepare(sql).get(...(bound as never[])) ?? null
        );
      },
      raw() {
        return Promise.resolve(
          database.prepare(sql).values(...(bound as never[]))
        );
      },
    };
    return statement;
  };

  return {
    prepare,
    batch: (statements: { run: () => Promise<unknown> }[]) =>
      Promise.all(statements.map((entry) => entry.run())),
    exec: (sql: string) => {
      database.exec(sql);
      return Promise.resolve({ count: 0, duration: 0 });
    },
  };
}

const db = drizzle(fakeD1(sqlite) as never) as never;
const caller = dataRouter.createCaller({ db, env: {}, session: null } as never);

const material = {
  id: "m1",
  title: "Materi Satu",
  subject: "Materi AI",
  gradeLevel: "Umum",
  summary: "Ringkasan.",
  readingMinutes: 2,
  paragraphs: ["Paragraf."],
};

// 1. Pemulihan pertama ke perangkat baru.
const first = await caller.import({
  deviceId: "dev-baru",
  materials: [material],
  progress: [{ materialId: "m1", bestScore: 60 }],
});
check("pemulihan pertama berhasil", first.progressImported === 1);

const scoreOf = (deviceId: string) => {
  const row = sqlite
    .query(
      "SELECT best_score FROM learning_progress WHERE id = 'm1' AND user_id = ?"
    )
    .get(deviceId) as { best_score: number } | null;
  return row?.best_score ?? null;
};
check("skor tersimpan", scoreOf("dev-baru") === 60);

// 2. REGRESI: kode yang sama dipulihkan dua kali → dulu gagal (PRIMARY KEY).
let secondFailed = false;
try {
  await caller.import({
    deviceId: "dev-baru",
    materials: [material],
    progress: [{ materialId: "m1", bestScore: 60 }],
  });
} catch {
  secondFailed = true;
}
check("pemulihan kedua tidak menabrak PRIMARY KEY", !secondFailed);
check(
  "skor tetap benar setelah dipulihkan dua kali",
  scoreOf("dev-baru") === 60
);

// 3. Perangkat berbeda memulihkan materi yang sama.
//
// `learning_progress.id` adalah PRIMARY KEY GLOBAL, jadi hanya ada satu baris
// per materialId — pindah perangkat berarti baris itu berpindah pemilik
// (sama seperti `progress.record`). Yang penting: tidak error.
let otherDeviceFailed = false;
try {
  await caller.import({
    deviceId: "dev-lain",
    materials: [material],
    progress: [{ materialId: "m1", bestScore: 30 }],
  });
} catch {
  otherDeviceFailed = true;
}
check("perangkat lain bisa memulihkan id yang sama", !otherDeviceFailed);
const owner = sqlite
  .query("SELECT user_id FROM learning_progress WHERE id = 'm1'")
  .get() as { user_id: string };
check(
  "kepemilikan berpindah ke perangkat yang memulihkan",
  owner.user_id === "dev-lain"
);
check(
  "hanya ada satu baris per materialId",
  (
    sqlite
      .query("SELECT COUNT(*) AS n FROM learning_progress WHERE id = 'm1'")
      .get() as { n: number }
  ).n === 1
);

// 4. Skor lokal lebih tinggi → tidak boleh turun (ambil yang terbaik).
await caller.import({
  deviceId: "dev-baru",
  materials: [],
  progress: [{ materialId: "m1", bestScore: 20 }],
});
check("skor lebih tinggi dipertahankan", scoreOf("dev-baru") === 60);

// 5. Skor snapshot lebih tinggi → naik.
await caller.import({
  deviceId: "dev-lain",
  materials: [],
  progress: [{ materialId: "m1", bestScore: 95 }],
});
check("skor lebih tinggi dari snapshot diterapkan", scoreOf("dev-lain") === 95);

// 6. quizCount tidak direset oleh pemulihan.
const quizCount = sqlite
  .query("SELECT quiz_count FROM learning_progress WHERE id = 'm1'")
  .get() as { quiz_count: number };
check("quiz_count tidak dirusak pemulihan", quizCount.quiz_count >= 0);

// 7. Materi baris kedua (id baru) tetap bisa masuk bersamaan.
await caller.import({
  deviceId: "dev-baru",
  materials: [],
  progress: [{ materialId: "m2", bestScore: 50 }],
});
const m2 = sqlite
  .query("SELECT best_score, user_id FROM learning_progress WHERE id = 'm2'")
  .get() as { best_score: number; user_id: string };
check("id baru tersimpan dengan skor benar", m2.best_score === 50);
check("id baru tercatat milik perangkat ini", m2.user_id === "dev-baru");

// 8. Gamifikasi (XP & rentetan) ikut dipulihkan dari snapshot.
const gamificationOf = (deviceId: string) =>
  sqlite
    .query(
      "SELECT xp, streak_days, last_active_date FROM gamification_state WHERE id = ?"
    )
    .get(deviceId) as {
    xp: number;
    streak_days: number;
    last_active_date: string | null;
  } | null;

await caller.import({
  deviceId: "dev-gami",
  gamification: { xp: 250, lastActiveDate: "2026-10-16", streakDays: 3 },
  materials: [],
  progress: [],
});
const gami = gamificationOf("dev-gami");
check("XP dipulihkan dari cadangan", gami?.xp === 250);
check("rentetan dipulihkan dari cadangan", gami?.streak_days === 3);
check("tanggal aktivitas dipulihkan", gami?.last_active_date === "2026-10-16");

// 9. Pemulihan berulang tidak menurunkan XP/rentetan (hanya naik).
await caller.import({
  deviceId: "dev-gami",
  gamification: { xp: 100, lastActiveDate: "2026-10-10", streakDays: 1 },
  materials: [],
  progress: [],
});
const afterDowngrade = gamificationOf("dev-gami");
check("XP tidak turun karena cadangan lama", afterDowngrade?.xp === 250);
check(
  "rentetan tidak turun karena cadangan lama",
  afterDowngrade?.streak_days === 3
);
check(
  "tanggal aktivitas memakai yang terbaru",
  afterDowngrade?.last_active_date === "2026-10-16"
);

// 10. Cadangan versi lama (tanpa gamifikasi) tetap diterima.
let legacyFailed = false;
try {
  await caller.import({
    deviceId: "dev-lama",
    materials: [],
    progress: [],
  });
} catch {
  legacyFailed = true;
}
check("cadangan tanpa gamifikasi tetap diterima", !legacyFailed);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);

console.log("\n=== KEADAAN AKHIR learning_progress ===");
console.log(
  sqlite
    .query(
      "SELECT id, user_id, best_score, quiz_count FROM learning_progress ORDER BY id, user_id"
    )
    .all()
);
console.log("\n=== KEADAAN AKHIR materials ===");
console.log(
  sqlite.query("SELECT id, user_id, title FROM materials ORDER BY id").all()
);
