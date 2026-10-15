import React from 'react';
import { soundEffects, speakText } from '../utils/audio';

interface TopAppBarProps {
  activeTab: 'belajar' | 'latihan' | 'akses' | 'profil';
  xp: number;
  streakDays: number;
  onOpenProfile: () => void;
  onOpenAkses: () => void;
}

export const TopAppBar: React.FC<TopAppBarProps> = ({
  activeTab,
  xp,
  streakDays,
  onOpenProfile,
  onOpenAkses,
}) => {
  const isLatihan = activeTab === 'latihan';

  const handleStreakClick = () => {
    soundEffects.playTap();
    speakText(`Keren Rian! Kamu sudah konsisten belajar ${streakDays} hari berturut-turut!`);
  };

  const handleXpClick = () => {
    soundEffects.playTap();
    speakText(`Kamu sudah mengumpulkan ${xp} poin pengalaman belajar!`);
  };

  return (
    <header className="sticky top-0 z-40 bg-[#faf8ff]/95 backdrop-blur-md border-b-2 border-[#c7c4d8] shadow-[0_4px_0_0_#c7c4d8]">
      <div className="flex justify-between items-center w-full px-4 max-w-xl mx-auto h-16">
        {/* Brand Logo / Headline */}
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-[#4f46e5] text-white flex items-center justify-center shadow-[0_3px_0_0_#3525cd] flex-shrink-0">
            <span className="material-symbols-outlined fill-icon text-[24px]">local_fire_department</span>
          </div>
          <div>
            <h1 className="text-[22px] font-extrabold text-[#3525cd] tracking-tight leading-none">Mudahin</h1>
            {isLatihan && (
              <span className="text-[12px] text-[#464555] font-semibold block leading-tight">
                Pusat Latihan Asyik
              </span>
            )}
          </div>
        </div>

        {/* Gamification & Profile Bar */}
        <div className="flex items-center gap-2">
          {isLatihan ? (
            /* Target Badge in Latihan View */
            <div className="h-9 px-3 rounded-full bg-[#eaedff] border-2 border-[#c7c4d8] flex items-center gap-1.5 shadow-[0_2px_0_0_#c7c4d8]">
              <span className="material-symbols-outlined text-[#006c49] text-[18px] fill-icon">track_changes</span>
              <span className="text-[13px] font-extrabold text-[#131b2e]">2/3</span>
            </div>
          ) : (
            /* Streak Chip in Belajar View */
            <button
              onClick={handleStreakClick}
              title="Lihat Rentetan Belajar"
              className="tactile-chip flex items-center gap-1 bg-[#FEF3C7] border-2 border-[#F59E0B] text-[#92400E] px-2.5 py-1 rounded-full text-[12px] font-bold shadow-[0_2px_0_0_#D97706]"
              type="button"
            >
              <span className="material-symbols-outlined text-[16px] text-[#D97706] fill-icon">
                local_fire_department
              </span>
              <span>{streakDays} Hari</span>
            </button>
          )}

          {/* XP Chip */}
          <button
            onClick={handleXpClick}
            title="Total XP Kamu"
            className="tactile-chip flex items-center gap-1 bg-[#EDE9FE] border-2 border-[#4f46e5] text-[#3525cd] px-2.5 py-1 rounded-full text-[12px] font-bold shadow-[0_2px_0_0_#3525cd]"
            type="button"
          >
            <span className="material-symbols-outlined text-[16px] text-[#F59E0B] fill-icon">star</span>
            <span>{xp} XP</span>
          </button>

          {/* Profile Avatar & Accessibility Quick Switch */}
          <button
            onClick={() => {
              soundEffects.playTap();
              onOpenProfile();
            }}
            aria-label="Profil Rian Level 4 dan Pengaturan Akses"
            className="flex items-center gap-1.5 p-1 rounded-full bg-[#eaedff] hover:bg-[#e2e7ff] transition-colors focus:outline-none focus:ring-2 focus:ring-[#3525cd]"
            type="button"
          >
            <div className="w-8 h-8 rounded-full bg-[#4f46e5] text-white font-bold text-[13px] flex items-center justify-center border-2 border-white shadow-sm">
              R
            </div>
            <span
              onClick={(e) => {
                e.stopPropagation();
                soundEffects.playTap();
                onOpenAkses();
              }}
              className="material-symbols-outlined text-[#3525cd] text-[20px] pr-0.5 hover:rotate-45 transition-transform"
              title="Buka Pengaturan Aksesibilitas"
            >
              tune
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};
