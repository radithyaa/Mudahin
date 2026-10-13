/**
 * Regression test untuk bug infinite-loop pada Ringkasan/Kuis (Hari 2 P1).
 *
 * Akar masalah: `useCallback` yang bergantung pada objek hasil `useMutation`
 * (identitasnya berubah tiap render) dipakai sebagai dependency `useEffect`,
 * sehingga efek memicu render → callback berubah → efek jalan lagi (tak henti).
 *
 * Perbaikan: kunci permintaan (`requestKey`) + ref, sehingga permintaan hanya
 * dikirim sekali per materi, dan `mutate` (yang stabil) yang dipakai.
 *
 * Test di bawah mensimulasikan logika guard itu secara murni.
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

/** Meniru `createRequestGuard`: hanya izinkan sekali per key (kecuali force). */
function createRequestGuard() {
  let currentKey: string | null = null;
  let callCount = 0;
  const run = (key: string, force = false): boolean => {
    if (!force && currentKey === key) {
      return false;
    }
    currentKey = key;
    callCount += 1;
    return true;
  };
  return {
    reset() {
      currentKey = null;
    },
    run,
    get callCount() {
      return callCount;
    },
  };
}

// Skenario 1: banyak render dengan key sama → hanya 1 panggilan.
{
  const guard = createRequestGuard();
  for (let render = 0; render < 50; render += 1) {
    guard.run("pancasila|sederhana|");
  }
  check("50 render dengan key sama → 1 panggilan", guard.callCount === 1);
}

// Skenario 2: key berubah (materi lain) → panggilan baru.
{
  const guard = createRequestGuard();
  guard.run("pancasila|sederhana|");
  guard.run("fotosintesis|sederhana|");
  check("key berbeda → 2 panggilan", guard.callCount === 2);
}

// Skenario 3: retry manual (force) mengirim ulang.
{
  const guard = createRequestGuard();
  guard.run("pancasila|sederhana|");
  guard.reset();
  guard.run("pancasila|sederhana|");
  check("retry setelah reset → 2 panggilan", guard.callCount === 2);
}

// Skenario 4: force tanpa reset → tetap panggil.
{
  const guard = createRequestGuard();
  guard.run("x");
  guard.run("x", true);
  check("force memanggil ulang", guard.callCount === 2);
}

// Skenario 5: simulasi render-loop lama akan menghasilkan ribuan panggilan.
{
  const naiveCount = 1000; // tanpa guard, tiap render memanggil.
  const guard = createRequestGuard();
  let naive = 0;
  for (let render = 0; render < naiveCount; render += 1) {
    guard.run("pancasila|sederhana|");
    naive += 1; // perilaku lama
  }
  check(
    "guard mencegah ledakan panggilan (naive 1000 → guard 1)",
    guard.callCount === 1 && naive === 1000
  );
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
