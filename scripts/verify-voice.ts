/**
 * Verifikasi logika lisan & gamifikasi — murni, tanpa jaringan.
 *
 * Menguji dua hal yang menjadi inti permintaan fitur ini:
 * 1. **Penilaian jawaban suara** (`evaluateVoiceAnswer`) — jawaban dengan cukup
 *    kata kunci dinilai benar (dan layak dapat XP); selain itu salah dengan saran.
 * 2. **Rentetan harian** (`nextStreak`) — belajar berkali-kali sehari tetap 1 hari,
 *    hari berikutnya bertambah, dan hari yang terlewat kembali ke 1.
 *
 * Keduanya dipakai server (`progress.recordVoiceAttempt`/`reward`) sehingga
 * keputusan benar/salah dan perhitungan XP konsisten.
 */

import {
  dayDifference,
  evaluateVoiceAnswer,
  matchedKeywords,
  nextStreak,
  normalizeSpoken,
  requiredMatches,
  toDateOnly,
} from "../packages/api/src/voice";

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

// --- Normalisasi ucapan ----------------------------------------------------
check(
  "normalisasi huruf kecil",
  normalizeSpoken("FOTOSINTESIS") === "fotosintesis"
);
check(
  "normalisasi buang tanda baca",
  normalizeSpoken("Cahaya, matahari!") === "cahaya matahari"
);
check("normalisasi rapikan spasi", normalizeSpoken("a   b\t c") === "a b c");

// --- Ambang kecocokan menyesuaikan jumlah kata kunci ----------------------
check("1 kata kunci → cukup 1", requiredMatches(1) === 1);
check("2 kata kunci → cukup 2", requiredMatches(2) === 2);
check("5 kata kunci → cukup 2", requiredMatches(5) === 2);

// --- Pencocokan kata kunci -------------------------------------------------
const keywords = ["cahaya", "matahari", "klorofil", "glukosa"];
check(
  "kata kunci terucap terdeteksi",
  matchedKeywords("tumbuhan butuh cahaya matahari", keywords).length === 2
);
check(
  "kata kunci tanpa tanda baca tetap cocok",
  matchedKeywords("Cahaya matahari penting", keywords).length === 2
);
check(
  "tanpa kata kunci → kosong",
  matchedKeywords("tidak tahu", keywords).length === 0
);

// --- Penilaian jawaban: BENAR ---------------------------------------------
{
  const result = evaluateVoiceAnswer({
    expectedKeywords: keywords,
    transcript: "Tumbuhan menyerap cahaya matahari untuk membuat makanan",
  });
  check("jawaban menyebut 2 kata kunci dinilai benar", result.correct);
  check("umpan balik benar menyebut poin", result.feedback.includes("cahaya"));
  check("kata kunci terucap dilaporkan", result.matchedKeywords.length >= 2);
  check("sisa kata kunci dicatat", result.missingKeywords.length === 2);
}

// --- Penilaian jawaban: SALAH (kata kunci kurang) -------------------------
{
  const result = evaluateVoiceAnswer({
    expectedKeywords: keywords,
    sampleAnswer: "Contoh jawaban benar.",
    transcript: "Tumbuhan hijau itu bagus",
  });
  check("jawaban tanpa kata kunci dinilai salah", !result.correct);
  check("saran menyebut kata kunci", result.feedback.includes("cahaya"));
  check("saran menyertakan contoh jawaban", result.feedback.includes("Contoh"));
}

// --- Penilaian jawaban: TIDAK ADA SUARA -----------------------------------
{
  const result = evaluateVoiceAnswer({
    expectedKeywords: keywords,
    transcript: "   ",
  });
  check("rekaman kosong dinilai salah", !result.correct);
  check(
    "rekaman kosong memberi pesan mikrofon",
    result.feedback.includes("mikrofon")
  );
}

// --- Materi dengan satu kata kunci tetap bisa dinilai benar ---------------
{
  const result = evaluateVoiceAnswer({
    expectedKeywords: ["pancasila"],
    transcript: "Pancasila adalah dasar negara",
  });
  check("satu kata kunci cukup untuk benar", result.correct);
}

// --- Tanggal & selisih hari ----------------------------------------------
check(
  "toDateOnly format YYYY-MM-DD",
  /^\d{4}-\d{2}-\d{2}$/.test(toDateOnly(new Date()))
);
check("selisih 1 hari", dayDifference("2026-10-15", "2026-10-16") === 1);
check("selisih 0 hari", dayDifference("2026-10-16", "2026-10-16") === 0);
check("selisih 3 hari", dayDifference("2026-10-13", "2026-10-16") === 3);
check(
  "tanggal rusak → NaN",
  Number.isNaN(dayDifference("rusak", "2026-10-16"))
);

// --- Rentetan harian ------------------------------------------------------
{
  const first = nextStreak({
    lastActiveDate: null,
    streakDays: 0,
    today: "2026-10-16",
  });
  check("aktivitas pertama → rentetan 1", first.streakDays === 1);
  check("aktivitas pertama mengubah hari", first.changedToday);
  check("tanggal aktivitas diperbarui", first.lastActiveDate === "2026-10-16");
}
{
  const same = nextStreak({
    lastActiveDate: "2026-10-16",
    streakDays: 3,
    today: "2026-10-16",
  });
  check("belajar lagi di hari sama → rentetan tetap", same.streakDays === 3);
  check("hari sama bukan perubahan hari", !same.changedToday);
}
{
  const next = nextStreak({
    lastActiveDate: "2026-10-15",
    streakDays: 3,
    today: "2026-10-16",
  });
  check("hari berikutnya → rentetan bertambah", next.streakDays === 4);
  check("hari berikutnya mengubah hari", next.changedToday);
}
{
  const broken = nextStreak({
    lastActiveDate: "2026-10-10",
    streakDays: 9,
    today: "2026-10-16",
  });
  check("hari terlewat → rentetan kembali ke 1", broken.streakDays === 1);
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
