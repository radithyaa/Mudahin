export interface Paragraph {
  id: number;
  heading?: string;
  content: string;
  simplified: string;
  keywords?: string[];
}

export interface Flashcard {
  id: number;
  question: string;
  answer: string;
  hint?: string;
  category: string;
}

export interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface LearningModule {
  id: string;
  title: string;
  category: 'Sains' | 'Bahasa' | 'Sosial' | 'Semua';
  subjectBadge: string;
  sourceBadge: string;
  iconName: string;
  iconBg: string;
  iconColor: string;
  description: string;
  readTime: string;
  badges: string[];
  hasAudio: boolean;
  hasSummary: boolean;
  masteryPercentage: number;
  isRecentCompleted?: boolean;
  isFeatured?: boolean;
  lastProgressText?: string;
  paragraphs: Paragraph[];
  flashcards: Flashcard[];
  quiz: QuizQuestion[];
  voicePrompt: {
    question: string;
    expectedKeywords: string[];
    sampleGoodAnswer: string;
    tip: string;
  };
}

export interface AccessibilitySettings {
  fontSize: 'sm' | 'md' | 'lg' | 'xl';
  readingRuler: boolean;
  rulerY: number;
  friendlyVoice: boolean;
  warmTheme: boolean;
  dyslexiaFont: boolean;
  speechSpeed: number;
}

export interface DailyMission {
  id: string;
  title: string;
  description: string;
  rewardXp: number;
  completed: boolean;
  type: 'reading' | 'quiz';
  targetModuleId: string;
}
