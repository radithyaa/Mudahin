import type { FocusProfileId } from "@mudahin/api/schemas";
import confetti from "canvas-confetti";
import { useEffect, useState } from "react";

import { moduleToText, toFlashcards } from "../lib/api/ai";
import { useAi } from "../lib/hooks/use-ai";
import type { Flashcard, LearningModule } from "../types";
import { soundEffects, speakText } from "../utils/audio";

interface FlashcardModalProps {
  focusProfile?: FocusProfileId;
  module: LearningModule;
  onClose: () => void;
  onComplete: (xpGained: number) => void;
}

/**
 * Kartu Belajar (FR-LEA-04).
 *
 * Materi pustaka belum punya kartu, jadi dek dibuat **lazy** via
 * `ai.flashcards` saat modal dibuka (server men-cache hasilnya di D1).
 */
export const FlashcardModal: React.FC<FlashcardModalProps> = ({
  module,
  onClose,
  onComplete,
  focusProfile,
}) => {
  const ai = useAi();
  const [cards, setCards] = useState<Flashcard[]>(module.flashcards);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [understoodCount, setUnderstoodCount] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  /** Membuat dek kartu dari materi lewat DeepSeek bila belum ada. */
  const loadCards = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const deck = await ai.flashcards.mutateAsync({
        text: moduleToText(module),
        profile: focusProfile,
      });
      setCards(toFlashcards(deck.cards));
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Gagal membuat kartu belajar. Coba lagi."
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Muat dek kartu sekali per modul (module.flashcards tidak pernah berubah).
  // biome-ignore lint/correctness/useExhaustiveDependencies: sengaja memuat ulang hanya saat modul berganti.
  useEffect(() => {
    if (module.flashcards.length > 0) {
      setCards(module.flashcards);
      return;
    }
    loadCards().catch(() => undefined);
  }, [module.id]);

  const currentCard = cards[currentIndex];

  const handleFlip = () => {
    soundEffects.playFlip();
    setIsFlipped(!isFlipped);
  };

  const handleSpeak = (event: React.MouseEvent) => {
    event.stopPropagation();
    if (!currentCard) {
      return;
    }
    soundEffects.playTap();
    speakText(isFlipped ? currentCard.answer : currentCard.question);
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
      confetti({ particleCount: 75, spread: 80, origin: { y: 0.6 } });
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
    <div className="dialog-layer dialog-layer--center">
      <div className="dialog-panel fade-in zoom-in-95 max-w-lg animate-in rounded-3xl border-2 border-[#4f46e5] bg-[#faf8ff] shadow-2xl duration-200">
        <div className="flex items-center justify-between border-[#c7c4d8] border-b-2 bg-white p-4">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#4f46e5] text-white shadow-[0_2px_0_0_#3525cd]">
              <span className="material-symbols-outlined text-[20px]">
                style
              </span>
            </div>
            <div>
              <span className="font-bold text-[#3525cd] text-[11px] uppercase tracking-wider">
                Kartu Tanya Jawab
              </span>
              <h3 className="truncate font-extrabold text-[#131b2e] text-[15px] leading-tight">
                {module.title}
              </h3>
            </div>
          </div>

          <button
            aria-label="Tutup Flashcard"
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
            <span className="material-symbols-outlined inline-block animate-spin text-[#4f46e5] text-[36px]">
              auto_awesome
            </span>
            <p className="font-bold text-[#131b2e] text-[14px]">
              Teman AI sedang membuat kartu belajar…
            </p>
          </div>
        ) : null}

        {!isLoading && error && (
          <div className="space-y-4 p-6 text-center">
            <div className="rounded-2xl border-2 border-[#F59E0B] bg-[#FEF3C7] p-3.5 font-semibold text-[#92400E] text-[13px]">
              {error}
            </div>
            <button
              className="tactile-btn rounded-xl bg-[#4f46e5] px-4 py-3 font-bold text-[14px] text-white shadow-[0_3px_0_0_#3525cd]"
              onClick={() => loadCards()}
              type="button"
            >
              Coba Lagi
            </button>
          </div>
        )}

        {!(isLoading || error) && cards.length === 0 && (
          <div className="p-8 text-center font-semibold text-[#464555] text-[14px]">
            Belum ada kartu untuk materi ini.
          </div>
        )}

        {!(isLoading || error) && cards.length > 0 && !isFinished && (
          <div className="flex min-h-0 flex-1 flex-col items-center overflow-y-auto overscroll-contain p-5">
            <div className="mb-2 flex w-full items-center justify-between font-bold text-[#464555] text-[12px]">
              <span>
                Kartu {currentIndex + 1} dari {cards.length}
              </span>
              <span className="text-[#006c49]">Paham: {understoodCount}</span>
            </div>

            <div className="mb-5 h-2.5 w-full overflow-hidden rounded-full border border-[#c7c4d8] bg-[#eaedff]">
              <div
                className="h-full bg-[#4f46e5] transition-all duration-300"
                style={{
                  width: `${((currentIndex + 1) / cards.length) * 100}%`,
                }}
              />
            </div>

            <button
              className="flex min-h-[220px] w-full cursor-pointer select-none flex-col justify-between rounded-3xl border-2 border-[#4f46e5] bg-white p-6 text-left shadow-[0_6px_0_0_#4f46e5] transition-transform hover:brightness-[1.02] active:scale-[0.99] sm:min-h-[250px]"
              onClick={handleFlip}
              type="button"
            >
              <div className="flex w-full items-center justify-between">
                <span className="rounded-full bg-[#eaedff] px-2.5 py-0.5 font-bold text-[#3525cd] text-[11px]">
                  {currentCard.category}
                </span>

                <div className="flex items-center gap-2">
                  {/* biome-ignore lint/a11y/useSemanticElements: tombol suara berada di dalam kartu yang juga sebuah <button> sehingga tidak boleh menjadi <button> bersarang. */}
                  <span
                    className="rounded-lg border border-[#F59E0B] bg-[#FEF3C7] p-1.5 text-[#92400E] hover:bg-[#FDE68A]"
                    onClick={handleSpeak}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        handleSpeak(event as unknown as React.MouseEvent);
                      }
                    }}
                    role="button"
                    tabIndex={0}
                    title="Dengarkan suara"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      volume_up
                    </span>
                  </span>
                  <span className="font-bold text-[#464555] text-[11px]">
                    {isFlipped ? "Jawaban" : "Pertanyaan"}
                  </span>
                </div>
              </div>

              <div className="my-auto py-4 text-center">
                <p className="font-extrabold text-[#131b2e] text-[17px] leading-snug sm:text-[19px]">
                  {isFlipped ? currentCard.answer : currentCard.question}
                </p>
                {!isFlipped && currentCard.hint && (
                  <p className="mt-3 inline-block rounded-full bg-[#E8F8F0] px-3 py-1 font-medium text-[#006c49] text-[12px]">
                    💡 Petunjuk: {currentCard.hint}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-center gap-1.5 border-slate-100 border-t pt-2 text-center font-bold text-[#4f46e5] text-[12px]">
                <span className="material-symbols-outlined text-[16px]">
                  sync
                </span>
                <span>
                  {isFlipped
                    ? "Sentuh untuk lihat pertanyaan"
                    : "Sentuh kartu untuk lihat jawaban"}
                </span>
              </div>
            </button>

            <div className="mt-6 grid w-full grid-cols-2 gap-3">
              <button
                className="tactile-btn flex items-center justify-center gap-1.5 rounded-2xl border-2 border-[#CBD5E1] bg-white px-4 py-3 font-bold text-[#464555] text-[14px] shadow-[0_3px_0_0_#CBD5E1]"
                onClick={() => handleNext(false)}
                type="button"
              >
                <span className="material-symbols-outlined text-[#DC2626] text-[18px]">
                  replay
                </span>
                <span>Belum Paham</span>
              </button>

              <button
                className="tactile-btn flex items-center justify-center gap-1.5 rounded-2xl bg-[#006c49] px-4 py-3 font-bold text-[14px] text-white shadow-[0_3px_0_0_#002113] hover:brightness-105"
                onClick={() => handleNext(true)}
                type="button"
              >
                <span className="material-symbols-outlined text-[18px]">
                  check_circle
                </span>
                <span>Sudah Paham!</span>
              </button>
            </div>
          </div>
        )}

        {!(isLoading || error) && isFinished && (
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain p-6 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl border-2 border-[#F59E0B] bg-[#FEF3C7] text-[#D97706] shadow-[0_3px_0_0_#D97706]">
              <span className="material-symbols-outlined fill-icon text-[36px]">
                military_tech
              </span>
            </div>

            <h4 className="font-extrabold text-[#131b2e] text-[20px]">
              Latihan Flashcard Selesai!
            </h4>
            <p className="text-[#464555] text-[14px]">
              Hebat! Kamu berhasil memahami{" "}
              <strong className="text-[#006c49]">{understoodCount}</strong> dari{" "}
              {cards.length} kartu.
            </p>

            <div className="inline-flex items-center gap-2 rounded-2xl border-2 border-[#4f46e5] bg-[#EDE9FE] p-3 font-bold text-[#3525cd] text-[15px]">
              <span className="material-symbols-outlined fill-icon text-[#F59E0B]">
                star
              </span>
              <span>Bonus +30 XP Berhasil Diklaim!</span>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-4">
              <button
                className="tactile-btn rounded-xl border-2 border-[#CBD5E1] bg-white px-4 py-3 font-bold text-[#131b2e] text-[14px] shadow-[0_2px_0_0_#CBD5E1]"
                onClick={handleRestart}
                type="button"
              >
                Ulangi Latihan
              </button>
              <button
                className="tactile-btn rounded-xl bg-[#4f46e5] px-4 py-3 font-bold text-[14px] text-white shadow-[0_3px_0_0_#3525cd]"
                onClick={onClose}
                type="button"
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
