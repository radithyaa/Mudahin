import type { FocusProfileId } from "@mudahin/api/schemas";
import confetti from "canvas-confetti";
import { useEffect, useState } from "react";

import { moduleToText, toQuizQuestions } from "../lib/api/ai";
import { useAi } from "../lib/hooks/use-ai";
import { canSpeakText } from "../lib/speech-support";
import type { LearningModule, QuizQuestion } from "../types";
import { soundEffects, speakText } from "../utils/audio";

interface QuizModalProps {
  focusProfile?: FocusProfileId;
  module: LearningModule;
  onClose: () => void;
  onComplete: (correct: number, total: number) => void;
}

/**
 * Kuis Adaptif.
 *
 * Soal dibuat **lazy** via `ai.quiz` (3 soal) bila modul belum punya kuis, dan
 * skor akhirnya diteruskan ke `App` untuk disimpan lewat `progress.record`.
 */
export const QuizModal: React.FC<QuizModalProps> = ({
  module,
  onClose,
  onComplete,
  focusProfile,
}) => {
  const ai = useAi();
  const [questions, setQuestions] = useState<QuizQuestion[]>(module.quiz);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  const loadQuestions = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await ai.quiz.mutateAsync({
        text: moduleToText(module),
        count: 3,
        profile: focusProfile,
      });
      setQuestions(toQuizQuestions(result.questions));
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Gagal membuat kuis. Coba lagi."
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Muat soal kuis sekali per modul (module.quiz tidak pernah berubah).
  // biome-ignore lint/correctness/useExhaustiveDependencies: sengaja memuat ulang hanya saat modul berganti.
  useEffect(() => {
    if (module.quiz.length > 0) {
      setQuestions(module.quiz);
      return;
    }
    loadQuestions().catch(() => undefined);
  }, [module.id]);

  const currentQuestion = questions[currentQuestionIndex];
  const speechSupported = canSpeakText();

  const handleSelectOption = (index: number) => {
    if (isAnswered || !currentQuestion) {
      return;
    }
    soundEffects.playTap();
    setSelectedOption(index);
    setIsAnswered(true);

    if (index === currentQuestion.correctIndex) {
      soundEffects.playSuccess();
      setScore((prev) => prev + 1);
    } else {
      soundEffects.playSoftError();
    }
  };

  const handleNext = () => {
    soundEffects.playTap();
    if (currentQuestionIndex + 1 < questions.length) {
      setCurrentQuestionIndex((prev) => prev + 1);
      setSelectedOption(null);
      setIsAnswered(false);
      return;
    }

    setIsFinished(true);
    confetti({ particleCount: 80, spread: 90, origin: { y: 0.6 } });
    onComplete(score, questions.length);
  };

  const handleRestart = () => {
    soundEffects.playTap();
    setCurrentQuestionIndex(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setScore(0);
    setIsFinished(false);
  };

  return (
    <div className="dialog-layer dialog-layer--center">
      <div className="dialog-panel fade-in zoom-in-95 max-w-lg animate-in rounded-3xl border-2 border-[#006c49] bg-[#faf8ff] shadow-2xl duration-200">
        <div className="flex items-center justify-between border-[#c7c4d8] border-b-2 bg-white p-4">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#006c49] bg-[#6cf8bb] text-[#00714d] shadow-[0_2px_0_0_#005236]">
              <span className="material-symbols-outlined text-[20px]">
                extension
              </span>
            </div>
            <div>
              <span className="font-bold text-[#006c49] text-[11px] uppercase tracking-wider">
                Kuis Santai Adaptif
              </span>
              <h3 className="truncate font-extrabold text-[#131b2e] text-[15px] leading-tight">
                {module.title}
              </h3>
            </div>
          </div>

          <button
            aria-label="Tutup Kuis"
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

        {isLoading ? (
          <div className="space-y-3 p-8 text-center">
            <span className="material-symbols-outlined inline-block animate-spin text-[#006c49] text-[36px]">
              auto_awesome
            </span>
            <p className="font-bold text-[#131b2e] text-[14px]">
              Teman AI sedang menyiapkan soal kuis…
            </p>
          </div>
        ) : null}

        {!isLoading && error && (
          <div className="space-y-4 p-6 text-center">
            <div className="rounded-2xl border-2 border-[#F59E0B] bg-[#FEF3C7] p-3.5 font-semibold text-[#92400E] text-[13px]">
              {error}
            </div>
            <button
              className="tactile-btn rounded-xl bg-[#006c49] px-4 py-3 font-bold text-[14px] text-white shadow-[0_3px_0_0_#002113]"
              onClick={() => loadQuestions()}
              type="button"
            >
              Coba Lagi
            </button>
          </div>
        )}

        {!(isLoading || error) && questions.length === 0 && (
          <div className="p-8 text-center font-semibold text-[#464555] text-[14px]">
            Belum ada soal untuk materi ini.
          </div>
        )}

        {!(isLoading || error) && questions.length > 0 && !isFinished && (
          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain p-5">
            <div className="mb-2 flex items-center justify-between font-bold text-[#464555] text-[12px]">
              <span>
                Soal {currentQuestionIndex + 1} dari {questions.length}
              </span>
              <span className="rounded-full bg-[#E8F8F0] px-2.5 py-0.5 text-[#006c49]">
                Benar: {score}
              </span>
            </div>

            <div className="mb-4 h-2.5 w-full overflow-hidden rounded-full border border-[#c7c4d8] bg-[#eaedff]">
              <div
                className="h-full bg-[#006c49] transition-all duration-300"
                style={{
                  width: `${((currentQuestionIndex + 1) / questions.length) * 100}%`,
                }}
              />
            </div>

            <div className="mb-4 rounded-2xl border-2 border-[#c7c4d8] bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <p className="font-extrabold text-[#131b2e] text-[16px] leading-snug sm:text-[17px]">
                  {currentQuestion.question}
                </p>
                <button
                  className="shrink-0 rounded-lg bg-[#eaedff] p-1 text-[#3525cd] disabled:opacity-40"
                  disabled={!speechSupported}
                  onClick={() => speakText(currentQuestion.question)}
                  title="Bacakan pertanyaan"
                  type="button"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    volume_up
                  </span>
                </button>
              </div>
            </div>

            <div className="mb-4 space-y-2.5">
              {currentQuestion.options.map((option, optionIndex) => {
                const isSelected = selectedOption === optionIndex;
                const isCorrect = optionIndex === currentQuestion.correctIndex;

                let optionClass =
                  "bg-white border-[#c7c4d8] hover:border-[#4f46e5] text-[#131b2e] shadow-[0_2px_0_0_#CBD5E1]";
                let icon = "radio_button_unchecked";

                if (isAnswered) {
                  if (isCorrect) {
                    optionClass =
                      "bg-[#ECFDF5] border-2 border-[#10B981] text-[#065F46] shadow-[0_2px_0_0_#059669] font-bold";
                    icon = "check_circle";
                  } else if (isSelected && !isCorrect) {
                    optionClass =
                      "bg-[#FEF2F2] border-2 border-[#EF4444] text-[#991B1B] shadow-[0_2px_0_0_#DC2626] font-bold";
                    icon = "cancel";
                  } else {
                    optionClass =
                      "bg-slate-50 border-slate-200 text-slate-400 opacity-60";
                  }
                }

                return (
                  <button
                    className={`tactile-btn flex w-full items-center gap-3 rounded-2xl border-2 p-3.5 text-left font-semibold text-[14px] transition-all ${optionClass}`}
                    disabled={isAnswered}
                    key={option}
                    onClick={() => handleSelectOption(optionIndex)}
                    type="button"
                  >
                    <span className="material-symbols-outlined shrink-0 text-[20px]">
                      {icon}
                    </span>
                    <span className="flex-1">{option}</span>
                  </button>
                );
              })}
            </div>

            {isAnswered ? (
              <div className="fade-in mb-4 animate-in rounded-2xl border-2 border-[#c7c4d8] bg-[#eaedff] p-3.5 text-[#131b2e] text-[13px] duration-200">
                <div className="mb-1 flex items-center gap-1.5 font-extrabold text-[#3525cd]">
                  <span className="material-symbols-outlined text-[16px]">
                    info
                  </span>
                  <span>Penjelasan Ramah AI:</span>
                </div>
                <p className="font-medium text-[#464555]">
                  {currentQuestion.explanation}
                </p>
              </div>
            ) : null}

            {isAnswered ? (
              <button
                className="tactile-btn flex min-h-[48px] w-full items-center justify-center gap-2 rounded-2xl bg-[#006c49] px-4 py-3 font-bold text-[14px] text-white shadow-[0_3px_0_0_#002113] hover:brightness-105"
                onClick={handleNext}
                type="button"
              >
                <span>
                  {currentQuestionIndex + 1 < questions.length
                    ? "Lanjut ke Soal Berikutnya"
                    : "Lihat Hasil Kuis"}
                </span>
                <span className="material-symbols-outlined text-[18px]">
                  arrow_forward
                </span>
              </button>
            ) : null}
          </div>
        )}

        {!(isLoading || error) && isFinished && (
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain p-6 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl border-2 border-[#10B981] bg-[#ECFDF5] text-[#10B981] shadow-[0_3px_0_0_#059669]">
              <span className="material-symbols-outlined fill-icon text-[36px]">
                military_tech
              </span>
            </div>

            <h4 className="font-extrabold text-[#131b2e] text-[20px]">
              Kuis Selesai dengan Hebat!
            </h4>
            <p className="text-[#464555] text-[14px]">
              Kamu menjawab benar{" "}
              <strong className="font-extrabold text-[#006c49]">{score}</strong>{" "}
              dari {questions.length} pertanyaan!
            </p>

            <div className="inline-flex items-center gap-2 rounded-2xl border-2 border-[#F59E0B] bg-[#FEF3C7] p-3.5 font-extrabold text-[#92400E] text-[15px] shadow-[0_2px_0_0_#D97706]">
              <span className="material-symbols-outlined fill-icon text-[#D97706]">
                stars
              </span>
              <span>Kamu Dapat Hadiah +40 XP!</span>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-3">
              <button
                className="tactile-btn rounded-xl border-2 border-[#CBD5E1] bg-white px-4 py-3 font-bold text-[#131b2e] text-[14px] shadow-[0_2px_0_0_#CBD5E1]"
                onClick={handleRestart}
                type="button"
              >
                Coba Lagi
              </button>
              <button
                className="tactile-btn rounded-xl bg-[#006c49] px-4 py-3 font-bold text-[14px] text-white shadow-[0_3px_0_0_#002113]"
                onClick={onClose}
                type="button"
              >
                Selesai
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
