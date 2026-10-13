import { aiCache } from "@mudahin/db/schema/ai-cache";
import { eq } from "drizzle-orm";

import type { Context } from "./context";

/**
 * Cache hasil AI di Cloudflare D1 (FR-AI-05, Aturan Teknis §6.7).
 *
 * Cache key = SHA-256 dari `endpoint + PROMPT_VERSION + input`.
 * Bump `PROMPT_VERSION` setiap prompt berubah agar entri lama tidak salah dipakai.
 */

/** Menghasilkan hash heksadesimal dari sebuah string (Web Crypto, tersedia di Workers). */
export async function hashKey(...parts: string[]): Promise<string> {
  const data = new TextEncoder().encode(parts.join("\u0000"));
  const digest = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

/** Mengambil payload cache yang sudah tervalidasi, atau `null` bila tidak ada. */
export async function readCache<T>(
  db: Context["db"],
  key: string
): Promise<T | null> {
  try {
    const [row] = await db
      .select({ payload: aiCache.payload })
      .from(aiCache)
      .where(eq(aiCache.key, key))
      .limit(1);
    if (!row) {
      return null;
    }
    const { payload } = row;
    return JSON.parse(payload) as T;
  } catch {
    // Cache adalah optimisasi — jangan sampai kegagalan baca merusak permintaan.
    return null;
  }
}

/** Menyimpan payload ke cache (best-effort; kegagalan tulis diabaikan). */
export async function writeCache(
  db: Context["db"],
  key: string,
  endpoint: string,
  payload: unknown
): Promise<void> {
  try {
    await db
      .insert(aiCache)
      .values({ key, endpoint, payload: JSON.stringify(payload) })
      .onConflictDoUpdate({
        target: aiCache.key,
        set: { payload: JSON.stringify(payload), createdAt: new Date() },
      });
  } catch {
    // Abaikan: kegagalan menulis cache tidak boleh menggagalkan respons.
  }
}
