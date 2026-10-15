import type { FocusProfileId } from "@mudahin/api/schemas";
import confetti from "canvas-confetti";
import { useEffect, useState } from "react";

import { applySimplifiedPoints, moduleToText } from "../lib/api/ai";
import { useAi } from "../lib/hooks/use-ai";
import { canSpeakText, TTS_UNAVAILABLE_MESSAGE } from "../lib/speech-support";
import type { LearningModule, Paragraph } from "../types";
import { soundEffects, speakText, stopSpeech } from "../utils/audio";

interface FocusReaderModalProps {
  focusProfile?: FocusProfileId;
  fontSize: "sm" | "md" | "lg" | "xl";
  isWarmTheme: boolean;
  module: LearningModule;
  onClose: () => void;
  onCompleteReading: (moduleId: string) => void;
  onToggleRuler: () => void;
  onToggleWarm: () => void;
  readingRulerActive: boolean;
}

/** Ukuran huruf berikutnya saat tombol A+ ditekan. */
function nextFontSize(
  current: "sm" | "md" | "lg" | "xl"
): "sm" | "md" | "lg" | "xl" {
  if (current === "sm") {
    return "md";
  }
  if (current === "md") {
    return "lg";
  }
  if (current === "lg") {
    return "xl";
  }
  return "md";
}

/** Ikon tombol penyederhanaan AI sesuai statusnya. */
function simplifyIcon(isSimplifying: boolean, simplifiedMode: boolean): string {
  if (isSimplifying) {
    return "hourglass_top";
  }
  if (simplifiedMode) {
    return "check_circle";
  }
  return "auto_fix_high";
}

/** Label tombol penyederhanaan AI sesuai statusnya. */
function simplifyLabel(
  isSimplifying: boolean,
  simplifiedMode: boolean
): string {
  if (isSimplifying) {
    return "Menyederhanakan…";
  }
  if (simplifiedMode) {
    return "Mode Santai Aktif";
  }
  return "Teman AI: Buat Lebih Santai";
}

/**
 * Focus Reader — tipografi adaptif + ringkasan AI DeepSeek.
 *
 * "Buat Lebih Santai" memanggil `ai.simplify` (poin-poin ringkas) dan menyebar
 * hasilnya ke tiap paragraf; "Jelaskan" memanggil `ai.explain` untuk satu
 * paragraf yang sedang aktif.
 */
export const FocusReaderModal: React.FC<FocusReaderModalProps> = ({
  module,
  onClose,
  onCompleteReading,
  fontSize: initialFontSize,
  readingRulerActive,
  onToggleRuler,
  isWarmTheme,
  onToggleWarm,
  focusProfile,
}) => {
  const ai = useAi();
  const [paragraphs, setParagraphs] = useState<Paragraph[]>(module.paragraphs);
  const [activeParagraphIndex, setActiveParagraphIndex] = useState(0);
  const [simplifiedMode, setSimplifiedMode] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [currentSize, setCurrentSize] = useState<"sm" | "md" | "lg" | "xl">(
    initialFontSize
  );
  const [completed, setCompleted] = useState(false);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [simplifyError, setSimplifyError] = useState<string | null>(null);

  useEffect(() => () => stopSpeech(), []);

  useEffect(() => {
    setParagraphs(module.paragraphs);
    setSimplifiedMode(false);
    setExplanation(null);
    setActiveParagraphIndex(0);
  }, [module]);

  const handlePlayCurrent = (index: number) => {
    setActiveParagraphIndex(index);
    const paragraph = paragraphs[index];
    const textToRead = simplifiedMode
      ? (paragraph.simplified ?? paragraph.content)
      : paragraph.content;

    soundEffects.playTap();
    setIsPlayingAudio(true);
    speakText(`${paragraph.heading ?? ""}. ${textToRead}`, 0.95, () => {
      setIsPlayingAudio(false);
    });
  };

  const handleTogglePlayAll = () => {
    if (isPlayingAudio) {
      stopSpeech();
      setIsPlayingAudio(false);
    } else {
      handlePlayCurrent(activeParagraphIndex);
    }
  };

  /** Menyederhanakan seluruh materi lewat DeepSeek lalu menyebar ke paragraf. */
  const handleSimplify = async () => {
    soundEffects.playTap();
    setSimplifyError(null);

    if (simplifiedMode) {
      setSimplifiedMode(false);
      return;
    }

    if (paragraphs.every((paragraph) => paragraph.simplified)) {
      setSimplifiedMode(true);
      return;
    }

    try {
      const result = await ai.simplify.mutateAsync({
        text: moduleToText(module),
        profile: focusProfile,
      });
      setParagraphs((prev) => applySimplifiedPoints(prev, result.points));
      setSimplifiedMode(true);
    } catch (error) {
      // Fallback: tetap tampilkan teks asli, beri tahu pengguna lewat banner.
      setSimplifyError(
        error instanceof Error
          ? error.message
          : "Gagal menyederhanakan teks. Coba lagi."
      );
    }
  };

  /** Meminta penjelasan AI untuk paragraf yang sedang aktif. */
  const handleExplain = async (index: number) => {
    const paragraph = paragraphs[index];
    soundEffects.playTap();
    setActiveParagraphIndex(index);
    setExplanation(null);
    try {
      const result = await ai.explain.mutateAsync({
        text: paragraph.content,
        context: module.title,
        profile: focusProfile,
      });
      setExplanation(result.explanation);
    } catch (error) {
      setExplanation(
        error instanceof Error
          ? error.message
          : "Gagal menjelaskan bagian ini. Coba lagi."
      );
    }
  };

  const handleFinish = () => {
    soundEffects.playSuccess();
    setCompleted(true);
    confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
    onCompleteReading(module.id);
  };

  const getTextClass = () => {
    switch (currentSize) {
      case "sm":
        return "text-[14px] leading-relaxed";
      case "lg":
        return "text-[18px] leading-loose";
      case "xl":
        return "text-[21px] leading-loose";
      default:
        return "text-[16px] leading-[28px]";
    }
  };

  const isSimplifying = ai.simplify.isPending;
  const isExplaining = ai.explain.isPending;
  const speechSupported = canSpeakText();

  /** Label tombol pemutaran suara sesuai dukungan & status putar. */
  const playButtonLabel = (() => {
    if (!speechSupported) {
      return "Suara N/A";
    }
    return isPlayingAudio ? "Jeda Suara" : "Dengarkan";
  })();

  return (
    <div className="dialog-layer dialog-layer--sm-center">
      <div className="dialog-panel fade-in slide-in-from-bottom-6 max-w-xl animate-in rounded-t-3xl border-2 border-[#4f46e5] bg-[#faf8ff] shadow-2xl duration-200 sm:rounded-3xl">
        <div className="flex shrink-0 items-center justify-between border-[#c7c4d8] border-b-2 bg-white p-3.5 sm:p-4">
          <div className="flex min-w-0 items-center gap-2">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#4f46e5] text-white shadow-[0_2px_0_0_#3525cd]">
              <span className="material-symbols-outlined text-[20px]">
                chrome_reader_mode
              </span>
            </div>
            <div className="min-w-0">
              <span className="inline-block rounded-full bg-[#E8F8F0] px-2 py-0.5 font-bold text-[#006c49] text-[11px]">
                Focus Reader
              </span>
              <h3 className="truncate font-extrabold text-[#131b2e] text-[15px]">
                {module.title}
              </h3>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            <button
              className="tactile-btn flex items-center gap-0.5 rounded-xl border border-[#c7c4d8] bg-[#eaedff] p-2 font-extrabold text-[#3525cd] text-[13px]"
              onClick={() => {
                soundEffects.playTap();
                setCurrentSize((prev) => nextFontSize(prev));
              }}
              title="Ubah Ukuran Huruf"
              type="button"
            >
              <span className="material-symbols-outlined text-[16px]">
                format_size
              </span>
              <span>A+</span>
            </button>

            <button
              aria-pressed={readingRulerActive}
              className={`tactile-btn flex items-center rounded-xl border p-2 ${
                readingRulerActive
                  ? "border-[#F59E0B] bg-[#FEF3C7] text-[#92400E]"
                  : "border-[#c7c4d8] bg-[#eaedff] text-[#131b2e]"
              }`}
              onClick={() => {
                soundEffects.playTap();
                onToggleRuler();
              }}
              title="Garis Pembimbing Baca"
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">
                straighten
              </span>
            </button>

            <button
              aria-pressed={isWarmTheme}
              className={`tactile-btn flex items-center rounded-xl border p-2 ${
                isWarmTheme
                  ? "border-[#F59E0B] bg-[#FEF3C7] text-[#92400E]"
                  : "border-[#c7c4d8] bg-[#eaedff] text-[#131b2e]"
              }`}
              onClick={() => {
                soundEffects.playTap();
                onToggleWarm();
              }}
              title="Warna Hangat Mata Nyaman"
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">
                wb_incandescent
              </span>
            </button>

            <button
              aria-label="Tutup Reader"
              className="rounded-xl bg-slate-100 p-2 font-bold text-slate-700 hover:bg-slate-200"
              onClick={() => {
                stopSpeech();
                soundEffects.playTap();
                onClose();
              }}
              type="button"
            >
              <span className="material-symbols-outlined text-[20px]">
                close
              </span>
            </button>
          </div>
        </div>

        {/* Sub-bar: penyederhanaan AI + pemutaran suara */}
        <div className="flex items-center justify-between gap-2 border-[#c7c4d8] border-b bg-[#eaedff] px-4 py-2 text-[13px]">
          <button
            className={`tactile-chip flex items-center gap-1.5 rounded-full px-3 py-1 font-bold transition-colors disabled:opacity-60 ${
              simplifiedMode
                ? "bg-[#006c49] text-white shadow-[0_2px_0_0_#002113]"
                : "border border-[#c7c4d8] bg-white text-[#131b2e]"
            }`}
            disabled={isSimplifying}
            onClick={handleSimplify}
            type="button"
          >
            <span className="material-symbols-outlined text-[16px]">
              {simplifyIcon(isSimplifying, simplifiedMode)}
            </span>
            <span>{simplifyLabel(isSimplifying, simplifiedMode)}</span>
          </button>

          <button
            className="tactile-chip flex items-center gap-1 rounded-full bg-[#4f46e5] px-3 py-1 font-bold text-white shadow-[0_2px_0_0_#3525cd] disabled:opacity-60"
            disabled={!speechSupported}
            onClick={handleTogglePlayAll}
            title={
              speechSupported ? "Dengarkan bacaan" : TTS_UNAVAILABLE_MESSAGE
            }
            type="button"
          >
            <span className="material-symbols-outlined fill-icon text-[16px]">
              {isPlayingAudio ? "pause" : "volume_up"}
            </span>
            <span>{playButtonLabel}</span>
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-6">
          {simplifyError ? (
            <div className="rounded-2xl border-2 border-[#F59E0B] bg-[#FEF3C7] p-3 font-semibold text-[#92400E] text-[13px]">
              {simplifyError}
            </div>
          ) : null}

          {simplifiedMode ? (
            <div className="flex items-center gap-2.5 rounded-2xl border-2 border-[#006c49] bg-[#E8F8F0] p-3 font-bold text-[#006c49] text-[13px]">
              <span className="material-symbols-outlined text-[20px]">
                lightbulb
              </span>
              <span>
                Paragraf dirangkum jadi poin pendek yang santai dan ramah fokus!
              </span>
            </div>
          ) : null}

          {paragraphs.map((paragraph, index) => {
            const isActive = activeParagraphIndex === index;
            return (
              /* biome-ignore lint/a11y/useSemanticElements: kartu paragraf memuat tombol aksi di dalamnya sehingga tidak boleh menjadi <button> bersarang. */
              <div
                className={`rounded-2xl border-2 p-4 transition-all ${
                  isActive
                    ? "border-[#4f46e5] bg-white shadow-[0_4px_0_0_#4f46e5]"
                    : "border-[#c7c4d8] bg-white/70 hover:border-[#4f46e5]/60 hover:bg-white"
                }`}
                key={paragraph.id}
                onClick={() => setActiveParagraphIndex(index)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    setActiveParagraphIndex(index);
                  }
                }}
                role="button"
                tabIndex={0}
              >
                <div className="mb-2 flex items-center justify-between">
                  <h4 className="font-extrabold text-[#131b2e] text-[15px]">
                    {paragraph.heading ?? `Bagian ${index + 1}`}
                  </h4>
                  <div className="flex items-center gap-1.5">
                    <button
                      className="rounded-lg bg-[#E8F8F0] px-2 py-1.5 font-bold text-[#006c49] text-[12px] transition-colors hover:bg-[#006c49] hover:text-white"
                      onClick={(event) => {
                        event.stopPropagation();
                        handleExplain(index);
                      }}
                      title="Jelaskan bagian ini dengan AI"
                      type="button"
                    >
                      {isExplaining && isActive ? "…" : "Jelaskan"}
                    </button>
                    <button
                      className="rounded-lg bg-[#eaedff] p-1.5 text-[#3525cd] transition-colors hover:bg-[#4f46e5] hover:text-white disabled:opacity-40"
                      disabled={!speechSupported}
                      onClick={(event) => {
                        event.stopPropagation();
                        handlePlayCurrent(index);
                      }}
                      title={
                        speechSupported
                          ? "Dengarkan bagian ini"
                          : TTS_UNAVAILABLE_MESSAGE
                      }
                      type="button"
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        volume_up
                      </span>
                    </button>
                  </div>
                </div>

                <p className={`${getTextClass()} font-medium text-[#131b2e]`}>
                  {simplifiedMode
                    ? (paragraph.simplified ?? paragraph.content)
                    : paragraph.content}
                </p>

                {paragraph.keywords?.length ? (
                  <div className="mt-3 flex flex-wrap gap-1.5 border-slate-100 border-t pt-2">
                    {paragraph.keywords.map((keyword) => (
                      <span
                        className="rounded-md bg-[#eaedff] px-2 py-0.5 font-bold text-[#3525cd] text-[11px]"
                        key={keyword}
                      >
                        #{keyword}
                      </span>
                    ))}
                  </div>
                ) : null}

                {isActive && explanation ? (
                  <div className="mt-3 rounded-xl border border-[#c7c4d8] bg-[#eaedff] p-3 text-[#131b2e] text-[13px]">
                    <div className="mb-1 flex items-center gap-1.5 font-extrabold text-[#3525cd]">
                      <span className="material-symbols-outlined text-[16px]">
                        info
                      </span>
                      <span>Penjelasan Teman AI</span>
                    </div>
                    <p className="font-medium text-[#464555]">{explanation}</p>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>

        <div className="flex shrink-0 items-center justify-between gap-3 border-[#c7c4d8] border-t-2 bg-white p-4">
          <div className="font-semibold text-[#464555] text-[13px]">
            <span>
              Paragraf {activeParagraphIndex + 1} dari {paragraphs.length}
            </span>
          </div>

          <button
            className={`tactile-btn flex items-center gap-2 rounded-2xl px-5 py-3 font-bold text-[14px] text-white ${
              completed
                ? "cursor-default bg-[#006c49] opacity-80"
                : "bg-[#4f46e5] shadow-[0_3px_0_0_#3525cd] hover:brightness-105"
            }`}
            disabled={completed}
            onClick={handleFinish}
            type="button"
          >
            <span className="material-symbols-outlined fill-icon text-[18px]">
              {completed ? "check_circle" : "stars"}
            </span>
            <span>
              {completed
                ? "Sudah Selesai (+20 XP)"
                : "Selesai Membaca (+20 XP)"}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
