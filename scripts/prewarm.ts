#!/usr/bin/env bun
/**
 * Pra-panaskan cache AI untuk demo (Rundown Hari 2, tugas 2.10).
 *
 * Memanggil endpoint `/jobs/prewarm` di server sehingga "Sederhanakan" dan
 * "Buat Kuis" untuk semua materi demo tersimpan di cache D1 — demo tetap
 * cepat walau jaringan ruangan buruk.
 *
 * Pemakaian:
 *   SERVER_URL=http://localhost:3000 PREWARM_TOKEN=rahasia bun run prewarm
 */

const serverUrl = (process.env.SERVER_URL ?? "http://localhost:3000").replace(
  /\/$/,
  ""
);
const token = process.env.PREWARM_TOKEN;

if (!token) {
  console.error(
    "PREWARM_TOKEN belum diisi. Contoh:\n" +
      "  SERVER_URL=http://localhost:3000 PREWARM_TOKEN=rahasia bun run prewarm"
  );
  process.exit(1);
}

const response = await fetch(`${serverUrl}/jobs/prewarm`, {
  headers: { "x-prewarm-token": token },
  method: "POST",
});

if (!response.ok) {
  console.error(`Gagal memanggil prewarm: HTTP ${response.status}`);
  console.error(await response.text());
  process.exit(1);
}

const result = (await response.json()) as {
  ok: boolean;
  total: number;
  warmed: number;
  results: { id: string; ok: boolean; error?: string }[];
};

console.log(`Cache dipanaskan: ${result.warmed}/${result.total} materi`);
for (const item of result.results) {
  console.log(
    `  ${item.ok ? "✓" : "✗"} ${item.id}${item.error ? ` — ${item.error}` : ""}`
  );
}

if (!result.ok) {
  process.exit(1);
}
