import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { LearningModule } from '../types';
import { soundEffects, speakText } from '../utils/audio';

interface QuizModalProps {
  module: LearningModule;
  onClose: () => void;
  onComplete: (xpGained: number) => void;
}

export const QuizModal: React.FC<QuizModalProps> = ({ module, onClose, onComplete }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  const questions = module.quiz;
  const currentQ = questions[currentQuestionIndex];

  const handleSelectOption = (idx: number) => {
    if (isAnswered) return;
    soundEffects.playTap();
    setSelectedOption(idx);
    setIsAnswered(true);

    const isCorrect = idx === currentQ.correctIndex;
    if (isCorrect) {
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
    } else {
      setIsFinished(true);
      confetti({
        particleCount: 80,
        spread: 90,
        origin: { y: 0.6 },
      });
      onComplete(40);
    }
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
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-center items-center p-4">
      <div className="w-full max-w-lg bg-[#faf8ff] rounded-3xl border-2 border-[#006c49] shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 bg-white border-b-2 border-[#c7c4d8] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-[#6cf8bb] text-[#00714d] border border-[#006c49] flex items-center justify-center shadow-[0_2px_0_0_#005236]">
              <span className="material-symbols-outlined text-[20px]">extension</span>
            </div>
            <div>
              <span className="text-[11px] font-bold text-[#006c49] uppercase tracking-wider">
                Kuis Santai Adaptif
              </span>
              <h3 className="text-[15px] font-extrabold text-[#131b2e] leading-tight truncate">
                {module.title}
              </h3>
            </div>
          </div>

          <button
            onClick={() => {
              soundEffects.playTap();
              onClose();
            }}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
            aria-label="Tutup Kuis"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Content Body */}
        {!isFinished ? (
          <div className="p-5 flex flex-col">
            {/* Progress indicator */}
            <div className="flex items-center justify-between text-[12px] font-bold text-[#464555] mb-2">
              <span>
                Soal {currentQuestionIndex + 1} dari {questions.length}
              </span>
              <span className="text-[#006c49] bg-[#E8F8F0] px-2.5 py-0.5 rounded-full">
                Benar: {score}
              </span>
            </div>

            <div className="w-full h-2.5 bg-[#eaedff] rounded-full overflow-hidden border border-[#c7c4d8] mb-4">
              <div
                className="h-full bg-[#006c49] transition-all duration-300"
                style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
              ></div>
            </div>

            {/* Question Card */}
            <div className="p-4 rounded-2xl bg-white border-2 border-[#c7c4d8] shadow-sm mb-4">
              <div className="flex items-start justify-between gap-2">
                <p className="text-[16px] sm:text-[17px] font-extrabold text-[#131b2e] leading-snug">
                  {currentQ.question}
                </p>
                <button
                  onClick={() => speakText(currentQ.question)}
                  title="Bacakan pertanyaan"
                  className="p-1 rounded-lg bg-[#eaedff] text-[#3525cd] shrink-0"
                >
                  <span className="material-symbols-outlined text-[18px]">volume_up</span>
                </button>
              </div>
            </div>

            {/* Multiple Choice Options */}
            <div className="space-y-2.5 mb-4">
              {currentQ.options.map((opt, oIdx) => {
                const isSelected = selectedOption === oIdx;
                const isCorrect = oIdx === currentQ.correctIndex;

                let optClass = 'bg-white border-[#c7c4d8] hover:border-[#4f46e5] text-[#131b2e] shadow-[0_2px_0_0_#CBD5E1]';
                let icon = 'radio_button_unchecked';

                if (isAnswered) {
                  if (isCorrect) {
                    optClass = 'bg-[#ECFDF5] border-2 border-[#10B981] text-[#065F46] shadow-[0_2px_0_0_#059669] font-bold';
                    icon = 'check_circle';
                  } else if (isSelected && !isCorrect) {
                    optClass = 'bg-[#FEF2F2] border-2 border-[#EF4444] text-[#991B1B] shadow-[0_2px_0_0_#DC2626] font-bold';
                    icon = 'cancel';
                  } else {
                    optClass = 'bg-slate-50 border-slate-200 text-slate-400 opacity-60';
                  }
                }

                return (
                  <button
                    key={oIdx}
                    onClick={() => handleSelectOption(oIdx)}
                    disabled={isAnswered}
                    className={`tactile-btn w-full p-3.5 rounded-2xl border-2 text-left flex items-center gap-3 text-[14px] font-semibold transition-all ${optClass}`}
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[20px] shrink-0">{icon}</span>
                    <span className="flex-1">{opt}</span>
                  </button>
                );
              })}
            </div>

            {/* Explanation box after answer */}
            {isAnswered && (
              <div className="p-3.5 rounded-2xl bg-[#eaedff] border-2 border-[#c7c4d8] text-[13px] text-[#131b2e] mb-4 animate-in fade-in duration-200">
                <div className="flex items-center gap-1.5 font-extrabold text-[#3525cd] mb-1">
                  <span className="material-symbols-outlined text-[16px]">info</span>
                  <span>Penjelasan Ramah AI:</span>
                </div>
                <p className="font-medium text-[#464555]">{currentQ.explanation}</p>
              </div>
            )}

            {/* Next Question CTA */}
            {isAnswered && (
              <button
                onClick={handleNext}
                className="tactile-btn w-full min-h-[48px] py-3 px-4 bg-[#006c49] text-white rounded-2xl font-bold text-[14px] flex items-center justify-center gap-2 shadow-[0_3px_0_0_#002113] hover:brightness-105"
                type="button"
              >
                <span>{currentQuestionIndex + 1 < questions.length ? 'Lanjut ke Soal Berikutnya' : 'Lihat Hasil Kuis'}</span>
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </button>
            )}
          </div>
        ) : (
          /* Finished Screen */
          <div className="p-6 text-center space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-[#ECFDF5] text-[#10B981] border-2 border-[#10B981] flex items-center justify-center mx-auto shadow-[0_3px_0_0_#059669]">
              <span className="material-symbols-outlined text-[36px] fill-icon">military_tech</span>
            </div>

            <h4 className="text-[20px] font-extrabold text-[#131b2e]">Kuis Selesai dengan Hebat!</h4>
            <p className="text-[14px] text-[#464555]">
              Kamu menjawab benar <strong className="text-[#006c49] font-extrabold">{score}</strong> dari {questions.length} pertanyaan!
            </p>

            <div className="p-3.5 bg-[#FEF3C7] rounded-2xl border-2 border-[#F59E0B] text-[#92400E] font-extrabold text-[15px] inline-flex items-center gap-2 shadow-[0_2px_0_0_#D97706]">
              <span className="material-symbols-outlined fill-icon text-[#D97706]">stars</span>
              <span>Kamu Dapat Hadiah +40 XP!</span>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-3">
              <button
                onClick={handleRestart}
                className="tactile-btn py-3 px-4 bg-white border-2 border-[#CBD5E1] text-[#131b2e] rounded-xl font-bold text-[14px] shadow-[0_2px_0_0_#CBD5E1]"
              >
                Coba Lagi
              </button>
              <button
                onClick={onClose}
                className="tactile-btn py-3 px-4 bg-[#006c49] text-white rounded-xl font-bold text-[14px] shadow-[0_3px_0_0_#002113]"
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
