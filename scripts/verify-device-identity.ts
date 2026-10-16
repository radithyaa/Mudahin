/**
 * Verifikasi identitas perangkat & pembungkus storage Zustand persist.
 *
 * Konteks bug yang dicegah (perangkat/browser baru):
 * identitas perangkat hidup di `localStorage`, tetapi Zustand `persist`
 * memanggil `window.localStorage` **saat store dibuat** (saat impor modul).
 * Bila akses itu melempar (WebView ketat, mode privat, atau lingkungan tanpa
 * `window`), `persist` menonaktifkan persistensi secara permanen sehingga
 * `deviceId` tidak pernah tersimpan — dan kueri materi tidak pernah berjalan.
 *
 * Karena modul asli memakai alias `@/...`/`window` yang hanya terselesaikan di
 * bundel web, logika murni di bawah adalah **cerminan** dari
 * `apps/frontend/src/lib/offline/device-identity.ts` (pola sama dengan
 * `verify-offline.ts` & `verify-request-guard.ts`).
 */

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

const DEVICE_ID_STORAGE_KEY = "mudahin-device";

/** Cerminan `readStoredDeviceId`: baca, validasi, jangan pernah melempar. */
function readStoredDeviceId(
  storage: Pick<Storage, "getItem"> | null
): string | null {
  try {
    const stored = storage?.getItem(DEVICE_ID_STORAGE_KEY);
    return stored && stored.length >= 4 ? stored : null;
  } catch {
    return null;
  }
}

/** Cerminan `writeStoredDeviceId`: tulis best-effort. */
function writeStoredDeviceId(
  storage: Pick<Storage, "setItem"> | null,
  id: string
): string {
  try {
    storage?.setItem(DEVICE_ID_STORAGE_KEY, id);
  } catch {
    // Best-effort: identitas hanya hilang bila penyimpanan tidak tersedia.
  }
  return id;
}

/** Storage palsu dengan kapabilitas yang bisa dimatikan. */
function makeStorage(options: { canRead: boolean; canWrite: boolean }) {
  const map = new Map<string, string>();
  return {
    getItem(name: string): string | null {
      if (!options.canRead) {
        throw new Error("getItem diblokir");
      }
      return map.get(name) ?? null;
    },
    setItem(name: string, value: string): void {
      if (!options.canWrite) {
        throw new Error("setItem diblokir");
      }
      map.set(name, value);
    },
    snapshot: () => Object.fromEntries(map),
  };
}

// 1. Perangkat sama: identitas yang tersimpan harus dipakai ulang apa adanya.
const reused = makeStorage({ canRead: true, canWrite: true });
writeStoredDeviceId(reused, "dev-tetap-1234");
check(
  "identitas tersimpan terbaca ulang",
  readStoredDeviceId(reused) === "dev-tetap-1234"
);

// 2. Perangkat baru: tidak ada nilai → null, bukan error.
const fresh = makeStorage({ canRead: true, canWrite: true });
check("penyimpanan kosong → null", readStoredDeviceId(fresh) === null);
check(
  "menulis identitas baru tidak melempar",
  writeStoredDeviceId(fresh, "dev-baru-5678") === "dev-baru-5678"
);
check(
  "identitas baru langsung terbaca",
  readStoredDeviceId(fresh) === "dev-baru-5678"
);

const payload = fresh.snapshot()[DEVICE_ID_STORAGE_KEY];
check(
  "identitas baru berisi teks >4 karakter",
  typeof payload === "string" && payload.length >= 4
);

// 3. Nilai rusak / terlalu pendek dianggap tidak ada (skema minimal 4 karakter).
const corrupt = makeStorage({ canRead: true, canWrite: true });
corrupt.setItem(DEVICE_ID_STORAGE_KEY, "ab");
check(
  "identitas terlalu pendek diabaikan",
  readStoredDeviceId(corrupt) === null
);

// 4. Regresi utama: storage yang MELEMPAR karena kebijakan privasi WebView.
//    `readStoredDeviceId` harus mengembalikan null, dan penulisan tetap aman.
const blockedRead = {
  getItem() {
    throw new Error("SecurityError");
  },
};
const blockedWrite = {
  setItem() {
    throw new Error("QuotaExceededError");
  },
};
check(
  "getItem melempar → null (tidak menggagalkan boot)",
  readStoredDeviceId(blockedRead) === null
);
check(
  "setItem melempar → tetap mengembalikan identitas",
  writeStoredDeviceId(blockedWrite, "dev-tanpa-penyimpanan") ===
    "dev-tanpa-penyimpanan"
);
check(
  "storage belum tersedia (null) → null",
  readStoredDeviceId(null) === null
);

// 5. Identitas yang dikembalikan ke pemanggil tidak boleh kosong — inilah yang
//    membuat `useQuery` berhenti menggantung (enabled: Boolean(deviceId)).
const resolved =
  readStoredDeviceId(fresh) ?? writeStoredDeviceId(fresh, "dev-fallback-99");
check("identitas selalu terisi (fallback bila kosong)", Boolean(resolved));
check("identitas minimal 4 karakter sesuai skema API", resolved.length >= 4);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
