/**
 * Verifikasi util kritis mode luring (SHOULD 2.15) — logika murni tanpa IndexedDB.
 *
 * Menguji dua hal:
 * 1. Upsert satu materi tidak menghapus materi lain & id tetap unik.
 * 2. Prioritas resolusi materi: salinan luring > seed statis.
 *
 * Logika disalin dari `apps/web/src/lib/materials/cache.ts` (`mergeMaterial`)
 * karena modul itu mengimpor alias `@/...` yang hanya terselesaikan di bundel
 * web. Pola ini sama dengan `verify-request-guard.ts`.
 */

import { SEED_MATERIALS } from "../packages/api/src/materials";

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

/** Cerminan `mergeMaterial` di cache.ts. */
function mergeMaterial<T extends { id: string }>(
  existing: T[],
  material: T
): T[] {
  return [...existing.filter((item) => item.id !== material.id), material];
}

const materialA: MinimalMaterial = { id: "a", title: "Materi A" };
const materialB: MinimalMaterial = { id: "b", title: "Materi B" };

// 1. Upsert ke daftar kosong.
{
  const merged = mergeMaterial([], materialA);
  check("upsert ke kosong → 1 materi", merged.length === 1);
  check("id benar", merged[0]?.id === "a");
}

// 2. Upsert materi baru tidak menghapus yang lama.
{
  const merged = mergeMaterial([materialA], materialB);
  check("menambah materi baru → 2 materi", merged.length === 2);
  check(
    "materi lama tetap ada",
    merged.some((m) => m.id === "a") && merged.some((m) => m.id === "b")
  );
}

// 3. Upsert id yang sama → memperbarui, bukan menduplikasi.
{
  const updated: MinimalMaterial = { id: "a", title: "Materi A v2" };
  const merged = mergeMaterial([materialA, materialB], updated);
  check("upsert id sama → tetap 2 materi", merged.length === 2);
  check(
    "judul diperbarui",
    merged.find((m) => m.id === "a")?.title === "Materi A v2"
  );
}

// 4. Prioritas: salinan luring dipakai lebih dulu, seed sebagai jaring pengaman.
{
  const cached: MinimalMaterial[] = [materialA];
  const resolve = (offline: MinimalMaterial[] | null): string | undefined => {
    const byId = (list: { id: string }[], id: string) =>
      list.find((m) => m.id === id);
    return (
      (offline ? byId(offline, "a") : undefined)?.id ??
      byId(SEED_MATERIALS, "fotosintesis")?.id
    );
  };
  check("luring tersedia → pakai luring", resolve(cached) === "a");
  check("luring kosong → jatuh ke seed", resolve(null) === "fotosintesis");
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
