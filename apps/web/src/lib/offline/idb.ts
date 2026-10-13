/**
 * Penyimpanan luring (IndexedDB) — FR-PRF-06 & strategi ketahanan demo (SRS §4.5).
 *
 * Menyimpan salinan materi, ringkasan, dan kuis terakhir agar demo tetap
 * berjalan saat jaringan mati. Dipakai lintas fitur (pustaka, reader, ringkasan,
 * kuis), sehingga diletakkan di level global `lib/`.
 *
 * Implementasi memakai IndexedDB mentah (tanpa dependency baru) dengan
 * fallback ke `localStorage` bila IndexedDB tidak tersedia.
 */

const DB_NAME = "mudahin-offline";
const DB_VERSION = 1;
const STORE = "kv";

interface KeyValueRecord {
  key: string;
  updatedAt: number;
  value: unknown;
}

let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  if (typeof indexedDB === "undefined") {
    return Promise.reject(new Error("IndexedDB tidak tersedia"));
  }
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE)) {
          db.createObjectStore(STORE, { keyPath: "key" });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
  return dbPromise;
}

/** Menyimpan nilai (best-effort; kegagalan tidak boleh menggagalkan UI). */
export async function setOfflineValue(
  key: string,
  value: unknown
): Promise<void> {
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).put({
        key,
        value,
        updatedAt: Date.now(),
      } satisfies KeyValueRecord);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // Fallback: localStorage (kuota lebih kecil, tapi cukup untuk demo).
    try {
      localStorage.setItem(`${DB_NAME}:${key}`, JSON.stringify(value));
    } catch {
      // Abaikan: mode luring bersifat best-effort.
    }
  }
}

/** Membaca nilai, atau `null` bila tidak ada. */
export async function getOfflineValue<T>(key: string): Promise<T | null> {
  try {
    const db = await openDb();
    const record = await new Promise<KeyValueRecord | undefined>(
      (resolve, reject) => {
        const tx = db.transaction(STORE, "readonly");
        const request = tx.objectStore(STORE).get(key);
        request.onsuccess = () => resolve(request.result as KeyValueRecord);
        request.onerror = () => reject(request.error);
      }
    );
    return (record?.value as T) ?? null;
  } catch {
    try {
      const raw = localStorage.getItem(`${DB_NAME}:${key}`);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch {
      return null;
    }
  }
}

/** Kunci luring per materi untuk tiap jenis data. */
export const offlineKey = {
  summary: (materialId: string) => `summary:${materialId}`,
  quiz: (materialId: string) => `quiz:${materialId}`,
  mindMap: (materialId: string) => `mindmap:${materialId}`,
};
