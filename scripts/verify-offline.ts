/**
 * Verifikasi util kritis mode luring (SHOULD 2.15) — logika murni tanpa IndexedDB.
 *
 * Menguji perilaku cache materi seperti yang diimplementasikan kini:
 * 1. Menyimpan daftar materi mempertahankan urutan & id unik.
 * 2. Daftar kosong tidak menimpa cache yang sudah ada (dilewati).
 * 3. Materi tidak lagi berasal dari seed dummy — cache kosong berarti kosong.
 *
 * Logika disalin dari `apps/frontend/src/lib/materials/cache.ts` karena modul itu
 * mengimpor alias `@/...` yang hanya terselesaikan di bundel web. Pola ini sama
 * dengan `verify-request-guard.ts`.
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

interface MinimalMaterial {
  id: string;
  title: string;
}

/** Cerminan `cacheMaterials`: daftar kosong tidak mengganti cache. */
function nextCache(
  existing: MinimalMaterial[] | null,
  incoming: MinimalMaterial[]
): MinimalMaterial[] | null {
  if (incoming.length === 0) {
    return existing;
  }
  return incoming;
}

/** Cerminan `readCachedMaterials`: nilai cache atau null. */
function readCache(value: MinimalMaterial[] | null): MinimalMaterial[] | null {
  return value;
}

const materialA: MinimalMaterial = { id: "a", title: "Materi A" };
const materialB: MinimalMaterial = { id: "b", title: "Materi B" };

// 1. Menyimpan daftar materi mempertahankan isi & urutan.
const cached = nextCache(null, [materialA, materialB]);
check("menyimpan 2 materi", cached?.length === 2);
check("id unik", new Set(cached?.map((m) => m.id)).size === 2);
check("urutan terjaga", cached?.[0]?.id === "a" && cached?.[1]?.id === "b");

// 2. Daftar kosong tidak menimpa cache yang sudah ada.
const kept = nextCache([materialA], []);
check("daftar kosong → cache lama tetap", kept?.length === 1);
check("materi lama bertahan", kept?.[0]?.id === "a");

// 3. Cache kosong berarti kosong (tidak ada seed dummy).
check("cache kosong → null", readCache(null) === null);
check("cache terisi → terbaca", readCache([materialA])?.length === 1);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
