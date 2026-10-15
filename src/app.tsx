import confetti from "canvas-confetti";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { FontSize } from "./components/accessibility-settings";
import { AccessibilitySheet } from "./components/accessibility-sheet";
import { AIProcessingModal } from "./components/ai-processing-modal";
import { AksesView } from "./components/akses-view";
import { AudioNarrationModal } from "./components/audio-narration-modal";
import { BelajarView } from "./components/belajar-view";
import { BottomNavBar } from "./components/bottom-nav-bar";
import { FlashcardModal } from "./components/flashcard-modal";
import { FocusReaderModal } from "./components/focus-reader-modal";
import { LatihanView } from "./components/latihan-view";
import {
  type PracticeKind,
  PracticePickerSheet,
} from "./components/practice-picker-sheet";
import { ProfilView } from "./components/profil-view";
import { QuizModal } from "./components/quiz-modal";
import { ReadingGuideOverlay } from "./components/reading-guide-overlay";
import { TopAppBar } from "./components/top-app-bar";
import { VoicePracticeModal } from "./components/voice-practice-modal";
import { deriveFocusProfile } from "./lib/api/ai";
import { buildVoicePrompt, withProgressScores } from "./lib/api/materials";
import { useAi } from "./lib/hooks/use-ai";
import { useCreateMaterial } from "./lib/hooks/use-create-material";
import { useMaterials } from "./lib/hooks/use-materials";
import { usePersistentState } from "./lib/hooks/use-persistent-state";
import {
  useProgressSummary,
  useRecordProgress,
} from "./lib/hooks/use-progress";
import type { DailyMission, LearningModule } from "./types";
import { soundEffects, stopSpeech } from "./utils/audio";

type TabId = "belajar" | "latihan" | "akses" | "profil";

/**
 * Skala huruf per pilihan ukuran teks.
 *
 * Dipetakan ke CSS variable `--a11y-font-scale` pada `<body>`; karena seluruh
 * UI memakai satuan `rem`, satu nilai ini menskalakan semua tipografi.
 */
const FONT_SCALE: Record<FontSize, string> = {
  sm: "0.88",
  md: "1",
  lg: "1.14",
  xl: "1.3",
};

/** Misi harian bersifat generik — berlaku untuk materi apa pun milik pengguna. */
const INITIAL_MISSIONS: DailyMission[] = [
  {
    id: "m1",
    title: "Bacaan Fokus",
    description: "Selesaikan satu bacaan dengan fokus",
    rewardXp: 20,
    completed: false,
    type: "reading",
  },
  {
    id: "m2",
    title: "Kuis Santai Adaptif",
    description: "Jawab kuis dari materi yang dibaca",
    rewardXp: 30,
    completed: false,
    type: "quiz",
  },
];

/**
 * Menandai misi harian selesai berdasarkan jenisnya.
 */
const markMissionDone = (
  missions: DailyMission[],
  type: DailyMission["type"]
): DailyMission[] =>
  missions.map((mission) =>
    mission.type === type ? { ...mission, completed: true } : mission
  );

export default function App() {
  const [activeTab, setActiveTab] = useState<TabId>("belajar");
  const [xp, setXp] = useState(0);
  const [missions, setMissions] = useState<DailyMission[]>(INITIAL_MISSIONS);

  // Pustaka materi dari backend (`materials.list`) — hanya milik pengguna ini.
  const materialsQuery = useMaterials();
  const materialsLoading = Boolean(materialsQuery.isLoading);
  const materialsError = Boolean(materialsQuery.isError);
  const materialsReady = !(materialsLoading || materialsError);
  const progressSummary = useProgressSummary();
  const recordProgress = useRecordProgress();
  const materials = useMemo(
    () =>
      withProgressScores(
        materialsQuery.data ?? [],
        new Map(
          (progressSummary.data?.items ?? []).map((item) => [
            item.materialId,
            item.bestScore,
          ])
        )
      ),
    [materialsQuery.data, progressSummary.data]
  );

  // Setelan aksesibilitas (hidup lokal, dipersistenkan agar tahan reload,
  // disinkronkan ke profil backend). Mobile-first & web compatible.
  const [fontSize, setFontSize] = usePersistentState<FontSize>(
    "fontSize",
    "md"
  );
  const [readingRuler, setReadingRuler] = usePersistentState<boolean>(
    "readingRuler",
    false
  );
  const [warmTheme, setWarmTheme] = usePersistentState<boolean>(
    "warmTheme",
    false
  );
  const [dyslexiaFont, setDyslexiaFont] = usePersistentState<boolean>(
    "dyslexiaFont",
    false
  );
  const [speechSpeed, setSpeechSpeed] = usePersistentState<number>(
    "speechSpeed",
    0.95
  );

  // Modals
  const [activeReaderModule, setActiveReaderModule] =
    useState<LearningModule | null>(null);
  const [activeFlashcardModule, setActiveFlashcardModule] =
    useState<LearningModule | null>(null);
  const [activeQuizModule, setActiveQuizModule] =
    useState<LearningModule | null>(null);
  const [activeVoiceModule, setActiveVoiceModule] =
    useState<LearningModule | null>(null);
  const [activeNarrationModule, setActiveNarrationModule] =
    useState<LearningModule | null>(null);
  /** Materi yang sedang dipilih pada dialog "Pilih Jenis Latihan". */
  const [practicePickerModule, setPracticePickerModule] =
    useState<LearningModule | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  /** Bottom sheet aksesibilitas yang dibuka dari tombol "tune" di navbar. */
  const [isA11ySheetOpen, setIsA11ySheetOpen] = useState(false);
  /** Id modul yang sudah selesai dibaca (untuk badge "Sudah Dibaca"). */
  const [readModules, setReadModules] = useState<string[]>([]);

  const ai = useAi();
  const createMaterial = useCreateMaterial();

  /** Profil fokus dikirim ke AI agar penyesuaian bahasa/format sesuai kebutuhan. */
  const focusProfile = useMemo(
    () => deriveFocusProfile({ dyslexiaFont, fontSize, warmTheme }),
    [dyslexiaFont, fontSize, warmTheme]
  );

  const showToast = useCallback((message: string) => {
    setToastMessage(message);
    globalThis.setTimeout(() => setToastMessage(null), 3200);
  }, []);

  // Terapkan skala huruf global. Karena `rem` mewarisi basis dari `body`, satu
  // variabel ini menskalakan seluruh teks (13px, 14px, 24px, …) sekaligus.
  useEffect(() => {
    document.body.style.setProperty("--a11y-font-scale", FONT_SCALE[fontSize]);
  }, [fontSize]);

  const gainXp = useCallback(
    (amount: number, reason?: string) => {
      setXp((prev) => prev + amount);
      if (reason) {
        showToast(`+${amount} XP! ${reason}`);
      }
    },
    [showToast]
  );

  // Selesai membaca di Focus Reader → tandai misi bacaan.
  //
  // Progres bacaan tidak dikirim ke `progress.record` karena prosedur itu
  // berorientasi kuis (menyimpan skor & menambah hitungan kuis). Bacaan cukup
  // dihitung lokal lewat misi harian.
  const handleCompleteReading = useCallback(
    (moduleId: string) => {
      gainXp(20, "Selesai membaca dengan fokus");
      setMissions((prev) => markMissionDone(prev, "reading"));
      setReadModules((prev) =>
        prev.includes(moduleId) ? prev : [...prev, moduleId]
      );
    },
    [gainXp]
  );

  // Selesai kuis → simpan skor (0–100) ke backend + tandai misi kuis.
  const handleCompleteQuiz = useCallback(
    (moduleId: string, correct: number, total: number) => {
      const score = total > 0 ? Math.round((correct / total) * 100) : 0;
      gainXp(40, "Kuis adaptif selesai");
      setMissions((prev) => markMissionDone(prev, "quiz"));
      recordProgress.mutate(
        { materialId: moduleId, score },
        {
          onError: () =>
            showToast(`Skor ${score}% tersimpan lokal (server offline).`),
        }
      );
    },
    [gainXp, recordProgress, showToast]
  );

  const allMissionsCompleted = missions.every((mission) => mission.completed);
  const handleClaimDailyBonus = () => {
    gainXp(50, "Bonus Misi Harian Berhasil Diklaim");
  };

  /**
   * Membuka modal latihan sesuai jenis yang dipilih di dialog.
   *
   * Kartu/soal untuk latihan tersebut dibuat AI dari materi terpilih saat
   * modalnya terbuka (masing-masing modal memanggil `ai.*` bila belum ada).
   */
  const handleSelectPractice = useCallback(
    (kind: PracticeKind, module: LearningModule) => {
      setPracticePickerModule(null);
      switch (kind) {
        case "flashcards":
          setActiveFlashcardModule(module);
          break;
        case "voice":
          setActiveVoiceModule(module);
          break;
        case "narration":
          setActiveNarrationModule(module);
          break;
        case "quiz":
          setActiveQuizModule(module);
          break;
        case "reader":
          setActiveReaderModule(module);
          break;
        default:
          break;
      }
    },
    []
  );

  const handleCycleFontSize = () => {
    const next: Record<FontSize, FontSize> = {
      sm: "md",
      md: "lg",
      lg: "xl",
      xl: "sm",
    };
    const newSize = next[fontSize];
    setFontSize(newSize);
    showToast(`Ukuran teks diubah ke: ${newSize.toUpperCase()}`);
  };

  /**
   * Membuat modul baru dari teks bebas / foto catatan.
   *
   * Input berupa **teks** diubah menjadi ringkasan + kuis via DeepSeek; bila
   * pengguna melampirkan foto/PDF, isinya dibaca lebih dulu (Gemini untuk foto,
   * ekstraksi teks di klien untuk PDF) lalu hasilnya dipakai sebagai materi.
   *
   * Materi yang dihasilkan **disimpan ke database** (`materials.create`) agar
   * masuk ke pustaka pengguna — bukan sekadar state sementara di layar.
   */
  const handleGenerateModule = useCallback(
    async (text: string, sourceText: string, imageDataUrl?: string) => {
      const topic = text.trim();
      if (!(topic || sourceText.trim() || imageDataUrl)) {
        showToast("Tulis topik atau lampirkan catatan dulu ya.");
        return;
      }

      setIsGenerating(true);
      try {
        let combined = sourceText.trim() || topic;
        let ocrDeck: Awaited<
          ReturnType<typeof ai.ocrToFlashcards.mutateAsync>
        > | null = null;

        if (imageDataUrl) {
          ocrDeck = await ai.ocrToFlashcards.mutateAsync({
            imageDataUrl,
            profile: focusProfile,
          });
          combined = [ocrDeck.extractedText, topic]
            .filter(Boolean)
            .join("\n\n");
        }

        if (!combined.trim()) {
          throw new Error("Catatan tidak terbaca.");
        }

        // Ringkasan santai + kuis 3 soal dijalankan bersamaan (server men-cache).
        const [summary, quizResult] = await Promise.all([
          ai.simplify.mutateAsync({ text: combined, profile: focusProfile }),
          ai.quiz.mutateAsync({
            text: combined,
            count: 3,
            profile: focusProfile,
          }),
        ]);

        const title =
          topic.split("\n")[0].slice(0, 60) ||
          ocrDeck?.deckTitle ||
          "Catatan Baru dari Teman AI";

        const paragraphs = summary.points.map((point) => point.trim());
        const firstParagraph = paragraphs[0] ?? "Materi baru hasil olahan AI.";

        const created = await createMaterial.mutateAsync({
          title,
          subject: "Materi AI",
          gradeLevel: "Umum",
          summary: firstParagraph.slice(0, 240),
          readingMinutes: Math.max(1, Math.ceil(paragraphs.length / 2)),
          paragraphs,
        });

        const newModule: LearningModule = {
          id: created.id,
          title: created.title,
          category: "Sains",
          subjectBadge: "Materi AI • Umum",
          sourceBadge: imageDataUrl
            ? "Dibuat dari Foto Catatan"
            : "Dibuat dari Tanya Teman AI",
          iconName: "auto_awesome",
          iconBg: "#EDE9FE",
          iconColor: "#4f46e5",
          description: created.summary,
          readTime: `${created.readingMinutes} Menit Baca`,
          badges: ["Baru Dibuat", "Font Ramah Mata", "Ada Audio"],
          hasAudio: true,
          hasSummary: true,
          masteryPercentage: 0,
          paragraphs: created.paragraphs.map((point, index) => ({
            id: index + 1,
            heading: `Poin ${index + 1}`,
            content: point,
          })),
          flashcards: ocrDeck
            ? ocrDeck.cards.map((card, index) => ({
                id: index + 1,
                question: card.term,
                answer: card.definition,
                category: "Kartu Belajar",
              }))
            : [],
          quiz: quizResult.questions.map((question, index) => ({
            id: index + 1,
            question: question.question,
            options: question.options,
            correctIndex: question.answerIndex,
            explanation: question.explanation,
          })),
          voicePrompt: {
            question: "",
            expectedKeywords: [],
            sampleGoodAnswer: "",
            tip: "",
          },
        };
        newModule.voicePrompt = buildVoicePrompt(newModule);

        soundEffects.playSuccess();
        confetti({ particleCount: 70, spread: 80, origin: { y: 0.6 } });
        showToast(`Modul "${newModule.title}" berhasil diolah oleh Teman AI!`);
      } catch (error) {
        showToast(
          error instanceof Error
            ? error.message
            : "Gagal mengolah catatan. Silakan coba kembali."
        );
      } finally {
        setIsGenerating(false);
      }
    },
    [ai, createMaterial, focusProfile, showToast]
  );

  return (
    <div
      className={`flex min-h-screen flex-col items-center bg-[#faf8ff] text-[#131b2e] selection:bg-[#dad7ff] selection:text-[#3525cd] ${
        warmTheme ? "theme-warm" : ""
      } ${dyslexiaFont ? "font-dyslexia" : ""}`}
    >
      <ReadingGuideOverlay active={readingRuler} />

      {toastMessage ? (
        <div className="fade-in slide-in-from-top-3 fixed top-4 z-50 flex animate-in items-center gap-2 rounded-2xl bg-[#131b2e] px-4 py-2.5 font-bold text-[13px] text-white shadow-xl">
          <span className="material-symbols-outlined fill-icon text-[#F59E0B] text-[18px]">
            verified
          </span>
          <span>{toastMessage}</span>
        </div>
      ) : null}

      <TopAppBar
        onOpenAccessibility={() => setIsA11ySheetOpen(true)}
        onOpenProfile={() => setActiveTab("profil")}
        streakDays={progressSummary.data?.quizzedCount ?? 0}
        xp={xp}
      />

      <div
        className="flex w-full flex-1 flex-col"
        style={{
          paddingBottom: "calc(var(--navbar-height) + var(--safe-bottom))",
          paddingLeft: "var(--safe-left)",
          paddingRight: "var(--safe-right)",
        }}
      >
        {materialsLoading ? (
          <div className="mx-auto w-full max-w-xl px-4 pt-10 text-center font-semibold text-[#464555]">
            Memuat pustaka materi…
          </div>
        ) : null}

        {materialsError ? (
          <div className="mx-auto w-full max-w-xl px-4 pt-10">
            <div className="rounded-2xl border-2 border-[#F59E0B] bg-[#FEF3C7] p-4 font-semibold text-[#92400E] text-[14px]">
              Tidak bisa memuat materi dari server. Periksa koneksi lalu coba
              lagi.
            </div>
          </div>
        ) : null}

        {materialsReady && activeTab === "belajar" ? (
          <BelajarView
            currentFontSize={fontSize}
            isGenerating={isGenerating}
            missions={missions}
            modules={materials}
            onGenerateModule={handleGenerateModule}
            onGoToLatihan={() => setActiveTab("latihan")}
            onOpenPractice={(mod) => setPracticePickerModule(mod)}
            onOpenReader={(mod) => setActiveReaderModule(mod)}
            onToggleFontSize={handleCycleFontSize}
            onToggleRuler={() => {
              setReadingRuler(!readingRuler);
              showToast(
                readingRuler
                  ? "Garis Baca Dinonaktifkan"
                  : "Garis Baca Diaktifkan"
              );
            }}
            onToggleWarm={() => {
              setWarmTheme(!warmTheme);
              showToast(warmTheme ? "Warna Normal" : "Mode Warna Hangat Aktif");
            }}
            readModules={readModules}
            rulerActive={readingRuler}
            warmActive={warmTheme}
          />
        ) : null}

        {materialsReady && activeTab === "latihan" ? (
          <LatihanView
            modules={materials}
            onOpenAiStudioPrompt={() => {
              setActiveTab("belajar");
              showToast("Tulis topik atau unggah catatan di kotak Teman AI!");
            }}
            onOpenPractice={(mod) => setPracticePickerModule(mod)}
          />
        ) : null}

        {activeTab === "akses" && (
          <AksesView
            dyslexiaFont={dyslexiaFont}
            fontSize={fontSize}
            onChangeFontSize={setFontSize}
            onChangeSpeechSpeed={setSpeechSpeed}
            onToggleDyslexiaFont={() => setDyslexiaFont(!dyslexiaFont)}
            onToggleRuler={() => setReadingRuler(!readingRuler)}
            onToggleWarm={() => setWarmTheme(!warmTheme)}
            readingRuler={readingRuler}
            speechSpeed={speechSpeed}
            warmTheme={warmTheme}
          />
        )}

        {activeTab === "profil" && (
          <ProfilView
            canClaimBonus={allMissionsCompleted}
            completedMissions={missions.filter((m) => m.completed).length}
            onClaimDailyBonus={handleClaimDailyBonus}
            onRestoreSettings={(restored) => {
              setFontSize(restored.fontSize);
              setReadingRuler(restored.readingRuler);
              setWarmTheme(restored.warmTheme);
              setDyslexiaFont(restored.dyslexiaFont);
              setSpeechSpeed(restored.speechSpeed);
            }}
            progress={progressSummary.data}
            settings={{
              fontSize,
              readingRuler,
              warmTheme,
              dyslexiaFont,
              speechSpeed,
            }}
            streakDays={Math.max(0, progressSummary.data?.quizzedCount ?? 0)}
            xp={xp}
          />
        )}
      </div>

      <BottomNavBar activeTab={activeTab} onChangeTab={setActiveTab} />

      <AccessibilitySheet
        dyslexiaFont={dyslexiaFont}
        fontSize={fontSize}
        onChangeFontSize={setFontSize}
        onChangeSpeechSpeed={setSpeechSpeed}
        onClose={() => setIsA11ySheetOpen(false)}
        onToggleDyslexiaFont={() => setDyslexiaFont(!dyslexiaFont)}
        onToggleRuler={() => setReadingRuler(!readingRuler)}
        onToggleWarm={() => setWarmTheme(!warmTheme)}
        open={isA11ySheetOpen}
        readingRuler={readingRuler}
        speechSpeed={speechSpeed}
        warmTheme={warmTheme}
      />

      <PracticePickerSheet
        module={practicePickerModule}
        onClose={() => setPracticePickerModule(null)}
        onSelect={handleSelectPractice}
      />

      {activeReaderModule ? (
        <FocusReaderModal
          focusProfile={focusProfile}
          fontSize={fontSize}
          isWarmTheme={warmTheme}
          module={activeReaderModule}
          onClose={() => setActiveReaderModule(null)}
          onCompleteReading={handleCompleteReading}
          onToggleRuler={() => setReadingRuler(!readingRuler)}
          onToggleWarm={() => setWarmTheme(!warmTheme)}
          readingRulerActive={readingRuler}
        />
      ) : null}

      {activeFlashcardModule ? (
        <FlashcardModal
          focusProfile={focusProfile}
          module={activeFlashcardModule}
          onClose={() => setActiveFlashcardModule(null)}
          onComplete={(xpGained) =>
            gainXp(xpGained, "Latihan flashcard selesai")
          }
        />
      ) : null}

      {activeQuizModule ? (
        <QuizModal
          focusProfile={focusProfile}
          module={activeQuizModule}
          onClose={() => setActiveQuizModule(null)}
          onComplete={(correct, total) =>
            handleCompleteQuiz(activeQuizModule.id, correct, total)
          }
        />
      ) : null}

      {activeVoiceModule ? (
        <VoicePracticeModal
          module={activeVoiceModule}
          onClose={() => setActiveVoiceModule(null)}
          onComplete={(xpGained) =>
            gainXp(xpGained, "Latihan suara lisan tuntas")
          }
        />
      ) : null}

      {activeNarrationModule ? (
        <AudioNarrationModal
          module={activeNarrationModule}
          onClose={() => {
            stopSpeech();
            setActiveNarrationModule(null);
          }}
        />
      ) : null}

      <AIProcessingModal isOpen={isGenerating} />
    </div>
  );
}
