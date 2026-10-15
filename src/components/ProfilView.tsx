import React from 'react';
import confetti from 'canvas-confetti';
import { soundEffects, speakText } from '../utils/audio';

interface ProfilViewProps {
  xp: number;
  streakDays: number;
  completedMissions: number;
  onClaimDailyBonus: () => void;
  canClaimBonus: boolean;
}

export const ProfilView: React.FC<ProfilViewProps> = ({
  xp,
  streakDays,
  completedMissions,
  onClaimDailyBonus,
  canClaimBonus,
}) => {
  const currentLevel = Math.floor(xp / 50) + 1;
  const currentLevelProgress = xp % 50;
  const levelProgressPct = Math.round((currentLevelProgress / 50) * 100);

  const daysOfWeek = [
    { day: 'Sen', active: true },
    { day: 'Sel', active: true },
    { day: 'Rab', active: true },
    { day: 'Kam', active: true },
    { day: 'Jum', active: true },
    { day: 'Sab', active: false },
    { day: 'Min', active: false },
  ];

  const badges = [
    {
      id: 'b1',
      title: 'Kutu Buku Santai',
      desc: 'Membaca materi dengan tempo fokus',
      icon: 'auto_stories',
      color: '#4f46e5',
      bg: '#EDE9FE',
      unlocked: true,
    },
    {
      id: 'b2',
      title: 'Penjelajah Suara',
      desc: 'Berani menjawab soal secara lisan',
      icon: 'mic',
      color: '#D97706',
      bg: '#FEF3C7',
      unlocked: true,
    },
    {
      id: 'b3',
      title: 'Master Kuis Adaptif',
      desc: 'Menuntaskan kuis 3 soal tanpa stres',
      icon: 'military_tech',
      color: '#006c49',
      bg: '#E8F8F0',
      unlocked: true,
    },
    {
      id: 'b4',
      title: 'Pemberani Catatan AI',
      desc: 'Mengolah catatan tulisan tangan',
      icon: 'auto_awesome',
      color: '#7E22CE',
      bg: '#F3E8FF',
      unlocked: true,
    },
  ];

  return (
    <main className="w-full max-w-xl mx-auto px-4 pt-4 space-y-5 pb-32">
      {/* Profile Card Header */}
      <section className="bg-white rounded-3xl p-5 border-2 border-[#4f46e5] shadow-[0_4px_0_0_#3525cd] space-y-4">
        <div className="flex items-center gap-3.5">
          <div className="w-16 h-16 rounded-2xl bg-[#4f46e5] text-white font-extrabold text-[26px] flex items-center justify-center border-4 border-[#faf8ff] shadow-[0_3px_0_0_#3525cd] shrink-0">
            R
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-[20px] font-extrabold text-[#131b2e] leading-tight truncate">
                Rian Pratama
              </h2>
              <span className="text-[11px] font-extrabold bg-[#eaedff] text-[#3525cd] px-2 py-0.5 rounded-md">
                Level {currentLevel}
              </span>
            </div>
            <p className="text-[13px] text-[#464555] font-medium mt-0.5">
              Pelajar Aktif • Ramah Belajar Santai
            </p>
          </div>
        </div>

        {/* Level Progress */}
        <div className="space-y-1.5 bg-[#f2f3ff] p-3 rounded-2xl border border-[#c7c4d8]">
          <div className="flex justify-between items-center text-[12px] font-bold">
            <span className="text-[#464555]">Progres ke Level {currentLevel + 1}</span>
            <span className="text-[#3525cd] font-extrabold">
              {currentLevelProgress} / 50 XP ({levelProgressPct}%)
            </span>
          </div>
          <div className="w-full h-3 bg-[#eaedff] rounded-full overflow-hidden border border-[#c7c4d8] p-0.5">
            <div
              className="h-full bg-[#4f46e5] rounded-full shadow-[0_1px_0_0_#3525cd] transition-all duration-300"
              style={{ width: `${levelProgressPct}%` }}
            ></div>
          </div>
        </div>
      </section>

      {/* Streak Calendar Card */}
      <section className="bg-gradient-to-r from-[#FEF3C7] to-[#FFFBEB] rounded-3xl p-4 sm:p-5 border-2 border-[#F59E0B] shadow-[0_4px_0_0_#D97706] space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-[#F59E0B] text-white flex items-center justify-center shadow-[0_2px_0_0_#D97706]">
              <span className="material-symbols-outlined text-[20px] fill-icon">local_fire_department</span>
            </div>
            <div>
              <h3 className="text-[16px] font-extrabold text-[#78350F]">
                Rentetan {streakDays} Hari Belajar!
              </h3>
              <span className="text-[12px] text-[#92400E] font-semibold">
                Konsisten belajar tanpa putus minggu ini
              </span>
            </div>
          </div>

          <span className="text-[12px] font-extrabold text-[#D97706] bg-white px-2.5 py-1 rounded-xl border border-[#F59E0B]">
            Hebat! 🔥
          </span>
        </div>

        {/* 7 Days tracker */}
        <div className="grid grid-cols-7 gap-1.5 pt-1">
          {daysOfWeek.map((d, idx) => (
            <div
              key={idx}
              className={`p-2 rounded-xl border text-center transition-all ${
                d.active
                  ? 'bg-white border-[#F59E0B] text-[#92400E] shadow-[0_2px_0_0_#D97706]'
                  : 'bg-white/50 border-[#F59E0B]/30 text-slate-400'
              }`}
            >
              <span className="block text-[11px] font-bold">{d.day}</span>
              <span
                className={`material-symbols-outlined text-[16px] mt-0.5 ${
                  d.active ? 'text-[#D97706] fill-icon' : 'text-slate-300'
                }`}
              >
                {d.active ? 'local_fire_department' : 'radio_button_unchecked'}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Badges Collection */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-[18px] font-extrabold text-[#131b2e] flex items-center gap-2">
            <span className="material-symbols-outlined text-[#3525cd]">workspace_premium</span>
            Lencana Prestasi Kamu
          </h3>
          <span className="text-[12px] font-bold text-[#464555]">{badges.length} Terbuka</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {badges.map((b) => (
            <div
              key={b.id}
              className="p-3.5 bg-white rounded-2xl border-2 border-[#c7c4d8] shadow-[0_3px_0_0_#cbd5e1] flex items-center gap-3"
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border"
                style={{ backgroundColor: b.bg, color: b.color, borderColor: b.color }}
              >
                <span className="material-symbols-outlined text-[24px] fill-icon">{b.icon}</span>
              </div>
              <div className="min-w-0">
                <h4 className="text-[14px] font-extrabold text-[#131b2e] truncate">{b.title}</h4>
                <p className="text-[12px] text-[#464555] font-medium leading-snug">{b.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Daily Bonus Claim Button if available */}
      {canClaimBonus && (
        <section className="p-4 bg-[#EDE9FE] border-2 border-[#4f46e5] rounded-2xl text-center space-y-2 shadow-[0_4px_0_0_#3525cd]">
          <h4 className="font-extrabold text-[#3525cd] text-[16px]">
            🎉 Misi Harianmu Sudah Lengkap!
          </h4>
          <p className="text-[13px] text-[#131b2e] font-medium">
            Klaim bonus tambahan +50 XP harian sebagai hadiah ketekunanmu.
          </p>
          <button
            onClick={() => {
              soundEffects.playSuccess();
              confetti({
                particleCount: 100,
                spread: 90,
                origin: { y: 0.6 },
              });
              onClaimDailyBonus();
            }}
            className="tactile-btn w-full py-3 px-4 bg-[#F59E0B] hover:brightness-105 active:brightness-95 text-white rounded-xl font-bold text-[14px] shadow-[0_3px_0_0_#B45309]"
          >
            Klaim Bonus +50 XP
          </button>
        </section>
      )}
    </main>
  );
};
