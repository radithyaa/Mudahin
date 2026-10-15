import React, { useState, useEffect } from 'react';
import { LearningModule } from '../types';
import { soundEffects, speakText, stopSpeech } from '../utils/audio';

interface AudioNarrationModalProps {
  module: LearningModule;
  onClose: () => void;
}

export const AudioNarrationModal: React.FC<AudioNarrationModalProps> = ({ module, onClose }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeParagraphIndex, setActiveParagraphIndex] = useState(0);
  const [ambientSound, setAmbientSound] = useState<'off' | 'rain' | 'calm'>('off');
  const [speed, setSpeed] = useState<number>(0.9);

  useEffect(() => {
    return () => {
      stopSpeech();
    };
  }, []);

  const playParagraph = (idx: number) => {
    setActiveParagraphIndex(idx);
    setIsPlaying(true);
    const p = module.paragraphs[idx];
    const text = `${p.heading || ''}. ${p.content}`;

    speakText(text, speed, () => {
      if (idx + 1 < module.paragraphs.length) {
        playParagraph(idx + 1);
      } else {
        setIsPlaying(false);
      }
    });
  };

  const handleTogglePlay = () => {
    soundEffects.playTap();
    if (isPlaying) {
      stopSpeech();
      setIsPlaying(false);
    } else {
      playParagraph(activeParagraphIndex);
    }
  };

  const handlePrev = () => {
    soundEffects.playTap();
    stopSpeech();
    const newIdx = Math.max(0, activeParagraphIndex - 1);
    playParagraph(newIdx);
  };

  const handleNext = () => {
    soundEffects.playTap();
    stopSpeech();
    const newIdx = Math.min(module.paragraphs.length - 1, activeParagraphIndex + 1);
    playParagraph(newIdx);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-center items-center p-4">
      <div className="w-full max-w-lg bg-[#faf8ff] rounded-3xl border-2 border-[#4f46e5] shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 bg-white border-b-2 border-[#c7c4d8] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-[#EDE9FE] text-[#4f46e5] border border-[#4f46e5] flex items-center justify-center shadow-[0_2px_0_0_#3525cd]">
              <span className="material-symbols-outlined text-[20px]">headphones</span>
            </div>
            <div>
              <span className="text-[11px] font-bold text-[#3525cd] uppercase tracking-wider">
                Dengarkan Bacaan Nyaring
              </span>
              <h3 className="text-[15px] font-extrabold text-[#131b2e] leading-tight truncate">
                {module.title}
              </h3>
            </div>
          </div>

          <button
            onClick={() => {
              stopSpeech();
              soundEffects.playTap();
              onClose();
            }}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
            aria-label="Tutup"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Ambient Noise Selector */}
        <div className="px-4 py-2.5 bg-[#eaedff] border-b border-[#c7c4d8] flex items-center justify-between text-[12px] font-bold">
          <span className="text-[#464555] flex items-center gap-1">
            <span className="material-symbols-outlined text-[16px] text-[#3525cd]">nature</span>
            Suara Latar Penenang:
          </span>
          <div className="flex items-center gap-1">
            {(['off', 'rain', 'calm'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => {
                  soundEffects.playTap();
                  setAmbientSound(mode);
                }}
                className={`px-2.5 py-1 rounded-lg border font-bold transition-all ${
                  ambientSound === mode
                    ? 'bg-[#3525cd] text-white border-[#3525cd]'
                    : 'bg-white text-[#464555] border-[#c7c4d8]'
                }`}
              >
                {mode === 'off' ? 'Hening' : mode === 'rain' ? '🌧️ Hujan' : '🍃 Alam'}
              </button>
            ))}
          </div>
        </div>

        {/* Dynamic Display Card */}
        <div className="p-5 flex-1 overflow-y-auto">
          <div className="p-4 rounded-2xl bg-white border-2 border-[#4f46e5] shadow-[0_4px_0_0_#4f46e5] mb-4">
            <span className="text-[11px] font-extrabold text-[#3525cd] uppercase tracking-wider block mb-1">
              {module.paragraphs[activeParagraphIndex]?.heading || `Bagian ${activeParagraphIndex + 1}`}
            </span>
            <p className="text-[16px] leading-[26px] font-semibold text-[#131b2e]">
              {module.paragraphs[activeParagraphIndex]?.content}
            </p>
          </div>

          {/* Speed & Sentence Controls */}
          <div className="flex items-center justify-between px-1 text-[12px] font-bold text-[#464555]">
            <span>
              Bagian {activeParagraphIndex + 1} dari {module.paragraphs.length}
            </span>
            <div className="flex items-center gap-1">
              <span>Kecepatan:</span>
              <button
                onClick={() => {
                  soundEffects.playTap();
                  setSpeed((prev) => (prev === 0.75 ? 0.95 : prev === 0.95 ? 1.15 : 0.75));
                }}
                className="px-2 py-0.5 rounded-md bg-[#eaedff] text-[#3525cd] border border-[#c7c4d8]"
              >
                {speed === 0.75 ? '0.75x (Santai)' : speed === 0.95 ? '1.0x (Normal)' : '1.2x (Cepat)'}
              </button>
            </div>
          </div>
        </div>

        {/* Player Controls Bar */}
        <div className="p-4 bg-white border-t-2 border-[#c7c4d8] flex items-center justify-center gap-4">
          <button
            onClick={handlePrev}
            disabled={activeParagraphIndex === 0}
            className="p-3 rounded-2xl bg-[#eaedff] text-[#131b2e] disabled:opacity-40 tactile-btn"
            title="Paragraf Sebelumnya"
          >
            <span className="material-symbols-outlined text-[24px]">skip_previous</span>
          </button>

          <button
            onClick={handleTogglePlay}
            className="w-14 h-14 rounded-2xl bg-[#4f46e5] text-white flex items-center justify-center shadow-[0_3px_0_0_#3525cd] tactile-btn hover:brightness-105"
            title={isPlaying ? 'Jeda' : 'Putar'}
          >
            <span className="material-symbols-outlined text-[32px] fill-icon">
              {isPlaying ? 'pause' : 'play_arrow'}
            </span>
          </button>

          <button
            onClick={handleNext}
            disabled={activeParagraphIndex === module.paragraphs.length - 1}
            className="p-3 rounded-2xl bg-[#eaedff] text-[#131b2e] disabled:opacity-40 tactile-btn"
            title="Paragraf Berikutnya"
          >
            <span className="material-symbols-outlined text-[24px]">skip_next</span>
          </button>
        </div>
      </div>
    </div>
  );
};
