import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { LearningModule } from '../types';
import { soundEffects, speakText } from '../utils/audio';

interface FlashcardModalProps {
  module: LearningModule;
  onClose: () => void;
  onComplete: (xpGained: number) => void;
}

export const FlashcardModal: React.FC<FlashcardModalProps> = ({ module, onClose, onComplete }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [understoodCount, setUnderstoodCount] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  const cards = module.flashcards;
  const currentCard = cards[currentIndex];

  const handleFlip = () => {
    soundEffects.playFlip();
    setIsFlipped(!isFlipped);
  };

  const handleSpeak = (e: React.MouseEvent) => {
    e.stopPropagation();
    soundEffects.playTap();
    const text = isFlipped ? currentCard.answer : currentCard.question;
    speakText(text);
  };

  const handleNext = (understood: boolean) => {
    if (understood) {
      soundEffects.playSuccess();
      setUnderstoodCount((prev) => prev + 1);
    } else {
      soundEffects.playTap();
    }

    setIsFlipped(false);
    if (currentIndex + 1 < cards.length) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setIsFinished(true);
      confetti({
        particleCount: 75,
        spread: 80,
        origin: { y: 0.6 },
      });
      onComplete(30);
    }
  };

  const handleRestart = () => {
    soundEffects.playTap();
    setCurrentIndex(0);
    setIsFlipped(false);
    setUnderstoodCount(0);
    setIsFinished(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-center items-center p-4">
      <div className="w-full max-w-lg bg-[#faf8ff] rounded-3xl border-2 border-[#4f46e5] shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 bg-white border-b-2 border-[#c7c4d8] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-[#4f46e5] text-white flex items-center justify-center shadow-[0_2px_0_0_#3525cd]">
              <span className="material-symbols-outlined text-[20px]">style</span>
            </div>
            <div>
              <span className="text-[11px] font-bold text-[#3525cd] uppercase tracking-wider">
                Kartu Tanya Jawab
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
            aria-label="Tutup Flashcard"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Content Body */}
        {!isFinished ? (
          <div className="p-5 flex flex-col items-center">
            {/* Progress indicator */}
            <div className="w-full flex items-center justify-between text-[12px] font-bold text-[#464555] mb-2">
              <span>
                Kartu {currentIndex + 1} dari {cards.length}
              </span>
              <span className="text-[#006c49]">Paham: {understoodCount}</span>
            </div>

            <div className="w-full h-2.5 bg-[#eaedff] rounded-full overflow-hidden border border-[#c7c4d8] mb-5">
              <div
                className="h-full bg-[#4f46e5] transition-all duration-300"
                style={{ width: `${((currentIndex + 1) / cards.length) * 100}%` }}
              ></div>
            </div>

            {/* Flashcard 3D Card Area */}
            <div
              onClick={handleFlip}
              className="w-full min-h-[220px] sm:min-h-[250px] p-6 rounded-3xl bg-white border-2 border-[#4f46e5] shadow-[0_6px_0_0_#4f46e5] flex flex-col justify-between cursor-pointer hover:brightness-[1.02] transition-transform active:scale-[0.99] select-none"
            >
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded-full bg-[#eaedff] text-[#3525cd] text-[11px] font-bold">
                  {currentCard.category}
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSpeak}
                    title="Dengarkan suara"
                    className="p-1.5 rounded-lg bg-[#FEF3C7] text-[#92400E] border border-[#F59E0B] hover:bg-[#FDE68A]"
                  >
                    <span className="material-symbols-outlined text-[18px]">volume_up</span>
                  </button>
                  <span className="text-[11px] font-bold text-[#464555]">
                    {isFlipped ? 'Jawaban' : 'Pertanyaan'}
                  </span>
                </div>
              </div>

              {/* Main Card Text */}
              <div className="my-auto py-4 text-center">
                <p className="text-[17px] sm:text-[19px] font-extrabold text-[#131b2e] leading-snug">
                  {isFlipped ? currentCard.answer : currentCard.question}
                </p>
                {!isFlipped && currentCard.hint && (
                  <p className="text-[12px] font-medium text-[#006c49] mt-3 bg-[#E8F8F0] py-1 px-3 rounded-full inline-block">
                    💡 Petunjuk: {currentCard.hint}
                  </p>
                )}
              </div>

              {/* Tap to Flip Prompt */}
              <div className="text-center pt-2 border-t border-slate-100 flex items-center justify-center gap-1.5 text-[12px] font-bold text-[#4f46e5]">
                <span className="material-symbols-outlined text-[16px]">sync</span>
                <span>{isFlipped ? 'Sentuh untuk lihat pertanyaan' : 'Sentuh kartu untuk lihat jawaban'}</span>
              </div>
            </div>

            {/* Answer feedback buttons */}
            <div className="grid grid-cols-2 gap-3 w-full mt-6">
              <button
                onClick={() => handleNext(false)}
                className="tactile-btn py-3 px-4 rounded-2xl bg-white border-2 border-[#CBD5E1] text-[#464555] font-bold text-[14px] flex items-center justify-center gap-1.5 shadow-[0_3px_0_0_#CBD5E1]"
                type="button"
              >
                <span className="material-symbols-outlined text-[18px] text-[#DC2626]">replay</span>
                <span>Belum Paham</span>
              </button>

              <button
                onClick={() => handleNext(true)}
                className="tactile-btn py-3 px-4 rounded-2xl bg-[#006c49] text-white font-bold text-[14px] flex items-center justify-center gap-1.5 shadow-[0_3px_0_0_#002113] hover:brightness-105"
                type="button"
              >
                <span className="material-symbols-outlined text-[18px]">check_circle</span>
                <span>Sudah Paham!</span>
              </button>
            </div>
          </div>
        ) : (
          /* Finished State */
          <div className="p-6 text-center space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-[#FEF3C7] text-[#D97706] border-2 border-[#F59E0B] flex items-center justify-center mx-auto shadow-[0_3px_0_0_#D97706]">
              <span className="material-symbols-outlined text-[36px] fill-icon">military_tech</span>
            </div>

            <h4 className="text-[20px] font-extrabold text-[#131b2e]">Latihan Flashcard Selesai!</h4>
            <p className="text-[14px] text-[#464555]">
              Hebat sekali Rian! Kamu berhasil memahami{' '}
              <strong className="text-[#006c49]">{understoodCount}</strong> dari {cards.length} kartu.
            </p>

            <div className="p-3 bg-[#EDE9FE] rounded-2xl border-2 border-[#4f46e5] text-[#3525cd] font-bold text-[15px] inline-flex items-center gap-2">
              <span className="material-symbols-outlined fill-icon text-[#F59E0B]">star</span>
              <span>Bonus +30 XP Berhasil Diklaim!</span>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-4">
              <button
                onClick={handleRestart}
                className="tactile-btn py-3 px-4 bg-white border-2 border-[#CBD5E1] text-[#131b2e] rounded-xl font-bold text-[14px] shadow-[0_2px_0_0_#CBD5E1]"
              >
                Ulangi Latihan
              </button>
              <button
                onClick={onClose}
                className="tactile-btn py-3 px-4 bg-[#4f46e5] text-white rounded-xl font-bold text-[14px] shadow-[0_3px_0_0_#3525cd]"
              >
                Kembali ke Modul
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
