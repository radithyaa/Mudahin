import type { VoiceEvaluation } from "@mudahin/api/schemas";
import confetti from "canvas-confetti";
import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRecordVoiceAttempt } from "../lib/hooks/use-progress";
import { useSpeechRecognition } from "../lib/speech-stt";
import { useVoiceAttemptsStore } from "../lib/stores/voice-history-store";
import type { LearningModule } from "../types";
import { soundEffects, speakText } from "../utils/audio";

interface VoicePracticeModalProps {
  module: LearningModule;
  onClose: () => void;
  /**
   * Dipanggil saat latihan tuntas dengan jawaban benar. `xpGained` 0 bila ini
   * mode ulangan (riwayat) yang memang tidak memberi XP.
   */
  onComplete: (xpGained: number) => void;
  /** Mode ulangan dari riwayat: dinilai & dicatat, tetapi tanpa XP. */
  replay?: boolean;
}

/** Umpan balik yang ditampilkan setelah penilaian. */
interface Feedback {
  isSuccess: boolean;
  message: string;
}

/** XP yang diberikan bila jawaban dinilai benar. */
const CORRECT_XP = 25;

/**
 * Jeda (ms) setelah transkrip terakhir sebelum jawaban otomatis dikirim.
 *
 * Inilah inti permintaan "tidak ada suara lagi → otomatis dikirim": begitu
 * transkrip tidak lagi bertambah, kita tunggu sebentar agar kalimat terakhir
 * selesai, lalu kirim ke server untuk dinilai — tanpa menekan tombol apa pun.
 */
const SILENCE_COMMIT_MS = 2200;

/** Label tombol utama sesuai keadaan perekaman/penilaian. */
function recordButtonLabel(state: {
  isCompleted: boolean;
  isEvaluating: boolean;
  isListening: boolean;
}): string {
  if (state.isListening) {
    return "Selesai Bicara & Nilai";
  }
  if (state.isEvaluating) {
    return "Teman AI Menilai…";
  }
  return state.isCompleted ? "Kerjakan Ulang" : "Mulai Bicara Jawabanmu";
}

/** Animasi gelombang suara saat merekam + penanda waktu berjalan. */
const RecordingVisualizer: React.FC<{
  isEvaluating: boolean;
  isListening: boolean;
  recordingSeconds: number;
}> = ({ isListening, isEvaluating, recordingSeconds }) => (
  <div className="my-3 flex flex-col items-center">
    {isListening ? (
      <div className="flex flex-col items-center space-y-3">
        <div className="flex h-12 items-center gap-1.5">
          {[40, 70, 95, 60, 85, 100, 75, 50, 80, 45].map((height, index) => (
            <span
              className="w-1.5 animate-pulse rounded-full bg-[#DC2626]"
              key={height}
              style={{
                height: `${height}%`,
                animationDelay: `${index * 0.1}s`,
                animationDuration: "0.6s",
              }}
            />
          ))}
        </div>
        <span className="animate-pulse font-extrabold text-[#DC2626] text-[13px]">
          Sedang merekam suaramu... ({recordingSeconds}s)
        </span>
        <span className="font-medium text-[#464555] text-[11px]">
          Diam sejenak → jawaban otomatis dikirim & dinilai.
        </span>
      </div>
    ) : (
      <div className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-[#F59E0B] bg-[#FEF3C7] text-[#92400E] shadow-[0_4px_0_0_#D97706]">
        <span className="material-symbols-outlined text-[36px]">
          {isEvaluating ? "hourglass_top" : "mic"}
        </span>
      </div>
    )}
  </div>
);

/** Kotak transkrip suara yang terdengar. */
const TranscriptBox: React.FC<{ transcript: string }> = ({ transcript }) =>
  transcript ? (
    <div className="mb-4 w-full rounded-2xl border border-[#c7c4d8] bg-white p-3.5 text-[#131b2e] text-[14px]">
      <span className="mb-1 block font-bold text-[#464555] text-[11px]">
        Suara yang Terdeteksi:
      </span>
      <p className="font-semibold italic">"{transcript}"</p>
    </div>
  ) : null;

/** Umpan balik Teman AI setelah jawaban dinilai. */
const FeedbackBox: React.FC<{ feedback: Feedback; replay: boolean }> = ({
  feedback,
  replay,
}) => (
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
      <span>
        {feedback.isSuccess ? "Jawabanmu Benar!" : "Evaluasi Teman AI:"}
      </span>
    </div>
    <p className="font-medium leading-relaxed">{feedback.message}</p>
    {feedback.isSuccess ? (
      <p className="mt-2 font-bold text-[#065F46] text-[12px]">
        {replay
          ? "Mode ulangan: latihan dicatat, tanpa XP."
          : `+${CORRECT_XP} XP untukmu!`}
      </p>
    ) : null}
  </div>
);

export const VoicePracticeModal: React.FC<VoicePracticeModalProps> = ({
  module,
  onClose,
  onComplete,
  replay = false,
}) => {
  const voice = useSpeechRecognition();
  const recordAttempt = useRecordVoiceAttempt();
  const markAttempted = useVoiceAttemptsStore((state) => state.markAttempted);
  const {
    cancel: cancelListening,
    error: voiceError,
    isListening,
    isSupported,
    start,
    stop,
    transcript,
  } = voice;
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  const prompt = module.voicePrompt;

  /**
   * Menjaga agar satu sesi rekaman hanya dikirim **sekali**.
   *
   * Tanpa ini, jeda sunyi sebelum transkrip final tiba bisa memicu dua
   * pengiriman (satu dari `onend`, satu dari watchdog keheningan) dan membuat
   * pengguna mendapat dua XP untuk satu jawaban.
   */
  const evaluatedRef = useRef<{ done: boolean }>({ done: false });

  /** Menampilkan hasil penilaian + memberi XP bila jawaban benar. */
  const applyEvaluation = useCallback(
    (evaluation: VoiceEvaluation) => {
      if (evaluation.correct) {
        soundEffects.playSuccess();
        confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
        setIsCompleted(true);
        // XP hanya diberikan pada latihan baru, bukan ulangan riwayat.
        onComplete(replay ? 0 : CORRECT_XP);
      } else {
        soundEffects.playSoftError();
      }
      setFeedback({
        isSuccess: evaluation.correct,
        message: evaluation.feedback,
      });
    },
    [onComplete, replay]
  );

  // Bersihkan mikrofon saat modal ditutup agar sesi tidak tertinggal aktif.
  useEffect(() => () => cancelListening(), [cancelListening]);

  useEffect(() => {
    if (!isListening) {
      return;
    }
    const interval = setInterval(() => {
      setRecordingSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isListening]);

  /**
   * Mengirim jawaban ke server untuk dinilai lalu menampilkan hasilnya.
   *
   * Dipanggil otomatis saat keheningan terdeteksi maupun saat pengguna menekan
   * tombol "Selesai Bicara". Percobaan tetap dicatat di riwayat walau salah.
   */
  const commitAnswer = useCallback(
    async (spoken: string) => {
      if (evaluatedRef.current.done) {
        return;
      }
      evaluatedRef.current.done = true;
      setIsEvaluating(true);
      markAttempted(module.id);

      try {
        const evaluation = await recordAttempt.mutateAsync({
          materialId: module.id,
          materialTitle: module.title,
          question: prompt.question,
          expectedKeywords: prompt.expectedKeywords,
          sampleAnswer: prompt.sampleGoodAnswer,
          transcript: spoken,
          replay,
        });

        applyEvaluation(evaluation);
      } catch {
        // Server tidak bisa dijangkau: beri tahu jujur, dan izinkan coba lagi.
        setFeedback({
          isSuccess: false,
          message:
            "Tidak bisa mengirim jawabanmu ke server. Periksa koneksi lalu coba lagi ya.",
        });
        evaluatedRef.current.done = false;
      } finally {
        setIsEvaluating(false);
      }
    },
    [
      applyEvaluation,
      markAttempted,
      module.id,
      module.title,
      prompt,
      recordAttempt,
      replay,
    ]
  );

  /**
   * Pengiriman otomatis — inti permintaan "tidak ada suara lagi → kirim ke AI".
   *
   * Dua jalur butuh penanganan berbeda, karena transkripnya datang di waktu yang
   * berbeda:
   * - **Web Speech** menampilkan transkrip selagi merekam. Jadi kita pasang timer
   *   keheningan: begitu tidak ada kata baru selama `SILENCE_COMMIT_MS`, rekaman
   *   dihentikan dan jawaban langsung dinilai.
   * - **Perekam server** (`MediaRecorder`) baru menghasilkan transkrip setelah
   *   rekaman berhenti. Karena itu kita menunggu transkrip muncul lalu langsung
   *   mengirimkannya — tanpa perlu menekan tombol.
   *
   * `evaluatedRef` menjamin keduanya tidak mengirim dua kali untuk satu jawaban.
   */
  useEffect(() => {
    const spoken = transcript.trim();
    if (spoken.length === 0 || evaluatedRef.current.done) {
      return;
    }

    // Jalur perekam: transkrip sudah final (perekaman berhenti) → kirim segara.
    if (!isListening) {
      commitAnswer(spoken).catch(() => undefined);
      return;
    }

    // Jalur Web Speech: tunggu jeda sunyi sebelum mengirim.
    const timer = globalThis.setTimeout(() => {
      stop();
      commitAnswer(spoken).catch(() => undefined);
    }, SILENCE_COMMIT_MS);
    return () => globalThis.clearTimeout(timer);
  }, [commitAnswer, isListening, stop, transcript]);

  const handleStartRecording = () => {
    soundEffects.playTap();
    setFeedback(null);
    setRecordingSeconds(0);
    setIsCompleted(false);
    evaluatedRef.current.done = false;
    start();
  };

  /**
   * Tombol "Selesai Bicara".
   *
   * Bila transkrip sudah ada (jalur Web Speech), langsung dinilai. Bila belum
   * (jalur perekam server, transkrip baru tiba setelah berhenti), cukup hentikan
   * rekaman — efek pengiriman otomatis di atas yang akan mengirim saat transkrip
   * tiba.
   */
  const handleStopRecording = () => {
    soundEffects.playTap();
    const spoken = transcript.trim();
    stop();
    if (spoken.length > 0) {
      commitAnswer(spoken).catch(() => undefined);
    }
  };

  // Tanpa dukungan STT (mis. WebView Android tanpa MediaRecorder), tampilkan
  // pesan jujur — tombol yang diam saja tidak berguna bagi pengguna.
  const missingSupport = !isSupported;
  const isBusy = isListening || isEvaluating;
  const buttonLabel = recordButtonLabel({
    isCompleted,
    isEvaluating,
    isListening,
  });

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
                {replay
                  ? "Jawab dengan Suara (Ulangan)"
                  : "Latihan Jawab dengan Suara"}
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
          <RecordingVisualizer
            isEvaluating={isEvaluating}
            isListening={isListening}
            recordingSeconds={recordingSeconds}
          />

          {/* Transcript / Spoken Result Box */}
          <TranscriptBox transcript={transcript} />

          {/* AI Encouraging Feedback */}
          {feedback ? (
            <FeedbackBox feedback={feedback} replay={replay} />
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

            {missingSupport ? null : (
              <button
                className={`tactile-btn flex min-h-[50px] w-full items-center justify-center gap-2 rounded-2xl px-4 py-3.5 font-bold text-[15px] text-white shadow-[0_3px_0_0_#991B1B] hover:brightness-105 active:brightness-95 disabled:opacity-60 ${
                  isListening ? "bg-[#DC2626]" : "bg-[#F59E0B]"
                }`}
                disabled={isBusy}
                onClick={
                  isListening ? handleStopRecording : handleStartRecording
                }
                type="button"
              >
                <span className="material-symbols-outlined fill-icon text-[20px]">
                  {isListening ? "stop_circle" : "mic"}
                </span>
                <span>{buttonLabel}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
