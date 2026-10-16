/**
 * Identitas perangkat — sumber tunggal untuk "siapa pemilik data ini".
 *
 * Aplikasi ini **tanpa akun**: tiap perangkat punya identitas acak yang
 * disimpan lokal, dan itulah kunci kepemilikan materi & progres di server.
 * Saat pengguna memulihkan kode cadangan, data ikut pindah ke perangkat baru.
 *
 * Kenapa bukan Zustand `persist`: middleware itu memanggil `window.localStorage`
 * **saat store dibuat** (yakni saat impor modul). Bila akses itu melempar —
 * WebView ketat, mode privat, atau lingkungan tanpa `window` — persistensi
 * mati permanen dan `deviceId` tidak pernah terbaca, sehingga kueri materi
 * menggantung di "Memuat pustaka materi…" selamanya.
 *
 * Modul ini sengaja: (1) memuat nilainya **sinkron** saat pertama dibaca,
 * (2) tidak pernah melempar, (3) selalu mengembalikan id yang valid
 * (≥4 karakter, sesuai skema `deviceIdSchema` di `packages/api`).
 */

export const DEVICE_ID_STORAGE_KEY = "mudahin-device-id";

/** Panjang minimum id — harus cocok dengan `deviceIdSchema` di kontrak API. */
const DEVICE_ID_MIN_LENGTH = 4;

/**
 * Cache identitas per proses.
 *
 * Diisi saat pertama dibaca. Berguna sebagai penyimpanan cadangan bila
 * `localStorage` ternyata tidak tersedia, sehingga identitas tetap stabil
 * selama sesi berjalan (tidak berganti-ganti tiap render).
 */
let cachedDeviceId: string | null = null;

/** `localStorage` bila benar-benar bisa dipakai, selain itu `null`. */
function safeLocalStorage(): Storage | null {
  try {
    // Akses properti itu sendiri bisa melempar pada WebView ketat.
    return typeof localStorage === "undefined" ? null : localStorage;
  } catch {
    return null;
  }
}

/** Membaca id tersimpan; `null` bila tidak ada, rusak, atau diblokir. */
export function readStoredDeviceId(): string | null {
  try {
    const stored = safeLocalStorage()?.getItem(DEVICE_ID_STORAGE_KEY);
    return stored && stored.length >= DEVICE_ID_MIN_LENGTH ? stored : null;
  } catch {
    return null;
  }
}

/** Menyimpan id; kegagalan diabaikan karena identitas tetap hidup di memori. */
export function writeStoredDeviceId(deviceId: string): string {
  try {
    safeLocalStorage()?.setItem(DEVICE_ID_STORAGE_KEY, deviceId);
  } catch {
    // Best-effort: identitas hanya hilang bila penyimpanan tidak tersedia.
  }
  return deviceId;
}

/** Membuat id acak. Memakai `crypto.randomUUID` bila ada, selain itu fallback. */
function generateDeviceId(): string {
  try {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
      return `dev-${crypto.randomUUID()}`;
    }
  } catch {
    // Lanjut ke fallback di bawah.
  }
  const random = Math.random().toString(36).slice(2, 10);
  return `dev-${Date.now().toString(36)}${random}`;
}

/**
 * Mengembalikan identitas perangkat ini, membuatnya bila belum ada.
 *
 * **Selalu** mengembalikan id yang valid — pemanggil boleh langsung memakainya
 * untuk kueri/mutasi tanpa memeriksa `null` lagi.
 */
export function getOrCreateDeviceId(): string {
  if (cachedDeviceId) {
    return cachedDeviceId;
  }

  const stored = readStoredDeviceId();
  if (stored) {
    cachedDeviceId = stored;
    return stored;
  }

  const created = generateDeviceId();
  cachedDeviceId = writeStoredDeviceId(created);
  return cachedDeviceId;
}

/** Identitas perangkat, dihitung sekali saat modul pertama dimuat. */
export const DEVICE_ID: string = getOrCreateDeviceId();

/**
 * Menandai perangkat ini milik kode cadangan tertentu (dipakai saat pemulihan).
 * Tidak mengubah identitas, hanya mencatat kode yang terakhir dipulihkan.
 */
export const RESTORED_FROM_STORAGE_KEY = "mudahin-device-restored-from";

export function writeRestoredFrom(syncId: string): void {
  try {
    safeLocalStorage()?.setItem(RESTORED_FROM_STORAGE_KEY, syncId);
  } catch {
    // Best-effort.
  }
}
