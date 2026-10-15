import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { LearningModule } from '../types';
import { soundEffects, speakText, stopSpeech } from '../utils/audio';

interface FocusReaderModalProps {
  module: LearningModule;
  onClose: () => void;
  onCompleteReading: (moduleId: string) => void;
  fontSize: 'sm' | 'md' | 'lg' | 'xl';
  readingRulerActive: boolean;
  onToggleRuler: () => void;
  isWarmTheme: boolean;
  onToggleWarm: () => void;
}

export const FocusReaderModal: React.FC<FocusReaderModalProps> = ({
  module,
  onClose,
  onCompleteReading,
  fontSize: initialFontSize,
  readingRulerActive,
  onToggleRuler,
  isWarmTheme,
  onToggleWarm,
}) => {
  const [activeParagraphIndex, setActiveParagraphIndex] = useState(0);
  const [simplifiedMode, setSimplifiedMode] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [currentSize, setCurrentSize] = useState<'sm' | 'md' | 'lg' | 'xl'>(initialFontSize);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    return () => {
      stopSpeech();
    };
  }, []);

  const handlePlayCurrent = (index: number) => {
    setActiveParagraphIndex(index);
    const p = module.paragraphs[index];
    const textToRead = simplifiedMode ? p.simplified : p.content;

    soundEffects.playTap();
    setIsPlayingAudio(true);
    speakText(`${p.heading || ''}. ${textToRead}`, 0.95, () => {
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

  const handleFinish = () => {
    soundEffects.playSuccess();
    setCompleted(true);
    confetti({
      particleCount: 60,
      spread: 70,
      origin: { y: 0.6 },
    });
    onCompleteReading(module.id);
  };

  const getTextClass = () => {
    switch (currentSize) {
      case 'sm':
        return 'text-[14px] leading-relaxed';
      case 'lg':
        return 'text-[18px] leading-loose';
      case 'xl':
        return 'text-[21px] leading-loose';
      case 'md':
      default:
        return 'text-[16px] leading-[28px]';
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-center items-end sm:items-center p-0 sm:p-4 overflow-hidden">
      <div className="w-full max-w-xl bg-[#faf8ff] rounded-t-3xl sm:rounded-3xl border-2 border-[#4f46e5] shadow-2xl flex flex-col max-h-[92vh] h-full overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-200">
        {/* Sticky Header */}
        <div className="p-3.5 sm:p-4 bg-white border-b-2 border-[#c7c4d8] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-[#4f46e5] text-white flex items-center justify-center shrink-0 shadow-[0_2px_0_0_#3525cd]">
              <span className="material-symbols-outlined text-[20px]">chrome_reader_mode</span>
            </div>
            <div className="min-w-0">
              <span className="text-[11px] font-bold text-[#006c49] bg-[#E8F8F0] px-2 py-0.5 rounded-full inline-block">
                Focus Reader
              </span>
              <h3 className="text-[15px] font-extrabold text-[#131b2e] truncate">{module.title}</h3>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Font scale button */}
            <button
              onClick={() => {
                soundEffects.playTap();
                setCurrentSize((prev) => (prev === 'sm' ? 'md' : prev === 'md' ? 'lg' : prev === 'lg' ? 'xl' : 'md'));
              }}
              title="Ubah Ukuran Huruf"
              className="tactile-btn p-2 rounded-xl bg-[#eaedff] border border-[#c7c4d8] text-[#3525cd] text-[13px] font-extrabold flex items-center gap-0.5"
            >
              <span className="material-symbols-outlined text-[16px]">format_size</span>
              <span>A+</span>
            </button>

            {/* Reading ruler toggle */}
            <button
              onClick={() => {
                soundEffects.playTap();
                onToggleRuler();
              }}
              title="Garis Pembimbing Baca"
              className={`tactile-btn p-2 rounded-xl border flex items-center ${
                readingRulerActive
                  ? 'bg-[#FEF3C7] border-[#F59E0B] text-[#92400E]'
                  : 'bg-[#eaedff] border-[#c7c4d8] text-[#131b2e]'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">straighten</span>
            </button>

            {/* Warm theme toggle */}
            <button
              onClick={() => {
                soundEffects.playTap();
                onToggleWarm();
              }}
              title="Warna Hangat Mata Nyaman"
              className={`tactile-btn p-2 rounded-xl border flex items-center ${
                isWarmTheme
                  ? 'bg-[#FEF3C7] border-[#F59E0B] text-[#92400E]'
                  : 'bg-[#eaedff] border-[#c7c4d8] text-[#131b2e]'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">wb_incandescent</span>
            </button>

            {/* Close button */}
            <button
              onClick={() => {
                stopSpeech();
                soundEffects.playTap();
                onClose();
              }}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
              aria-label="Tutup Reader"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>
        </div>

        {/* Reader Sub-Bar: AI Simplification Switch & Audio Play */}
        <div className="bg-[#eaedff] px-4 py-2 border-b border-[#c7c4d8] flex items-center justify-between text-[13px]">
          <button
            onClick={() => {
              soundEffects.playTap();
              setSimplifiedMode(!simplifiedMode);
            }}
            className={`tactile-chip flex items-center gap-1.5 px-3 py-1 rounded-full font-bold transition-colors ${
              simplifiedMode
                ? 'bg-[#006c49] text-white shadow-[0_2px_0_0_#002113]'
                : 'bg-white text-[#131b2e] border border-[#c7c4d8]'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">
              {simplifiedMode ? 'check_circle' : 'auto_fix_high'}
            </span>
            <span>{simplifiedMode ? 'Mode Santai Aktif' : 'Teman AI: Buat Lebih Santai'}</span>
          </button>

          <button
            onClick={handleTogglePlayAll}
            className="tactile-chip flex items-center gap-1 px-3 py-1 bg-[#4f46e5] text-white rounded-full font-bold shadow-[0_2px_0_0_#3525cd]"
          >
            <span className="material-symbols-outlined text-[16px] fill-icon">
              {isPlayingAudio ? 'pause' : 'volume_up'}
            </span>
            <span>{isPlayingAudio ? 'Jeda Suara' : 'Dengarkan'}</span>
          </button>
        </div>

        {/* Reader Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {simplifiedMode && (
            <div className="p-3 bg-[#E8F8F0] border-2 border-[#006c49] rounded-2xl flex items-center gap-2.5 text-[#006c49] text-[13px] font-bold">
              <span className="material-symbols-outlined text-[20px]">lightbulb</span>
              <span>Paragraf dirangkum dalam kalimat pendek yang santai dan ramah fokus!</span>
            </div>
          )}

          {module.paragraphs.map((para, idx) => {
            const isActive = activeParagraphIndex === idx;
            return (
              <div
                key={para.id}
                onClick={() => setActiveParagraphIndex(idx)}
                className={`p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                  isActive
                    ? 'bg-white border-[#4f46e5] shadow-[0_4px_0_0_#4f46e5]'
                    : 'bg-white/70 border-[#c7c4d8] hover:border-[#4f46e5]/60 hover:bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-extrabold text-[#131b2e] text-[15px]">
                    {para.heading || `Bagian ${idx + 1}`}
                  </h4>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePlayCurrent(idx);
                    }}
                    title="Dengarkan bagian ini"
                    className="p-1.5 rounded-lg bg-[#eaedff] text-[#3525cd] hover:bg-[#4f46e5] hover:text-white transition-colors"
                  >
                    <span className="material-symbols-outlined text-[18px]">volume_up</span>
                  </button>
                </div>

                <p className={`${getTextClass()} text-[#131b2e] font-medium`}>
                  {simplifiedMode ? para.simplified : para.content}
                </p>

                {para.keywords && (
                  <div className="flex flex-wrap gap-1.5 mt-3 pt-2 border-t border-slate-100">
                    {para.keywords.map((kw, kidx) => (
                      <span
                        key={kidx}
                        className="px-2 py-0.5 rounded-md bg-[#eaedff] text-[#3525cd] text-[11px] font-bold"
                      >
                        #{kw}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Bottom Action Footer */}
        <div className="p-4 bg-white border-t-2 border-[#c7c4d8] flex items-center justify-between gap-3 shrink-0">
          <div className="text-[13px] text-[#464555] font-semibold">
            <span>Paragraf {activeParagraphIndex + 1} dari {module.paragraphs.length}</span>
          </div>

          <button
            onClick={handleFinish}
            disabled={completed}
            className={`tactile-btn px-5 py-3 rounded-2xl font-bold text-[14px] flex items-center gap-2 text-white ${
              completed
                ? 'bg-[#006c49] opacity-80 cursor-default'
                : 'bg-[#4f46e5] shadow-[0_3px_0_0_#3525cd] hover:brightness-105'
            }`}
          >
            <span className="material-symbols-outlined text-[18px] fill-icon">
              {completed ? 'check_circle' : 'stars'}
            </span>
            <span>{completed ? 'Sudah Selesai (+20 XP)' : 'Selesai Membaca (+20 XP)'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
