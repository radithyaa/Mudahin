import type React from "react";
import { useEffect, useRef, useState } from "react";
import type { LearningModule } from "../types";
import { soundEffects, speakText, stopSpeech } from "../utils/audio";

interface AudioNarrationModalProps {
  module: LearningModule;
  onClose: () => void;
}

const AMBIENT_LABELS: Record<"off" | "rain" | "calm", string> = {
  off: "Hening",
  rain: "🌧️ Hujan",
  calm: "🍃 Alam",
};

const SPEED_LABELS: Record<number, string> = {
  0.75: "0.75x (Santai)",
  0.95: "1.0x (Normal)",
  1.15: "1.2x (Cepat)",
};

/** Kecepatan bicara berikutnya saat tombol kecepatan ditekan. */
function nextSpeed(current: number): number {
  if (current === 0.75) {
    return 0.95;
  }
  if (current === 0.95) {
    return 1.15;
  }
  return 0.75;
}

export const AudioNarrationModal: React.FC<AudioNarrationModalProps> = ({
  module,
  onClose,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeParagraphIndex, setActiveParagraphIndex] = useState(0);
  const [ambientSound, setAmbientSound] = useState<"off" | "rain" | "calm">(
    "off"
  );
  const [speed, setSpeed] = useState<number>(0.9);
  /** Menandai pemutaran yang sengaja diganti agar callback lama tidak menimpanya. */
  const playTokenRef = useRef(0);

  useEffect(
    () => () => {
      stopSpeech();
    },
    []
  );

  const { paragraphs } = module;

  /**
   * Membacakan berurutan dari paragraf `startIndex` sampai akhir secara mulus.
   *
   * Perbaikan kunci: sebelumnya pemutaran berhenti di paragraf terakhir karena
   * callback `onend` saling membatalkan `cancel()` pada antrean yang sama.
   * Kini tiap paragraf dibacakan berantai tanpa membatalkan antrean.
   */
  const playFrom = (startIndex: number) => {
    playTokenRef.current += 1;
    const token = playTokenRef.current;
    setIsPlaying(true);
    setActiveParagraphIndex(startIndex);

    const remaining = paragraphs.slice(startIndex).map((paragraph, offset) => ({
      index: startIndex + offset,
      text: `${paragraph.heading ?? ""}. ${paragraph.content}`,
    }));

    const readNext = (cursor: number) => {
      if (token !== playTokenRef.current) {
        return;
      }
      if (cursor >= remaining.length) {
        setIsPlaying(false);
        return;
      }
      const { index, text } = remaining[cursor];
      setActiveParagraphIndex(index);
      speakText(text, speed, () => readNext(cursor + 1));
    };

    readNext(0);
  };

  const handleTogglePlay = () => {
    soundEffects.playTap();
    if (isPlaying) {
      // Hentikan: token baru membuat callback paragraf berjalan berhenti.
      playTokenRef.current += 1;
      stopSpeech();
      setIsPlaying(false);
    } else {
      playFrom(activeParagraphIndex);
    }
  };

  const handlePrev = () => {
    soundEffects.playTap();
    const newIdx = Math.max(0, activeParagraphIndex - 1);
    playFrom(newIdx);
  };

  const handleNext = () => {
    soundEffects.playTap();
    const newIdx = Math.min(
      module.paragraphs.length - 1,
      activeParagraphIndex + 1
    );
    playFrom(newIdx);
  };

  return (
    <div className="dialog-layer dialog-layer--center">
      <div className="dialog-panel fade-in zoom-in-95 max-w-lg animate-in rounded-3xl border-2 border-[#4f46e5] bg-[#faf8ff] shadow-2xl duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-[#c7c4d8] border-b-2 bg-white p-4">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#4f46e5] bg-[#EDE9FE] text-[#4f46e5] shadow-[0_2px_0_0_#3525cd]">
              <span className="material-symbols-outlined text-[20px]">
                headphones
              </span>
            </div>
            <div>
              <span className="font-bold text-[#3525cd] text-[11px] uppercase tracking-wider">
                Dengarkan Bacaan Nyaring
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
              stopSpeech();
              soundEffects.playTap();
              onClose();
            }}
            type="button"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Ambient Noise Selector */}
        <div className="flex items-center justify-between border-[#c7c4d8] border-b bg-[#eaedff] px-4 py-2.5 font-bold text-[12px]">
          <span className="flex items-center gap-1 text-[#464555]">
            <span className="material-symbols-outlined text-[#3525cd] text-[16px]">
              nature
            </span>
            Suara Latar Penenang:
          </span>
          <div className="flex items-center gap-1">
            {(["off", "rain", "calm"] as const).map((mode) => (
              <button
                className={`rounded-lg border px-2.5 py-1 font-bold transition-all ${
                  ambientSound === mode
                    ? "border-[#3525cd] bg-[#3525cd] text-white"
                    : "border-[#c7c4d8] bg-white text-[#464555]"
                }`}
                key={mode}
                onClick={() => {
                  soundEffects.playTap();
                  setAmbientSound(mode);
                }}
                type="button"
              >
                {AMBIENT_LABELS[mode]}
              </button>
            ))}
          </div>
        </div>

        {/* Dynamic Display Card */}
        <div className="flex-1 overflow-y-auto p-5">
          <div className="mb-4 rounded-2xl border-2 border-[#4f46e5] bg-white p-4 shadow-[0_4px_0_0_#4f46e5]">
            <span className="mb-1 block font-extrabold text-[#3525cd] text-[11px] uppercase tracking-wider">
              {module.paragraphs[activeParagraphIndex]?.heading ||
                `Bagian ${activeParagraphIndex + 1}`}
            </span>
            <p className="font-semibold text-[#131b2e] text-[16px] leading-[26px]">
              {module.paragraphs[activeParagraphIndex]?.content}
            </p>
          </div>

          {/* Speed & Sentence Controls */}
          <div className="flex items-center justify-between px-1 font-bold text-[#464555] text-[12px]">
            <span>
              Bagian {activeParagraphIndex + 1} dari {module.paragraphs.length}
            </span>
            <div className="flex items-center gap-1">
              <span>Kecepatan:</span>
              <button
                className="rounded-md border border-[#c7c4d8] bg-[#eaedff] px-2 py-0.5 text-[#3525cd]"
                onClick={() => {
                  soundEffects.playTap();
                  setSpeed((prev) => nextSpeed(prev));
                }}
                type="button"
              >
                {SPEED_LABELS[speed]}
              </button>
            </div>
          </div>
        </div>

        {/* Player Controls Bar */}
        <div className="flex items-center justify-center gap-4 border-[#c7c4d8] border-t-2 bg-white p-4">
          <button
            className="tactile-btn rounded-2xl bg-[#eaedff] p-3 text-[#131b2e] disabled:opacity-40"
            disabled={activeParagraphIndex === 0}
            onClick={handlePrev}
            title="Paragraf Sebelumnya"
            type="button"
          >
            <span className="material-symbols-outlined text-[24px]">
              skip_previous
            </span>
          </button>

          <button
            className="tactile-btn flex h-14 w-14 items-center justify-center rounded-2xl bg-[#4f46e5] text-white shadow-[0_3px_0_0_#3525cd] hover:brightness-105"
            onClick={handleTogglePlay}
            title={isPlaying ? "Jeda" : "Putar"}
            type="button"
          >
            <span className="material-symbols-outlined fill-icon text-[32px]">
              {isPlaying ? "pause" : "play_arrow"}
            </span>
          </button>

          <button
            className="tactile-btn rounded-2xl bg-[#eaedff] p-3 text-[#131b2e] disabled:opacity-40"
            disabled={activeParagraphIndex === module.paragraphs.length - 1}
            onClick={handleNext}
            title="Paragraf Berikutnya"
            type="button"
          >
            <span className="material-symbols-outlined text-[24px]">
              skip_next
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
