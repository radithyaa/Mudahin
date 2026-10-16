import type { VoiceEvaluation } from "./schemas";

/**
 * Logika murni untuk evaluasi jawaban lisan & perhitungan rentetan harian.
 *
 * Keduanya **tanpa efek samping dan tanpa jaringan** supaya dapat diuji langsung
 * (`scripts/verify-voice.ts`) dan dipakai bersama client & server. Penilaian
 * sengaja tidak memanggil AI: kecocokan kata kunci deterministik cukup akurat
 * untuk jawaban pendek, hemat kuota, dan tetap bekerja saat perangkat luring.
 */

/** Jumlah kata kunci yang perlu terucap agar jawaban dianggap benar. */
export const REQUIRED_KEYWORD_MATCHES = 2;

/** Jumlah minimum kata kunci yang dianggap cukup bila totalnya sedikit. */
const MIN_KEYWORDS_FOR_FULL_REQUIREMENT = 2;

/** Batas panjang transkrip yang ditampilkan pada riwayat. */
export const TRANSCRIPT_DISPLAY_MAX_CHARS = 400;

/** Normalisasi ringan: huruf kecil, tanda baca dibuang, spasi dirapikan. */
export function normalizeSpoken(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Berapa banyak kata kunci yang perlu terucap untuk materi dengan `total` kunci.
 *
 * Materi berjudul pendek bisa hanya punya 1–2 kata kunci; menuntut dua kecocokan
 * di situ akan selalu gagal. Karena itu ambang menyesuaikan jumlah kata kunci.
 */
export function requiredMatches(total: number): number {
  if (total <= 1) {
    return 1;
  }
  if (total < MIN_KEYWORDS_FOR_FULL_REQUIREMENT) {
    return 1;
  }
  return Math.min(REQUIRED_KEYWORD_MATCHES, total);
}

/** Kata kunci yang benar-benar muncul pada ucapan (sudah dinormalisasi). */
export function matchedKeywords(
  transcript: string,
  expectedKeywords: string[]
): string[] {
  const spoken = normalizeSpoken(transcript);
  if (spoken.length === 0) {
    return [];
  }
  return expectedKeywords.filter((keyword) => {
    const needle = normalizeSpoken(keyword);
    return needle.length > 0 && spoken.includes(needle);
  });
}

/**
 * Menilai jawaban lisan secara deterministik.
 *
 * Benar bila cukup kata kunci penting terucap; selain itu salah, dengan saran
 * menyebutkan kata kunci yang belum muncul agar pengguna tahu harus menambah apa.
 */
export function evaluateVoiceAnswer(input: {
  expectedKeywords: string[];
  sampleAnswer?: string;
  transcript: string;
}): VoiceEvaluation {
  const expected = input.expectedKeywords
    .map((keyword) => keyword.trim())
    .filter((keyword) => keyword.length > 0);
  const spoken = input.transcript.trim();

  if (spoken.length === 0) {
    return {
      correct: false,
      feedback:
        "Belum ada suara yang terbaca. Coba lagi dan bicara agak lebih dekat ke mikrofon ya!",
      matchedKeywords: [],
      missingKeywords: expected,
    };
  }

  const matched = matchedKeywords(spoken, expected);
  const missing = expected.filter((keyword) => !matched.includes(keyword));

  if (matched.length >= requiredMatches(expected.length)) {
    const highlights = matched.slice(0, 3).map((keyword) => `“${keyword}”`);
    return {
      correct: true,
      feedback:
        highlights.length > 0
          ? `Keren banget! Kamu sudah menyebut poin penting: ${highlights.join(", ")}. Penjelasanmu mengalir jelas!`
          : "Keren banget! Jawabanmu sudah tepat dan mengalir jelas!",
      matchedKeywords: matched,
      missingKeywords: missing,
    };
  }

  const suggestion =
    missing.length > 0
      ? `Coba sebutkan juga kata kuncinya ya, seperti: ${missing
          .slice(0, 3)
          .join(", ")}.`
      : "Coba jelaskan dengan kalimat yang lebih lengkap ya.";

  return {
    correct: false,
    feedback: [
      "Bagus sudah berani menjawab dengan suara!",
      suggestion,
      input.sampleAnswer ? `Contoh jawaban: ${input.sampleAnswer}` : "",
    ]
      .filter(Boolean)
      .join(" "),
    matchedKeywords: matched,
    missingKeywords: missing,
  };
}

/**
 * Tanggal lokal perangkat dalam bentuk `YYYY-MM-DD`.
 *
 * Rentetan dihitung per hari kalender **pengguna**, bukan UTC, supaya belajar
 * tengah malam tidak dianggap sebagai hari berbeda.
 */
export function toDateOnly(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Selisih hari kalender antara dua tanggal `YYYY-MM-DD` (b − a). */
export function dayDifference(from: string, to: string): number {
  const start = Date.parse(`${from}T00:00:00Z`);
  const end = Date.parse(`${to}T00:00:00Z`);
  if (Number.isNaN(start) || Number.isNaN(end)) {
    return Number.NaN;
  }
  return Math.round((end - start) / 86_400_000);
}

/**
 * Menghitung rentetan harian setelah satu aktivitas belajar hari ini.
 *
 * - hari yang sama → rentetan tidak berubah (belajar berkali-kali tetap 1 hari);
 * - hari berikutnya → rentetan bertambah;
 * - hari yang terlewat → rentetan kembali ke 1.
 */
export function nextStreak(input: {
  lastActiveDate: string | null;
  streakDays: number;
  today: string;
}): { changedToday: boolean; lastActiveDate: string; streakDays: number } {
  const { lastActiveDate, streakDays, today } = input;

  if (lastActiveDate === today) {
    return {
      changedToday: false,
      lastActiveDate: today,
      streakDays: Math.max(1, streakDays),
    };
  }

  const gap =
    lastActiveDate === null ? Number.NaN : dayDifference(lastActiveDate, today);

  return {
    changedToday: true,
    lastActiveDate: today,
    streakDays: gap === 1 ? Math.max(1, streakDays) + 1 : 1,
  };
}
