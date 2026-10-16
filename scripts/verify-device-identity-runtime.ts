/**
 * Simulasi runtime: apakah identitas perangkat benar-benar terisi di perangkat
 * baru — termasuk saat `localStorage` diblokir?
 *
 * Yang dieksekusi adalah modul **sesungguhnya**
 * (`apps/frontend/src/lib/offline/device-identity.ts`), disalin apa adanya ke
 * berkas sementara unik per skenario lalu diimpor. Salinan unik diperlukan
 * karena modul itu sengaja meng-cache `DEVICE_ID` di level modul (identitas
 * harus stabil), sehingga tanpa ini hasil antar-skenario akan bocor.
 */

import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

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

interface StorageLike {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
}

const sourcePath = join(
  import.meta.dir,
  "../apps/frontend/src/lib/offline/device-identity.ts"
);
const source = await readFile(sourcePath, "utf8");
const workDir = await mkdtemp(join(tmpdir(), "mudahin-device-"));

let counter = 0;

/** Mengevaluasi modul identitas "dari nol" dengan `localStorage` tertentu. */
async function loadFresh(
  storage: StorageLike | "blocked"
): Promise<{ DEVICE_ID: string; readStoredDeviceId: () => string | null }> {
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    get() {
      if (storage === "blocked") {
        throw new Error("SecurityError: akses localStorage ditolak");
      }
      return storage;
    },
  });

  counter += 1;
  const file = join(workDir, `device-identity-${counter}.ts`);
  await writeFile(file, source, "utf8");
  return (await import(file)) as {
    DEVICE_ID: string;
    readStoredDeviceId: () => string | null;
  };
}

// --- Skenario 1: perangkat baru, localStorage normal -------------------------
const freshMap = new Map<string, string>();
const freshNormal = await loadFresh({
  getItem: (key) => freshMap.get(key) ?? null,
  setItem: (key, value) => {
    freshMap.set(key, value);
  },
});
check("perangkat baru: identitas tersedia", Boolean(freshNormal.DEVICE_ID));
check(
  "perangkat baru: identitas ≥4 karakter",
  freshNormal.DEVICE_ID.length >= 4
);
check(
  "perangkat baru: identitas tersimpan ke localStorage",
  freshMap.get("mudahin-device-id") === freshNormal.DEVICE_ID
);

// --- Skenario 2: perangkat lama, identitas sudah tersimpan ------------------
const reuseMap = new Map([["mudahin-device-id", "dev-sebelumnya-1234"]]);
const reused = await loadFresh({
  getItem: (key) => reuseMap.get(key) ?? null,
  setItem: (key, value) => {
    reuseMap.set(key, value);
  },
});
check(
  "perangkat lama: identitas lama dipakai ulang (tidak bikin baru)",
  reused.DEVICE_ID === "dev-sebelumnya-1234"
);
check(
  "perangkat lama: nilai tersimpan tidak ditimpa",
  reuseMap.get("mudahin-device-id") === "dev-sebelumnya-1234"
);

// --- Skenario 3: nilai rusak (terlalu pendek) ------------------------------
const corruptMap = new Map([["mudahin-device-id", "ab"]]);
const corrupt = await loadFresh({
  getItem: (key) => corruptMap.get(key) ?? null,
  setItem: (key, value) => {
    corruptMap.set(key, value);
  },
});
check("nilai rusak: tidak dipakai", corrupt.DEVICE_ID !== "ab");
check("nilai rusak: diganti identitas valid", corrupt.DEVICE_ID.length >= 4);

// --- Skenario 4: localStorage MELEMPAR (WebView ketat / mode privat) --------
// Inilah regresi yang membuat aplikasi menggantung di "Memuat pustaka materi".
const blocked = await loadFresh("blocked");
check("storage diblokir: tidak melempar saat boot", Boolean(blocked.DEVICE_ID));
check(
  "storage diblokir: identitas tetap ≥4 karakter",
  blocked.DEVICE_ID.length >= 4
);
check(
  "storage diblokir: id siap dipakai kueri",
  blocked.DEVICE_ID.trim().length >= 4
);
check(
  "storage diblokir: readStoredDeviceId aman → null",
  blocked.readStoredDeviceId() === null
);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
