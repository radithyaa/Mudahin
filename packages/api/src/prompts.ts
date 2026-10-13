import type { DeepSeekMessage } from "./ai";
import type {
  ExplainInput,
  FocusProfileId,
  QuizInput,
  SimplifyInput,
} from "./schemas";

/**
 * Prompt AI terpusat (Aturan Teknis §4.3 & §6.6).
 * Semua prompt memakai Bahasa Indonesia dan menyatakan format output eksplisit.
 */

const SYSTEM_BASE =
  "Kamu adalah asisten belajar untuk siswa sekolah dasar di Indonesia. " +
  "Gunakan Bahasa Indonesia yang sederhana, hangat, dan mudah dipahami anak. " +
  "Selalu balas HANYA dengan JSON valid sesuai format yang diminta, tanpa penjelasan tambahan.";

/** Panduan tambahan berdasarkan profil aksesibilitas siswa. */
function profileHint(profile?: FocusProfileId): string {
  switch (profile) {
    case "kendala-bahasa":
      return "Siswa belum lancar Bahasa Indonesia baku: gunakan kalimat pendek dan kata sehari-hari.";
    case "disleksia":
      return "Siswa disleksia: hindari kalimat panjang dan kata rumit.";
    case "adhd":
      return "Siswa sulit fokus: buat poin sangat singkat dan berurutan.";
    case "low-vision":
      return "Siswa penglihatan rendah: utamakan kejelasan, hindari singkatan.";
    default:
      return "";
  }
}

export function buildSimplifyMessages(input: SimplifyInput): DeepSeekMessage[] {
  const detail =
    input.level === "sangat-sederhana"
      ? "Sangat sederhana: setiap poin maksimal 12 kata, seperti untuk anak kelas 3 SD."
      : "Sederhana: setiap poin 1–2 kalimat pendek.";

  return [
    { role: "system", content: SYSTEM_BASE },
    {
      role: "user",
      content: [
        "Sederhanakan materi berikut menjadi 3 sampai 5 poin ringkas.",
        detail,
        profileHint(input.profile),
        'Balas dengan JSON berbentuk: {"points": ["poin 1", "poin 2"]}',
        "",
        "MATERI:",
        input.text,
      ]
        .filter(Boolean)
        .join("\n"),
    },
  ];
}

export function buildQuizMessages(input: QuizInput): DeepSeekMessage[] {
  return [
    { role: "system", content: SYSTEM_BASE },
    {
      role: "user",
      content: [
        `Buat ${input.count} soal pilihan ganda dari materi berikut.`,
        "Setiap soal punya tepat 4 pilihan, satu jawaban benar, dan pembahasan singkat.",
        profileHint(input.profile),
        "Balas dengan JSON berbentuk:",
        '{"questions":[{"question":"...","options":["A","B","C","D"],"answerIndex":0,"explanation":"..."}]}',
        "`answerIndex` adalah indeks (0-3) pilihan yang benar.",
        "",
        "MATERI:",
        input.text,
      ]
        .filter(Boolean)
        .join("\n"),
    },
  ];
}

export function buildExplainMessages(input: ExplainInput): DeepSeekMessage[] {
  return [
    { role: "system", content: SYSTEM_BASE },
    {
      role: "user",
      content: [
        "Jelaskan potongan teks berikut dengan bahasa yang sangat sederhana.",
        "Jelaskan maksudnya, bukan sekadar mengulang kalimatnya.",
        "Maksimal 3 kalimat pendek.",
        profileHint(input.profile),
        'Balas dengan JSON berbentuk: {"explanation": "penjelasan singkat"}',
        "",
        "POTONGAN TEKS:",
        input.text,
        input.context
          ? `\nKONTEKS MATERI (untuk acuan):\n${input.context}`
          : "",
      ]
        .filter(Boolean)
        .join("\n"),
    },
  ];
}

export function buildFlashcardMessages(
  input: SimplifyInput
): DeepSeekMessage[] {
  return [
    { role: "system", content: SYSTEM_BASE },
    {
      role: "user",
      content: [
        "Buat 4 sampai 6 kartu belajar (flashcard) dari materi berikut.",
        "Setiap kartu punya satu istilah/kata kunci dan definisi singkatnya.",
        "Definisi maksimal 15 kata dan memakai bahasa sehari-hari.",
        profileHint(input.profile),
        "Balas dengan JSON berbentuk:",
        '{"deckTitle":"Judul singkat","cards":[{"term":"kata kunci","definition":"arti singkat"}]}',
        "",
        "MATERI:",
        input.text,
      ]
        .filter(Boolean)
        .join("\n"),
    },
  ];
}

export function buildMindMapMessages(input: SimplifyInput): DeepSeekMessage[] {
  return [
    { role: "system", content: SYSTEM_BASE },
    {
      role: "user",
      content: [
        "Ubah materi berikut menjadi peta pikiran (mind map) sederhana.",
        "Buat satu topik utama dan 2 sampai 4 cabang.",
        "Setiap cabang punya 1 sampai 3 anak ide yang sangat singkat (maksimal 6 kata).",
        profileHint(input.profile),
        "Balas dengan JSON berbentuk:",
        '{"root":"Topik utama","branches":[{"label":"Cabang","leaves":["ide 1","ide 2"]}]}',
        "",
        "MATERI:",
        input.text,
      ]
        .filter(Boolean)
        .join("\n"),
    },
  ];
}
