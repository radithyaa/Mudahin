import type { Context as ApiContext } from "@mudahin/api/context";
import { materialToText } from "@mudahin/api/materials";
import { appRouter } from "@mudahin/api/routers/index";

import { ENV } from "../env.server";
import { getDb } from "../services";

/**
 * Pra-panaskan cache AI untuk seluruh materi di database (Rundown Hari 2).
 *
 * Dijalankan sekali sebelum pitch: menjalankan "Sederhanakan", "Buat Kuis",
 * dan "Kartu Belajar" untuk setiap materi yang tersimpan sehingga jawaban siap
 * diambil dari cache saat demo (SRS §4.5 butir 3). Dilindungi token sederhana.
 *
 * Sebelumnya fungsi ini memakai `SEED_MATERIALS` (data dummy); kini membaca
 * materi nyata milik pengguna dari database.
 */

const PREWARM_TOKEN_HEADER = "x-prewarm-token";
const QUIZ_COUNT = 4;
/**
 * Pra-panas bersifat lintas perangkat: ia memanaskan cache untuk **semua** materi
 * di database, jadi tidak perlu identitas perangkat sungguhan.
 */
const PREWARM_DEVICE_ID = "prewarm";

export async function handlePrewarm(request: Request): Promise<Response> {
  const expected = ENV.PREWARM_TOKEN;
  if (!expected) {
    return Response.json(
      { ok: false, message: "PREWARM_TOKEN belum dikonfigurasi." },
      { status: 412 }
    );
  }
  if (request.headers.get(PREWARM_TOKEN_HEADER) !== expected) {
    return Response.json(
      { ok: false, message: "Tidak diizinkan." },
      { status: 401 }
    );
  }

  const db = getDb();
  const env: ApiContext["env"] = {
    DEEPSEEK_API_KEY: ENV.DEEPSEEK_API_KEY,
    DEEPSEEK_BASE_URL: ENV.DEEPSEEK_BASE_URL,
    DEEPSEEK_MODEL: ENV.DEEPSEEK_MODEL,
    // Disertakan agar prosedur di `speechRouter` tetap bisa dijalankan dari
    // pemanggil internal (mis. pra-panas suara kalimat sapaan pada demo).
    GEMINI_API_KEY: ENV.GEMINI_API_KEY,
    GEMINI_BASE_URL: ENV.GEMINI_BASE_URL,
    GEMINI_MODEL: ENV.GEMINI_MODEL,
  };
  const caller = appRouter.createCaller({ db, env, session: null });

  const results: { id: string; ok: boolean; error?: string }[] = [];

  const materialList = await caller.materials.list({
    deviceId: PREWARM_DEVICE_ID,
  });

  for (const material of materialList) {
    const text = materialToText(material);
    try {
      // Sengaja berurutan: membatasi laju panggilan AI & menghindari rate limit.
      // biome-ignore lint/performance/noAwaitInLoops: pra-panas harus berurutan agar tidak menabrak rate limit DeepSeek.
      await caller.ai.simplify({ text, level: "sederhana" });
      await caller.ai.quiz({ text, count: QUIZ_COUNT });
      await caller.ai.flashcards({ text, level: "sederhana" });
      results.push({ id: material.id, ok: true });
    } catch (error) {
      results.push({
        id: material.id,
        ok: false,
        error: error instanceof Error ? error.message : "gagal",
      });
    }
  }

  const warmed = results.filter((result) => result.ok).length;
  return Response.json({
    ok: warmed === results.length,
    total: results.length,
    warmed,
    results,
  });
}
