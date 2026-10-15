import type { Material } from "@mudahin/api/materials";

import type { LearningModule, Paragraph, VoicePrompt } from "../../types";

/**
 * Adaptor `Material` (kontrak backend) → `LearningModule` (bentuk UI).
 *
 * Backend hanya menyimpan judul/subjek/paragraf; ikon, badge, kategori, dan
 * teaser diperkaya di sini agar tampilan tetap kaya tanpa mengubah API.
 */

const SUBJECT_STYLES: Record<
  string,
  {
    category: LearningModule["category"];
    icon: string;
    bg: string;
    color: string;
  }
> = {
  IPA: { category: "Sains", icon: "science", bg: "#E8F8F0", color: "#006C49" },
  Matematika: {
    category: "Sains",
    icon: "calculate",
    bg: "#EDE9FE",
    color: "#4f46e5",
  },
  PPKn: { category: "Sosial", icon: "gavel", bg: "#FEF3C7", color: "#92400E" },
  IPS: { category: "Sosial", icon: "public", bg: "#E0F2FE", color: "#0369A1" },
  Bahasa: {
    category: "Bahasa",
    icon: "menu_book",
    bg: "#FCE7F3",
    color: "#9D174D",
  },
};

const DEFAULT_STYLE = {
  category: "Semua" as const,
  icon: "auto_stories",
  bg: "#eaedff",
  color: "#3525cd",
};

/** Pemisah kata untuk ekstraksi kata kunci prompt lisan. */
const WHITESPACE_PATTERN = /\s+/;

/** Memilih gaya ikon/warna berdasarkan subjek materi. */
function styleFor(subject: string) {
  return SUBJECT_STYLES[subject] ?? DEFAULT_STYLE;
}

/** Memecah paragraf menjadi `Paragraph` bernomor dengan heading ringkas. */
function toParagraphs(paragraphs: string[]): Paragraph[] {
  return paragraphs.map((content, index) => ({
    id: index + 1,
    heading: `Bagian ${index + 1}`,
    content,
  }));
}

/** Prompt lisan default bila belum dibuat AI (dibacakan, dijawab dengan suara). */
export function buildVoicePrompt(module: LearningModule): VoicePrompt {
  const keywords = module.title
    .toLowerCase()
    .split(WHITESPACE_PATTERN)
    .filter((word) => word.length > 4)
    .slice(0, 4);

  return {
    question: `Coba ceritakan dengan kata-katamu sendiri: apa hal paling penting dari ${module.title}?`,
    expectedKeywords:
      keywords.length > 0 ? keywords : [module.title.toLowerCase()],
    sampleGoodAnswer: `Yang saya pahami dari ${module.title} adalah konsepnya saling berkaitan dan berguna untuk kehidupan sehari-hari.`,
    tip: "Santai saja, bayangkan kamu sedang menjelaskan ke teman sebangku!",
  };
}

/** Mengubah satu `Material` backend menjadi `LearningModule` untuk UI. */
export function toLearningModule(
  material: Material,
  bestScore = 0
): LearningModule {
  const style = styleFor(material.subject);

  const module: LearningModule = {
    id: material.id,
    title: material.title,
    category: style.category,
    subjectBadge: `${material.subject} • ${material.gradeLevel}`,
    sourceBadge: `${material.subject} • Materi Pustaka`,
    iconName: style.icon,
    iconBg: style.bg,
    iconColor: style.color,
    description: material.summary,
    readTime: `${material.readingMinutes} Menit Baca`,
    badges: [
      `${material.readingMinutes} Menit Baca`,
      "Font Ramah Mata",
      "Ada Audio",
    ],
    hasAudio: true,
    hasSummary: true,
    masteryPercentage: bestScore,
    paragraphs: toParagraphs(material.paragraphs),
    flashcards: [],
    quiz: [],
    voicePrompt: {
      question: "",
      expectedKeywords: [],
      sampleGoodAnswer: "",
      tip: "",
    },
  };

  module.voicePrompt = buildVoicePrompt(module);
  return module;
}

/** Mengubah daftar materi backend menjadi daftar modul UI. */
export function toLearningModules(materials: Material[]): LearningModule[] {
  return materials.map((material) => toLearningModule(material));
}

/** Melampirkan skor kuis terbaik (dari `progress.summary`) ke tiap modul. */
export function withProgressScores(
  modules: LearningModule[],
  scores: Map<string, number>
): LearningModule[] {
  return modules.map((module) => {
    const bestScore = scores.get(module.id);
    return bestScore === undefined
      ? module
      : { ...module, masteryPercentage: bestScore };
  });
}
