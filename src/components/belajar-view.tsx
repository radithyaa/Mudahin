import type React from "react";
import { useEffect, useRef, useState } from "react";
import { useSpeechRecognition } from "../lib/speech-stt";
import { canSpeakText } from "../lib/speech-support";
import type { DailyMission, LearningModule } from "../types";
import { soundEffects, speakText } from "../utils/audio";

interface BelajarViewProps {
  currentFontSize: string;
  isGenerating: boolean;
  missions: DailyMission[];
  modules: LearningModule[];
  onGenerateModule: (
    text: string,
    sourceText: string,
    imageDataUrl?: string
  ) => void;
  onGoToLatihan: () => void;
  onOpenPractice: (module: LearningModule) => void;
  onOpenReader: (module: LearningModule) => void;
  onToggleFontSize: () => void;
  onToggleRuler: () => void;
  onToggleWarm: () => void;
  readModules: string[];
  rulerActive: boolean;
  warmActive: boolean;
}

/** Ikon daftar terlampir berdasarkan jenis berkas. */
function attachedFileIcon(file: string): string {
  if (file.toLowerCase().endsWith(".pdf")) {
    return "description";
  }
  return "image";
}

interface DailyMissionCardProps {
  completedMissionsCount: number;
  featuredModule?: LearningModule;
  missionProgressPct: number;
  missions: DailyMission[];
  onGoToLatihan: () => void;
  onOpenPractice: (module: LearningModule) => void;
  onOpenReader: (module: LearningModule) => void;
}

/** Kartu misi harian (Bacaan Fokus & Kuis Adaptif). */
const DailyMissionCard: React.FC<DailyMissionCardProps> = ({
  completedMissionsCount,
  featuredModule,
  missionProgressPct,
  missions,
  onGoToLatihan,
  onOpenPractice,
  onOpenReader,
}) => {
  const readingDone = Boolean(missions[0]?.completed);
  const quizDone = Boolean(missions[1]?.completed);

  return (
    <section className="space-y-3 rounded-3xl border-2 border-[#F59E0B] bg-gradient-to-r from-[#FEF3C7] to-[#FFFBEB] p-4 shadow-[0_4px_0_0_#D97706] sm:p-5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl bg-[#F59E0B] text-white shadow-[0_2px_0_0_#D97706]">
            <span className="material-symbols-outlined text-[24px]">
              military_tech
            </span>
          </div>
          <div>
            <span className="inline-block rounded-full border border-[#F59E0B]/30 bg-white/70 px-2 py-0.5 font-bold text-[#92400E] text-[11px] uppercase tracking-wider">
              Misi Seru Hari Ini
            </span>
            <h2 className="font-extrabold text-[#78350F] text-[17px] leading-tight sm:text-[18px]">
              1 Bacaan Fokus &amp; Kuis Adaptif
            </h2>
          </div>
        </div>

        <div className="flex flex-shrink-0 items-center gap-1 rounded-xl border-2 border-[#F59E0B] bg-white/90 px-2.5 py-1 font-bold text-[#B45309] text-[12px] shadow-[0_2px_0_0_#D97706]">
          <span className="material-symbols-outlined fill-icon text-[#D97706] text-[16px]">
            stars
          </span>
          <span>+50 XP Bonus</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[#92400E] text-[12px]">
          <span className="font-bold">Progres Misi Harian</span>
          <span className="font-extrabold">
            {completedMissionsCount} dari {missions.length} Selesai (
            {missionProgressPct}%)
          </span>
        </div>
        <div className="h-3 w-full overflow-hidden rounded-full border border-[#F59E0B]/40 bg-white/80 p-0.5">
          <div
            className="h-full rounded-full bg-[#F59E0B] shadow-[0_1px_0_0_#D97706] transition-all duration-300"
            style={{ width: `${missionProgressPct}%` }}
          />
        </div>
      </div>

      {/* Missions Sub-Items */}
      <div className="space-y-2 pt-1">
        {/* Mission 1: Bacaan */}
        <button
          className="flex w-full cursor-pointer items-center justify-between rounded-xl border border-[#34D399] bg-white/95 p-2.5 text-left shadow-sm hover:bg-white"
          onClick={() => featuredModule && onOpenReader(featuredModule)}
          type="button"
        >
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[#22C55E] text-white">
              <span className="material-symbols-outlined font-bold text-[16px]">
                check
              </span>
            </div>
            <div className="min-w-0">
              <p
                className={`truncate font-bold text-[14px] ${
                  readingDone
                    ? "text-[#14532D] line-through opacity-80"
                    : "text-[#131b2e]"
                }`}
              >
                Bacaan Fokus {featuredModule ? `(${featuredModule.title})` : ""}
              </p>
              <span
                className={`font-bold text-[11px] ${
                  readingDone ? "text-[#16A34A]" : "text-[#3525cd]"
                }`}
              >
                {readingDone
                  ? "Selesai • Berhasil dapat +20 XP"
                  : "Siap Dibaca • Hadiah +20 XP"}
              </span>
            </div>
          </div>
          <span className="flex-shrink-0 font-bold text-[#006c49] text-[12px]">
            {readingDone ? "Selesai" : "Siap"}
          </span>
        </button>

        {/* Mission 2: Kuis */}
        <button
          className={`flex w-full cursor-pointer items-center justify-between rounded-xl border-2 bg-white/95 p-2.5 text-left shadow-sm hover:bg-white ${
            quizDone ? "border-[#34D399]" : "border-[#4f46e5]"
          }`}
          onClick={() => featuredModule && onOpenPractice(featuredModule)}
          type="button"
        >
          <div className="flex min-w-0 items-center gap-2.5">
            <div
              className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full ${
                quizDone
                  ? "bg-[#22C55E] text-white"
                  : "border-2 border-[#4f46e5] bg-[#faf8ff] text-[#3525cd]"
              }`}
            >
              <span className="material-symbols-outlined text-[14px]">
                {quizDone ? "check" : "arrow_forward"}
              </span>
            </div>
            <div className="min-w-0">
              <p className="truncate font-bold text-[#131b2e] text-[14px]">
                Kuis Santai Adaptif (3 Soal)
              </p>
              <span className="font-bold text-[#3525cd] text-[11px]">
                {quizDone
                  ? "Selesai • +30 XP Didapat"
                  : "Siap Dikerjakan • Hadiah +30 XP"}
              </span>
            </div>
          </div>
          <span
            className={`flex-shrink-0 rounded-md px-2 py-0.5 font-extrabold text-[12px] ${
              quizDone
                ? "bg-[#E8F8F0] text-[#006c49]"
                : "bg-[#eaedff] text-[#4f46e5]"
            }`}
          >
            {quizDone ? "Selesai" : "Siap"}
          </span>
        </button>
      </div>

      {/* Mission CTA */}
      <button
        className="tactile-btn flex min-h-[48px] w-full items-center justify-center gap-2 rounded-2xl bg-[#F59E0B] px-4 py-2.5 font-bold text-[14px] text-white shadow-[0_3px_0_0_#B45309] hover:brightness-105 active:brightness-95"
        onClick={() => {
          soundEffects.playTap();
          if (!quizDone && featuredModule) {
            onOpenPractice(featuredModule);
          } else {
            onGoToLatihan();
          }
        }}
        type="button"
      >
        <span className="material-symbols-outlined fill-icon text-[20px]">
          bolt
        </span>
        <span>
          {quizDone
            ? "Misi Hari Ini Selesai! Buka Latihan"
            : "Lanjutkan Misi Hari Ini"}
        </span>
      </button>
    </section>
  );
};

interface AccessibilityShortcutsProps {
  currentFontSize: string;
  onToggleFontSize: () => void;
  onToggleRuler: () => void;
  onToggleWarm: () => void;
  rulerActive: boolean;
  speechSupported: boolean;
  warmActive: boolean;
}

/** Pintasan aksesibilitas cepat (ukuran teks, garis baca, suara, warna hangat). */
const AccessibilityShortcuts: React.FC<AccessibilityShortcutsProps> = ({
  currentFontSize,
  onToggleFontSize,
  onToggleRuler,
  rulerActive,
  onToggleWarm,
  warmActive,
  speechSupported,
}) => (
  <section className="space-y-2.5 rounded-2xl border-2 border-[#c7c4d8] bg-[#f2f3ff] p-3.5 shadow-sm">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-1.5 font-extrabold text-[#131b2e] text-[13px]">
        <span className="material-symbols-outlined text-[#3525cd] text-[20px]">
          tune
        </span>
        <span>Pintasan Aksesibilitas Cepat</span>
      </div>
      <span className="rounded-full bg-[#E8F8F0] px-2 py-0.5 font-bold text-[#006c49] text-[11px]">
        Ramah Disleksia &amp; ADHD
      </span>
    </div>

    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {/* Text Size */}
      <button
        aria-label="Perbesar Huruf"
        className="tactile-btn flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border-2 border-[#c7c4d8] bg-white px-2.5 py-2 font-bold text-[#131b2e] text-[13px] shadow-[0_2px_0_0_#CBD5E1] hover:border-[#4f46e5]"
        onClick={() => {
          soundEffects.playTap();
          onToggleFontSize();
        }}
        type="button"
      >
        <span className="material-symbols-outlined text-[#3525cd] text-[18px]">
          format_size
        </span>
        <span>Ukuran Teks ({currentFontSize.toUpperCase()})</span>
      </button>

      {/* Reading Ruler */}
      <button
        aria-label="Aktifkan Garis Pembimbing Baca"
        className={`tactile-btn flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border-2 px-2.5 py-2 font-bold text-[13px] shadow-[0_2px_0_0_#CBD5E1] ${
          rulerActive
            ? "border-[#F59E0B] bg-[#FEF3C7] text-[#92400E]"
            : "border-[#c7c4d8] bg-white text-[#131b2e] hover:border-[#4f46e5]"
        }`}
        onClick={() => {
          soundEffects.playTap();
          onToggleRuler();
        }}
        type="button"
      >
        <span className="material-symbols-outlined text-[#006c49] text-[18px]">
          straighten
        </span>
        <span>Garis Baca {rulerActive ? "Aktif" : ""}</span>
      </button>

      {/* Friendly Voice */}
      <button
        aria-label="Nyalakan Suara Narasi"
        className="tactile-btn flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border-2 border-[#c7c4d8] bg-white px-2.5 py-2 font-bold text-[#131b2e] text-[13px] shadow-[0_2px_0_0_#CBD5E1] hover:border-[#4f46e5] disabled:opacity-40"
        disabled={!speechSupported}
        onClick={() => {
          soundEffects.playTap();
          speakText(
            "Halo! Semangat pagi! Hari ini ada bacaan fokus dan kuis santai yang sudah disiapkan Teman AI untukmu. Selamat belajar tanpa stres!"
          );
        }}
        title={
          speechSupported
            ? "Nyalakan suara narasi"
            : "Pembacaan suara belum tersedia di perangkat ini"
        }
        type="button"
      >
        <span className="material-symbols-outlined text-[#D97706] text-[18px]">
          volume_up
        </span>
        <span>Suara Ramah</span>
      </button>

      {/* Warm Color */}
      <button
        aria-label="Filter Warna Hangat Mata Nyaman"
        className={`tactile-btn flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border-2 px-2.5 py-2 font-bold text-[13px] shadow-[0_2px_0_0_#D97706] ${
          warmActive
            ? "border-[#F59E0B] bg-[#FEF3C7] text-[#92400E]"
            : "border-[#F59E0B] bg-[#FEF3C7]/60 text-[#92400E]"
        }`}
        onClick={() => {
          soundEffects.playTap();
          onToggleWarm();
        }}
        type="button"
      >
        <span className="material-symbols-outlined text-[#D97706] text-[18px]">
          wb_incandescent
        </span>
        <span>Warna Hangat</span>
      </button>
    </div>
  </section>
);

interface ModuleCardProps {
  isRead: boolean;
  module: LearningModule;
  onOpenPractice: (module: LearningModule) => void;
}

/**
 * Kartu satu materi pada pustaka.
 *
 * Seluruh kartu dapat diketuk untuk membuka dialog pilih jenis latihan;
 * tombol di dalamnya menjadi pintasan cepat untuk langsung membaca atau
 * membuka pilihan latihan.
 */
const ModuleCard: React.FC<ModuleCardProps> = ({
  module: mod,
  onOpenPractice,
  isRead,
}) => (
  <article className="rounded-2xl border-2 border-[#CBD5E1] bg-white p-4 shadow-[0_4px_0_0_#CBD5E1] transition-colors hover:border-[#4f46e5] sm:p-5">
    <div className="mb-2 flex items-start justify-between gap-3">
      <div>
        <span className="mb-1.5 inline-flex items-center gap-1 rounded-md bg-[#E8F8F0] px-2.5 py-0.5 font-bold text-[#006C49] text-[12px]">
          <span className="material-symbols-outlined text-[14px]">
            {isRead ? "task_alt" : "menu_book"}
          </span>
          {mod.sourceBadge}
        </span>
        <h3 className="font-extrabold text-[#131b2e] text-[17px] sm:text-[18px]">
          {mod.title}
        </h3>
      </div>
      <div
        className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl"
        style={{ backgroundColor: mod.iconBg, color: mod.iconColor }}
      >
        <span className="material-symbols-outlined text-[24px]">
          {mod.iconName}
        </span>
      </div>
    </div>

    <p className="mb-3 line-clamp-2 text-[#464555] text-[14px] leading-relaxed">
      {mod.description}
    </p>

    {/* Accessibility & Format Badges */}
    <div className="mb-4 flex flex-wrap gap-1.5">
      <span className="inline-flex items-center gap-1 rounded-lg border border-[#c7c4d8] bg-[#f2f3ff] px-2.5 py-1 font-bold text-[#131b2e] text-[12px]">
        <span className="material-symbols-outlined text-[#3525cd] text-[14px]">
          schedule
        </span>
        {mod.readTime}
      </span>

      {isRead ? (
        <span className="inline-flex items-center gap-1 rounded-lg border border-[#10B981] bg-[#ECFDF5] px-2.5 py-1 font-bold text-[#065F46] text-[12px]">
          <span className="material-symbols-outlined text-[14px]">
            check_circle
          </span>
          Sudah Dibaca
        </span>
      ) : null}

      {mod.masteryPercentage > 0 ? (
        <span className="inline-flex items-center gap-1 rounded-lg border border-[#c3c0ff] bg-[#EEF2FF] px-2.5 py-1 font-bold text-[#3525cd] text-[12px]">
          <span className="material-symbols-outlined text-[14px]">
            workspace_premium
          </span>
          Skor Terbaik {mod.masteryPercentage}%
        </span>
      ) : null}

      {mod.hasAudio ? (
        <span className="inline-flex items-center gap-1 rounded-lg border border-[#F59E0B] bg-[#FEF3C7] px-2.5 py-1 font-bold text-[#92400E] text-[12px]">
          <span className="material-symbols-outlined text-[14px]">
            volume_up
          </span>
          Ada Audio
        </span>
      ) : null}
    </div>

    {/* Card Tactile Action Buttons */}
    <div className="grid grid-cols-2 gap-2.5 pt-1">
      <button
        className="tactile-btn flex min-h-[48px] items-center justify-center gap-1.5 rounded-xl border-2 border-[#CBD5E1] bg-white px-3 py-2.5 font-bold text-[#131b2e] text-[14px] shadow-[0_3px_0_0_#CBD5E1] hover:bg-[#f2f3ff]"
        onClick={() => onOpenPractice(mod)}
        type="button"
      >
        <span className="material-symbols-outlined text-[#3525cd] text-[20px]">
          menu_book
        </span>
        <span>Baca di Reader</span>
      </button>

      <button
        className="tactile-btn flex min-h-[48px] items-center justify-center gap-1.5 rounded-xl bg-[#006c49] px-3 py-2.5 font-bold text-[14px] text-white shadow-[0_3px_0_0_#005236] hover:brightness-110 active:brightness-95"
        onClick={() => onOpenPractice(mod)}
        type="button"
      >
        <span className="material-symbols-outlined text-[20px]">
          sports_esports
        </span>
        <span>Pilih Latihan</span>
      </button>
    </div>
  </article>
);

export const BelajarView: React.FC<BelajarViewProps> = ({
  modules,
  missions,
  onOpenReader,
  onOpenPractice,
  onGenerateModule,
  isGenerating,
  onToggleFontSize,
  currentFontSize,
  onToggleRuler,
  rulerActive,
  onToggleWarm,
  warmActive,
  onGoToLatihan,
  readModules,
}) => {
  const [inputText, setInputText] = useState("");
  const [attachedFiles, setAttachedFiles] = useState<string[]>([]);
  const [imageDataUrl, setImageDataUrl] = useState<string | undefined>(
    undefined
  );
  /** Teks yang diekstrak dari berkas PDF terpilih (dipakai sebagai materi). */
  const [pdfText, setPdfText] = useState<string>("");
  const [isReadingPdf, setIsReadingPdf] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState("Semua Materi");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const voice = useSpeechRecognition();

  // Transkrip diketik langsung ke kotak topik saat mikrofon mendengar ucapan.
  useEffect(() => {
    const spoken = voice.transcript.trim();
    if (spoken.length > 0) {
      setInputText((prev) => (prev ? `${prev} ${spoken}` : spoken));
    }
  }, [voice.transcript]);

  const completedMissionsCount = missions.filter((m) => m.completed).length;
  const missionProgressPct = missions.length
    ? Math.round((completedMissionsCount / missions.length) * 100)
    : 0;

  // "Lanjut Belajar" = materi terbaru; tanpa penanda featured palsu.
  const [featuredModule] = modules;

  const handleRemoveFile = () => {
    soundEffects.playTap();
    setAttachedFiles([]);
    setImageDataUrl(undefined);
    setPdfText("");
  };

  const handleAddPhoto = () => {
    soundEffects.playTap();
    if (fileInputRef.current) {
      fileInputRef.current.setAttribute("accept", "image/*");
      fileInputRef.current.click();
    }
  };

  const handleAddPdf = () => {
    soundEffects.playTap();
    if (fileInputRef.current) {
      fileInputRef.current.setAttribute("accept", "application/pdf");
      fileInputRef.current.click();
    }
  };

  /**
   * Membaca berkas nyata yang dipilih pengguna.
   *
   * - Gambar → data URL untuk OCR Gemini (`ai.ocrToFlashcards`).
   * - PDF → teks diekstrak di klien (pdf.js) agar isinya bisa diolah AI.
   */
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }

    setAttachedFiles([file.name]);

    if (file.type === "application/pdf") {
      setIsReadingPdf(true);
      try {
        const { extractPdfText } = await import("../lib/pdf");
        const extracted = await extractPdfText(file);
        if (!extracted.trim()) {
          throw new Error(
            "Tidak ada teks yang bisa dibaca dari PDF ini (mungkin hasil pindai)."
          );
        }
        setPdfText(extracted);
        setImageDataUrl(undefined);
      } catch (error) {
        handleRemoveFile();
        showPdfError(
          error instanceof Error ? error.message : "Gagal membaca berkas PDF."
        );
      } finally {
        setIsReadingPdf(false);
      }
    } else {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") {
          setImageDataUrl(reader.result);
          setPdfText("");
        }
      };
      reader.readAsDataURL(file);
    }

    // Izinkan memilih berkas yang sama lagi setelah dihapus.
    e.target.value = "";
  };

  /** Menampilkan kesalahan pembacaan berkas lewat suara + state lokal. */
  const showPdfError = (message: string) => {
    setPdfError(message);
    speakText(message);
  };

  const handleVoiceInput = () => {
    soundEffects.playTap();
    if (voice.isListening) {
      voice.stop();
      return;
    }
    voice.start();
  };

  const handleOlahMateri = () => {
    soundEffects.playTap();
    onGenerateModule(inputText, pdfText, imageDataUrl);
    setInputText("");
    setAttachedFiles([]);
    setImageDataUrl(undefined);
    setPdfText("");
    setPdfError(null);
  };

  // Filter berdasarkan subjek materi nyata (bukan label keras).
  const filterOptions = [
    "Semua Materi",
    ...Array.from(new Set(modules.map((m) => m.subjectBadge.split(" • ")[0]))),
  ];
  const filteredModules = modules.filter((m) => {
    if (selectedFilter === "Semua Materi") {
      return true;
    }
    return m.subjectBadge.startsWith(selectedFilter);
  });

  const readModuleIds = new Set(readModules);

  return (
    <main className="mx-auto w-full max-w-xl space-y-5 px-4 pt-5 pb-8">
      {/* Hidden file input for real attachments */}
      <input
        accept="image/*,.pdf"
        className="hidden"
        onChange={handleFileChange}
        ref={fileInputRef}
        type="file"
      />

      {/* Hero / Welcome Greeting */}
      <section className="space-y-1">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-[#eaedff] px-3 py-1 font-bold text-[#3525cd] text-[12px]">
          <span className="material-symbols-outlined text-[16px]">
            waving_hand
          </span>
          <span>Semangat Pagi</span>
        </div>
        <h1 className="font-extrabold text-[#131b2e] text-[24px] tracking-tight sm:text-[26px]">
          Halo! Mau belajar apa hari ini?
        </h1>
        <p className="font-medium text-[#464555] text-[14px]">
          Tulis topik bebas, atau unggah foto catatan belajarmu biar Teman AI
          rapikan.
        </p>
      </section>

      {/* Daily Mission Card (Misi Seru Hari Ini) */}
      <DailyMissionCard
        completedMissionsCount={completedMissionsCount}
        featuredModule={featuredModule}
        missionProgressPct={missionProgressPct}
        missions={missions}
        onGoToLatihan={onGoToLatihan}
        onOpenPractice={onOpenPractice}
        onOpenReader={onOpenReader}
      />

      {/* Prominent AI Learning Studio Input Box (Tactile Level 1 Plinth) */}
      <section className="space-y-4 rounded-3xl border-2 border-[#CBD5E1] bg-white p-4 shadow-[0_4px_0_0_#CBD5E1] sm:p-5">
        {/* Textarea Input Area */}
        <div className="relative">
          <textarea
            className="w-full resize-none rounded-2xl border-2 border-[#c7c4d8] bg-[#f2f3ff] p-3.5 font-medium text-[#131b2e] text-[15px] outline-none transition-all duration-150 placeholder:text-[#777587] focus:border-[#4f46e5] focus:bg-white focus:ring-4 focus:ring-[#eaedff]"
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Tulis topik atau tanya apa saja, misal: Fotosintesis pada tumbuhan..."
            rows={3}
            value={inputText}
          />
        </div>

        {/* Attached Files Micro-List */}
        {attachedFiles.length > 0 && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between px-1 font-semibold text-[#464555] text-[12px]">
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-[#3525cd] text-[16px]">
                  attach_file
                </span>
                Catatan Terlampir ({attachedFiles.length} File)
              </span>
              <span className="font-bold text-[#006c49]">
                {isReadingPdf ? "Membaca berkas…" : "Siap diolah"}
              </span>
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {attachedFiles.map((file) => (
                <div
                  className="flex items-center justify-between rounded-xl border border-[#c7c4d8] bg-[#eaedff] p-2.5"
                  key={file}
                >
                  <div className="flex items-center gap-2 overflow-hidden">
                    <span className="material-symbols-outlined flex-shrink-0 text-[#3525cd] text-[20px]">
                      {attachedFileIcon(file)}
                    </span>
                    <span className="truncate font-bold text-[#131b2e] text-[13px]">
                      {file}
                    </span>
                  </div>
                  <button
                    aria-label={`Hapus ${file}`}
                    className="rounded-lg p-1 text-[#777587] transition-colors hover:bg-[#dae2fd] hover:text-[#ba1a1a]"
                    onClick={() => handleRemoveFile()}
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      close
                    </span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/*
         * Baris lampiran & suara. Grid 3 kolom tetap (bukan `flex-wrap`) supaya
         * di layar ponsel sempit pun tombol "+ Foto Catatan", "+ File PDF", dan
         * tombol mic selalu **sejajar dalam satu baris** dengan tinggi sama.
         */}
        <div className="grid grid-cols-3 items-stretch gap-2 border-slate-100 border-t pt-1">
          {/* Photo Button */}
          <button
            aria-label="Lampirkan foto catatan"
            className="tactile-btn flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border-2 border-[#c7c4d8] bg-[#eaedff] px-2 py-2 font-bold text-[#131b2e] text-[13px] shadow-[0_3px_0_0_#CBD5E1] hover:bg-[#dae2fd]"
            onClick={handleAddPhoto}
            type="button"
          >
            <span className="material-symbols-outlined shrink-0 text-[#3525cd] text-[18px]">
              photo_camera
            </span>
            <span className="truncate">+ Foto Catatan</span>
          </button>

          {/* Document / PDF Button */}
          <button
            aria-label="Lampirkan berkas PDF"
            className="tactile-btn flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border-2 border-[#c7c4d8] bg-[#eaedff] px-2 py-2 font-bold text-[#131b2e] text-[13px] shadow-[0_3px_0_0_#CBD5E1] hover:bg-[#dae2fd]"
            onClick={handleAddPdf}
            type="button"
          >
            <span className="material-symbols-outlined shrink-0 text-[#006c49] text-[18px]">
              description
            </span>
            <span className="truncate">+ File PDF</span>
          </button>

          {/* Mic / Voice Button — satu baris dengan dua tombol lampiran. */}
          <button
            aria-label={
              voice.isListening ? "Hentikan rekaman suara" : "Bicara topik"
            }
            className={`tactile-btn flex min-h-[44px] items-center justify-center gap-1 rounded-xl border-2 px-2 py-2 font-bold text-[13px] shadow-[0_3px_0_0_#DC2626] disabled:opacity-40 ${
              voice.isListening
                ? "animate-pulse border-[#DC2626] bg-[#FCA5A5] text-[#7F1D1D]"
                : "border-[#EF4444] bg-[#FEE2E2] text-[#991B1B] hover:bg-[#FECACA]"
            }`}
            disabled={!voice.isSupported}
            onClick={handleVoiceInput}
            title={
              voice.isSupported
                ? "Bicara topik"
                : "Perekaman suara belum didukung di perangkat ini"
            }
            type="button"
          >
            <span className="material-symbols-outlined shrink-0 fill-icon text-[#DC2626] text-[18px]">
              mic
            </span>
            <span className="truncate">
              {voice.isListening ? "Mendengarkan…" : "Bicara"}
            </span>
          </button>
        </div>

        {/* Kesalahan mikrofon (mis. izin ditolak) ditampilkan jujur di sini. */}
        {voice.error ? (
          <p
            className="rounded-xl border-2 border-[#DC2626] bg-[#FEF2F2] p-2.5 font-semibold text-[#991B1B] text-[12px]"
            role="alert"
          >
            {voice.error}
          </p>
        ) : null}

        {/* Kesalahan pembacaan berkas (mis. PDF tanpa teks) — jujur, bukan diam. */}
        {pdfError ? (
          <p
            className="rounded-xl border-2 border-[#F59E0B] bg-[#FEF3C7] p-2.5 font-semibold text-[#92400E] text-[12px]"
            role="alert"
          >
            {pdfError}
          </p>
        ) : null}

        {/* Primary Action CTA Button */}
        <button
          className="tactile-btn flex min-h-[52px] w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-[#4f46e5] px-4 py-3.5 font-bold text-[16px] text-white shadow-[0_4px_0_0_#3525cd] transition-all hover:brightness-105 active:brightness-95 disabled:opacity-50"
          disabled={isGenerating || isReadingPdf}
          onClick={handleOlahMateri}
          type="button"
        >
          <span className="material-symbols-outlined fill-icon text-[22px]">
            {isGenerating ? "hourglass_top" : "auto_awesome"}
          </span>
          <span>
            {isGenerating
              ? "Teman AI Sedang Mengolah..."
              : "Olah Materi dengan Teman AI"}
          </span>
        </button>

        {/* Friendly Human Helper Note */}
        <div className="flex items-start gap-2 rounded-xl bg-[#f2f3ff] p-2.5 font-medium text-[#464555] text-[13px]">
          <span className="material-symbols-outlined mt-0.5 flex-shrink-0 text-[#3525cd] text-[20px]">
            sentiment_satisfied
          </span>
          <p className="leading-snug">
            Kirim foto catatan atau berkas PDF milikmu, Teman AI akan
            menyusunkan ringkasan santai dan latihan seru!
          </p>
        </div>
      </section>

      {/* Quick Accessibility Shortcuts (Pintasan Aksesibilitas Cepat) */}
      <AccessibilityShortcuts
        currentFontSize={currentFontSize}
        onToggleFontSize={onToggleFontSize}
        onToggleRuler={onToggleRuler}
        onToggleWarm={onToggleWarm}
        rulerActive={rulerActive}
        speechSupported={canSpeakText()}
        warmActive={warmActive}
      />

      {/* Section: Lanjut Belajar Terakhir */}
      {featuredModule ? (
        <section className="space-y-3.5 rounded-3xl border-2 border-[#4f46e5] bg-white p-4 shadow-[0_4px_0_0_#3525cd] sm:p-5">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1 rounded-full bg-[#4f46e5] px-2.5 py-1 font-bold text-[12px] text-white">
              <span className="material-symbols-outlined text-[14px]">
                history
              </span>
              Lanjut Belajar Terakhir
            </span>

            <span className="inline-flex items-center gap-1 rounded-md bg-[#eaedff] px-2.5 py-0.5 font-bold text-[#464555] text-[12px]">
              <span className="material-symbols-outlined text-[#3525cd] text-[14px]">
                timer
              </span>
              {featuredModule.readTime}
            </span>
          </div>

          <div>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-extrabold text-[#131b2e] text-[18px] leading-tight">
                  {featuredModule.title}
                </h3>
                <p className="mt-0.5 font-semibold text-[#3525cd] text-[14px]">
                  {featuredModule.description}
                </p>
              </div>
              <div
                className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl shadow-[0_2px_0_0_#005236]"
                style={{
                  backgroundColor: featuredModule.iconBg,
                  color: featuredModule.iconColor,
                }}
              >
                <span className="material-symbols-outlined text-[24px]">
                  {featuredModule.iconName}
                </span>
              </div>
            </div>
          </div>

          {featuredModule.masteryPercentage > 0 ? (
            <div className="space-y-1.5 rounded-2xl border border-[#c7c4d8] bg-[#f2f3ff] p-3">
              <div className="flex items-center justify-between text-[12px]">
                <span className="font-medium text-[#464555]">
                  Skor Kuis Terbaik
                </span>
                <span className="font-extrabold text-[#3525cd]">
                  {featuredModule.masteryPercentage}%
                </span>
              </div>
              <div className="h-3 w-full overflow-hidden rounded-full border border-[#c7c4d8] bg-[#eaedff] p-0.5">
                <div
                  className="h-full rounded-full bg-[#4f46e5] shadow-[0_1px_0_0_#3525cd]"
                  style={{ width: `${featuredModule.masteryPercentage}%` }}
                />
              </div>
            </div>
          ) : null}

          <div className="pt-0.5">
            <button
              className="tactile-btn flex min-h-[48px] w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#4f46e5] px-4 py-3 font-bold text-[14px] text-white shadow-[0_3px_0_0_#3525cd] hover:brightness-105 active:brightness-95"
              onClick={() => onOpenReader(featuredModule)}
              type="button"
            >
              <span className="material-symbols-outlined fill-icon text-[20px]">
                play_arrow
              </span>
              <span>Lanjut Baca Sekarang</span>
            </button>
          </div>
        </section>
      ) : null}

      {/* Section: Materi Pustaka (milik pengguna, dari database) */}
      <section className="space-y-3 pt-2">
        {/* Header & Filter Row */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-1.5 font-extrabold text-[#131b2e] text-[20px]">
              <span className="material-symbols-outlined text-[#3525cd] text-[24px]">
                menu_book
              </span>
              Materi Pustaka
            </h2>
            <span className="font-bold text-[#464555] text-[12px]">
              {modules.length} Materi
            </span>
          </div>

          {/* Filter Chips — hanya muncul bila ada lebih dari satu subjek nyata. */}
          {filterOptions.length > 2 ? (
            <div className="no-scrollbar flex items-center gap-2 overflow-x-auto pb-1">
              {filterOptions.map((f) => {
                const isSelected = selectedFilter === f;
                return (
                  <button
                    className={`flex-shrink-0 rounded-full px-3.5 py-1.5 font-bold text-[12px] transition-colors ${
                      isSelected
                        ? "border-2 border-[#3525cd] bg-[#4f46e5] text-white shadow-[0_2px_0_0_#3525cd]"
                        : "border-2 border-[#c7c4d8] bg-white text-[#131b2e] hover:bg-[#eaedff]"
                    }`}
                    key={f}
                    onClick={() => {
                      soundEffects.playTap();
                      setSelectedFilter(f);
                    }}
                    type="button"
                  >
                    {f}
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>

        {/* Daftar materi: kosong → ajakan membuat materi pertama. */}
        {modules.length === 0 ? (
          <div className="space-y-2 rounded-2xl border-2 border-[#c7c4d8] border-dashed bg-white p-5 text-center">
            <span className="material-symbols-outlined text-[#3525cd] text-[36px]">
              library_add
            </span>
            <p className="font-extrabold text-[#131b2e] text-[15px]">
              Pustakamu masih kosong
            </p>
            <p className="font-medium text-[#464555] text-[13px] leading-relaxed">
              Tulis topik atau unggah foto/PDF catatan di kotak Teman AI di
              atas. Materi yang dihasilkan akan tersimpan di pustaka ini.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredModules.map((mod) => (
              <ModuleCard
                isRead={readModuleIds.has(mod.id)}
                key={mod.id}
                module={mod}
                onOpenPractice={onOpenPractice}
              />
            ))}
          </div>
        )}
      </section>

      {/* Inclusive Friendly Tip / Wellness Anchor */}
      <section className="flex items-center gap-3 rounded-2xl border border-[#c7c4d8] bg-[#eaedff] p-4">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-white text-[#3525cd] shadow-[0_2px_0_0_#CBD5E1]">
          <span className="material-symbols-outlined text-[22px]">hearing</span>
        </div>
        <div className="flex-1 text-[#464555] text-[13px] leading-snug">
          <span className="font-bold text-[#131b2e]">Tips Belajar Nyaman:</span>{" "}
          Sedang lelah membaca? Ketuk materi lalu pilih mode{" "}
          <strong className="font-bold text-[#3525cd]">
            Dengarkan Bacaan Nyaring
          </strong>{" "}
          untuk mendengarkan narasi suara santai.
        </div>
      </section>
    </main>
  );
};
