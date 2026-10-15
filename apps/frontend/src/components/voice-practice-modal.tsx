import confetti from "canvas-confetti";
import type React from "react";
import { useEffect, useState } from "react";
import { useSpeechRecognition } from "../lib/speech-stt";
import type { LearningModule } from "../types";
import { soundEffects, speakText } from "../utils/audio";

interface VoicePracticeModalProps {
  module: LearningModule;
  onClose: () => void;
  onComplete: (xpGained: number) => void;
}

/** Kata penting untuk pelaporan umpan balik yang ramah. */
const MAX_REPORTED_KEYWORDS = 3;

const AUTO_STOP_SECONDS = 12;

export const VoicePracticeModal: React.FC<VoicePracticeModalProps> = ({
  module,
  onClose,
  onComplete,
}) => {
  const voice = useSpeechRecognition();
  const {
    cancel: cancelListening,
    error: voiceError,
    isListening,
    isSupported,
    start,
    stop,
    transcript,
  } = voice;
  const [feedback, setFeedback] = useState<{
    isSuccess: boolean;
    message: string;
  } | null>(null);
  const [recordingSeconds, setRecordingSeconds] = useState(0);

  const prompt = module.voicePrompt;

  // Bersihkan mikrofon saat modal ditutup agar sesi tidak tertinggal aktif.
  useEffect(() => () => cancelListening(), [cancelListening]);

  useEffect(() => {
    if (!isListening) {
      return;
    }
    const interval = setInterval(() => {
      setRecordingSeconds((prev) => prev + 1);
    }, 1000);
    // Penghentian otomatis agar sesi tidak menggantung tanpa batas.
    const autoStop = globalThis.setTimeout(
      () => stop(),
      AUTO_STOP_SECONDS * 1000
    );
    return () => {
      clearInterval(interval);
      globalThis.clearTimeout(autoStop);
    };
  }, [isListening, stop]);

  const handleStartRecording = () => {
    soundEffects.playTap();
    setFeedback(null);
    setRecordingSeconds(0);
    start();
  };

  const handleStopRecording = () => {
    soundEffects.playTap();
    stop();

    const spoken = transcript.trim();

    if (spoken.length === 0) {
      setFeedback({
        isSuccess: false,
        message:
          "Belum ada suara yang terbaca. Coba lagi dan bicara agak lebih dekat ke mikrofon ya!",
      });
      return;
    }

    // Cocokkan ucapan ke kata kunci yang diharapkan (STT sungguhan).
    const lower = spoken.toLowerCase();
    const matched = prompt.expectedKeywords.filter((keyword) =>
      lower.includes(keyword.toLowerCase())
    );
    const isGood = matched.length >= 2;

    if (isGood) {
      soundEffects.playSuccess();
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
      setFeedback({
        isSuccess: true,
        message: `Keren banget! Kamu sudah menyebut poin penting: “${matched
          .slice(0, MAX_REPORTED_KEYWORDS)
          .join(", ")}”. Penjelasanmu mengalir santai dan jelas!`,
      });
      onComplete(25);
      return;
    }

    soundEffects.playTap();
    setFeedback({
      isSuccess: false,
      message: `Bagus sudah mencoba bicara! Coba sebutkan juga kata kuncinya ya seperti: ${prompt.expectedKeywords
        .slice(0, MAX_REPORTED_KEYWORDS)
        .join(", ")}.`,
    });
  };

  // Tanpa dukungan STT (mis. WebView Android), tampilkan pesan jujur + opsi
  // mendengarkan — alih-alih tombol yang diam saja.
  const missingSupport = !isSupported;

  return (
    <div className="dialog-layer dialog-layer--center">
      <div className="dialog-panel fade-in zoom-in-95 max-w-lg animate-in rounded-3xl border-2 border-[#D97706] bg-[#faf8ff] shadow-2xl duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-[#c7c4d8] border-b-2 bg-white p-4">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#F59E0B] bg-[#FEF3C7] text-[#92400E] shadow-[0_2px_0_0_#D97706]">
              <span className="material-symbols-outlined text-[20px]">mic</span>
            </div>
            <div>
              <span className="font-bold text-[#92400E] text-[11px] uppercase tracking-wider">
                Latihan Jawab dengan Suara
              </span>
              <h3 className="truncate font-extrabold text-[#131b2e] text-[15px] leading-tight">
                {module.title}
              </h3>
            </div>
          </div>

          <button
            aria-label="Tutup"
            className="rounded-xl bg-slate-100 p-2 font-bold text-slate-700 hover:bg-slate-200"
            onClick={() => {
              soundEffects.playTap();
              onClose();
            }}
            type="button"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex min-h-0 flex-1 flex-col items-center overflow-y-auto overscroll-contain p-5">
          {/* Question / Prompt Box */}
          <div className="mb-4 w-full rounded-2xl border-2 border-[#c7c4d8] bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-2">
              <p className="font-extrabold text-[#131b2e] text-[15px] leading-relaxed">
                {prompt.question}
              </p>
              <button
                className="shrink-0 rounded-lg bg-[#FEF3C7] p-1.5 text-[#92400E]"
                onClick={() => speakText(prompt.question)}
                title="Dengarkan pertanyaan"
                type="button"
              >
                <span className="material-symbols-outlined text-[18px]">
                  volume_up
                </span>
              </button>
            </div>
            <p className="mt-2 inline-block rounded-full bg-[#E8F8F0] px-3 py-1 font-medium text-[#006c49] text-[12px]">
              💡 Tips: {prompt.tip}
            </p>
          </div>

          {/* Recording Visualizer Area */}
          <div className="my-3 flex flex-col items-center">
            {isListening ? (
              <div className="flex flex-col items-center space-y-3">
                {/* Waveform animation bars */}
                <div className="flex h-12 items-center gap-1.5">
                  {[40, 70, 95, 60, 85, 100, 75, 50, 80, 45].map((h, i) => (
                    <span
                      className="w-1.5 animate-pulse rounded-full bg-[#DC2626]"
                      key={h}
                      style={{
                        height: `${h}%`,
                        animationDelay: `${i * 0.1}s`,
                        animationDuration: "0.6s",
                      }}
                    />
                  ))}
                </div>
                <span className="animate-pulse font-extrabold text-[#DC2626] text-[13px]">
                  Sedang merekam suaramu... ({recordingSeconds}s)
                </span>
              </div>
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-[#F59E0B] bg-[#FEF3C7] text-[#92400E] shadow-[0_4px_0_0_#D97706]">
                <span className="material-symbols-outlined text-[36px]">
                  mic
                </span>
              </div>
            )}
          </div>

          {/* Transcript / Spoken Result Box */}
          {transcript ? (
            <div className="mb-4 w-full rounded-2xl border border-[#c7c4d8] bg-white p-3.5 text-[#131b2e] text-[14px]">
              <span className="mb-1 block font-bold text-[#464555] text-[11px]">
                Suara yang Terdeteksi:
              </span>
              <p className="font-semibold italic">"{transcript}"</p>
            </div>
          ) : null}

          {/* AI Encouraging Feedback */}
          {feedback ? (
            <div
              className={`mb-4 w-full rounded-2xl border-2 p-4 text-[13px] ${
                feedback.isSuccess
                  ? "border-[#10B981] bg-[#ECFDF5] text-[#065F46]"
                  : "border-[#F59E0B] bg-[#FEF3C7] text-[#92400E]"
              }`}
            >
              <div className="mb-1 flex items-center gap-1.5 font-bold">
                <span className="material-symbols-outlined text-[18px]">
                  {feedback.isSuccess ? "verified" : "lightbulb"}
                </span>
                <span>Evaluasi Teman AI:</span>
              </div>
              <p className="font-medium leading-relaxed">{feedback.message}</p>
            </div>
          ) : null}

          {/* Record Toggle Button */}
          <div className="w-full pt-2">
            {missingSupport ? (
              <p className="rounded-2xl border-2 border-[#F59E0B] bg-[#FEF3C7] p-3.5 text-center font-semibold text-[#92400E] text-[13px]">
                Perekaman suara belum didukung di perangkat atau browser ini.
                Kamu tetap bisa mendengarkan pertanyaan lewat tombol suara di
                atas, lalu menjawabnya di latihan lain.
              </p>
            ) : null}

            {voiceError && !missingSupport ? (
              <p
                className="mb-2 rounded-2xl border-2 border-[#DC2626] bg-[#FEF2F2] p-3 text-center font-semibold text-[#991B1B] text-[13px]"
                role="alert"
              >
                {voiceError}
              </p>
            ) : null}

            {!missingSupport && isListening ? (
              <button
                className="tactile-btn flex min-h-[50px] w-full items-center justify-center gap-2 rounded-2xl bg-[#DC2626] px-4 py-3.5 font-bold text-[15px] text-white shadow-[0_3px_0_0_#991B1B] hover:brightness-105 active:brightness-95"
                onClick={handleStopRecording}
                type="button"
              >
                <span className="material-symbols-outlined text-[20px]">
                  stop_circle
                </span>
                <span>Selesai Bicara &amp; Evaluasi</span>
              </button>
            ) : null}

            {missingSupport || isListening ? null : (
              <button
                className="tactile-btn flex min-h-[50px] w-full items-center justify-center gap-2 rounded-2xl bg-[#F59E0B] px-4 py-3.5 font-bold text-[15px] text-white shadow-[0_3px_0_0_#B45309] hover:brightness-105 active:brightness-95"
                onClick={handleStartRecording}
                type="button"
              >
                <span className="material-symbols-outlined fill-icon text-[20px]">
                  mic
                </span>
                <span>Mulai Bicara Jawabanmu</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
