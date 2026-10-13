import type { Context as ApiContext } from "@mudahin/api/context";
import { materialToText, SEED_MATERIALS } from "@mudahin/api/materials";
import { appRouter } from "@mudahin/api/routers/index";

import { ENV } from "../env.server";
import { getDb } from "../services";

/**
 * Pra-panaskan cache AI untuk semua materi demo (Rundown Hari 2, tugas 2.10).
 *
 * Wajib dijalankan sekali sebelum pitch: menjalankan "Sederhanakan" dan
 * "Buat Kuis" untuk setiap materi sehingga jawaban siap diambil dari cache
 * saat demo (SRS §4.5 butir 3). Dilindungi token sederhana.
 */

const PREWARM_TOKEN_HEADER = "x-prewarm-token";
const QUIZ_COUNT = 4;

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
  };
  const caller = appRouter.createCaller({ db, env, session: null });

  const results: { id: string; ok: boolean; error?: string }[] = [];

  for (const material of SEED_MATERIALS) {
    const text = materialToText(material);
    try {
      // Sengaja berurutan: membatasi laju panggilan AI & menghindari rate limit.
      // biome-ignore lint/performance/noAwaitInLoops: pra-panas harus berurutan agar tidak menabrak rate limit DeepSeek.
      await caller.ai.simplify({ text, level: "sederhana" });
      await caller.ai.quiz({ text, count: QUIZ_COUNT });
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
