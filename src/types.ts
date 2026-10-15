// Tipe domain aplikasi.
//
// `LearningModule` adalah bentuk yang dipakai seluruh UI. Data dasarnya berasal
// dari backend (`materials.list`), sedangkan bagian yang dibuat AI (ringkasan,
// kartu belajar, kuis) diisi malas saat dibutuhkan lewat prosedur `ai.*`.

export interface Paragraph {
  content: string;
  heading?: string;
  id: number;
  keywords?: string[];
  /** Versi ringkas hasil `ai.simplify` — hanya terisi setelah diminta. */
  simplified?: string;
}

export interface Flashcard {
  answer: string;
  category: string;
  hint?: string;
  id: number;
  question: string;
}

export interface QuizQuestion {
  correctIndex: number;
  explanation: string;
  id: number;
  options: string[];
  question: string;
}

export interface VoicePrompt {
  expectedKeywords: string[];
  question: string;
  sampleGoodAnswer: string;
  tip: string;
}

export interface LearningModule {
  badges: string[];
  category: "Sains" | "Bahasa" | "Sosial" | "Semua";
  description: string;
  /** Kosong sampai `ai.flashcards` dipanggil. */
  flashcards: Flashcard[];
  hasAudio: boolean;
  hasSummary: boolean;
  iconBg: string;
  iconColor: string;
  iconName: string;
  /** ID material dari backend (mis. UUID dari tabel `materials`). */
  id: string;
  /** Skor kuis terbaik (0–100) dari `progress.summary`, 0 bila belum pernah. */
  masteryPercentage: number;
  paragraphs: Paragraph[];
  /** Kosong sampai `ai.quiz` dipanggil. */
  quiz: QuizQuestion[];
  readTime: string;
  sourceBadge: string;
  subjectBadge: string;
  title: string;
  voicePrompt: VoicePrompt;
}

export interface AccessibilitySettings {
  dyslexiaFont: boolean;
  fontSize: "sm" | "md" | "lg" | "xl";
  friendlyVoice: boolean;
  readingRuler: boolean;
  rulerY: number;
  speechSpeed: number;
  warmTheme: boolean;
}

export interface DailyMission {
  completed: boolean;
  description: string;
  id: string;
  rewardXp: number;
  title: string;
  type: "reading" | "quiz";
}
