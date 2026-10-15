import type { FocusProfileId } from "@mudahin/api/schemas";

import type {
  Flashcard,
  LearningModule,
  Paragraph,
  QuizQuestion,
} from "../../types";

/**
 * Utilitas pemetaan hasil AI (backend) → tipe UI.
 *
 * Bentuk respons backend berbeda nama fieldnya (mis. `answerIndex` vs
 * `correctIndex`, `term`/`definition` vs `question`/`answer`), jadi semua
 * konversi terpusat di sini agar komponen tidak perlu tahu detail kontrak.
 */

/** Teks materi yang dikirim ke AI: judul + seluruh paragraf. */
export function moduleToText(module: LearningModule): string {
  const body = module.paragraphs
    .map((paragraph) => paragraph.content)
    .join("\n\n");
  return `${module.title}\n\n${body}`;
}

/**
 * Menyebar poin ringkasan AI ke paragraf.
 *
 * `ai.simplify` mengembalikan daftar poin global (bukan per paragraf). Kita
 * memetakannya berurutan; paragraf yang tidak kebagian tetap memakai teks asli.
 */
export function applySimplifiedPoints(
  paragraphs: Paragraph[],
  points: string[]
): Paragraph[] {
  if (points.length === 0) {
    return paragraphs;
  }
  return paragraphs.map((paragraph, index) => ({
    ...paragraph,
    // Bila jumlah poin lebih sedikit, poin terakhir diulang untuk sisa paragraf.
    simplified: points[index] ?? points.at(-1),
  }));
}

/** Mengubah soal kuis backend menjadi soal UI (`answerIndex` → `correctIndex`). */
export function toQuizQuestions(
  questions: {
    id: string;
    question: string;
    options: string[];
    answerIndex: number;
    explanation: string;
  }[]
): QuizQuestion[] {
  return questions.map((question, index) => ({
    id: index + 1,
    question: question.question,
    options: question.options,
    correctIndex: question.answerIndex,
    explanation: question.explanation,
  }));
}

/** Mengubah kartu belajar backend (`term`/`definition`) menjadi kartu UI. */
export function toFlashcards(
  cards: { id: string; term: string; definition: string }[]
): Flashcard[] {
  return cards.map((card, index) => ({
    id: index + 1,
    question: card.term,
    answer: card.definition,
    category: "Kartu Belajar",
  }));
}

/**
 * Menentukan profil fokus yang dikirim ke AI dari setelan aksesibilitas UI.
 *
 * Prioritas: font disleksia → `disleksia`; teks ekstra besar/warna hangat →
 * `low-vision`. Selain itu tidak ada penyesuaian profil khusus.
 */
export function deriveFocusProfile(settings: {
  dyslexiaFont: boolean;
  fontSize: string;
  warmTheme: boolean;
}): FocusProfileId | undefined {
  if (settings.dyslexiaFont) {
    return "disleksia";
  }
  if (settings.fontSize === "xl" || settings.warmTheme) {
    return "low-vision";
  }
  return undefined;
}
