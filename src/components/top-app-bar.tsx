import type React from "react";
import { soundEffects, speakText } from "../utils/audio";

interface TopAppBarProps {
  onOpenAccessibility: () => void;
  onOpenProfile: () => void;
  streakDays: number;
  xp: number;
}

/**
 * Navbar atas — **tidak sticky**.
 *
 * Bilah ini hanya berdiri di atas konten dan ikut tergulir bersama halaman;
 * yang selalu terlihat adalah tab bar bawah (`BottomNavBar`). Dengan begitu
 * area baca tidak termakan dua bilah sekaligus di layar kecil.
 *
 * Tampilan **identik di semua tab** (Belajar, Latihan, Akses, Profil): tanpa
 * judul aplikasi dan tanpa lencana khusus salah satu tab, agar navigasi terasa
 * konsisten. Logo tetap ditampilkan sebagai ikon identitas tanpa teks.
 *
 * Bilah ini **selalu selebar layar** perangkat (tanpa batas `max-w-xl` dan tanpa
 * `w-screen`, yang di WebView ber-scrollbar bisa sedikit melebihi area pandang).
 * Gabungan `w-full` + `max-w-full` + `overflow-x-hidden` pada `html/body`
 * memastikan bilah penuh ke tepi, namun tidak pernah memicu gulir mendatar.
 */
export const TopAppBar: React.FC<TopAppBarProps> = ({
  xp,
  streakDays,
  onOpenProfile,
  onOpenAccessibility,
}) => {
  const handleStreakClick = () => {
    soundEffects.playTap();
    speakText(
      streakDays > 0
        ? `Keren! Kamu sudah mengerjakan ${streakDays} materi berturut-turut!`
        : "Mulai kerjakan satu materi untuk menyalakan rentetanmu!"
    );
  };

  const handleXpClick = () => {
    soundEffects.playTap();
    speakText(`Kamu sudah mengumpulkan ${xp} poin pengalaman belajar!`);
  };

  return (
    <header className="w-full max-w-full shrink-0 border-[#c7c4d8] border-b-2 bg-[#faf8ff]/95 shadow-[0_4px_0_0_#c7c4d8] backdrop-blur-md">
      {/*
       * Ruang tepi kiri/kanan mengikuti area aman layar (bukan margin) supaya
       * latar bilah tetap rapat ke tepi layar, sekaligus menahan konten dari
       * notch / status bar / kamera punch-hole di bagian atas dan dari tepi saat
       * ponsel dirotasi mendatar. Di desktop semua nilainya 0.
       */}
      <div
        className="flex h-16 w-full max-w-full items-center justify-between gap-2 px-3 sm:px-4"
        style={{
          paddingLeft: "calc(0.75rem + var(--safe-left))",
          paddingRight: "calc(0.75rem + var(--safe-right))",
          paddingTop: "var(--safe-top)",
          height: "calc(4rem + var(--safe-top))",
        }}
      >
        {/* Logo ikon — tanpa judul aplikasi agar bilah tetap seragam & ringkas. */}
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-[#4f46e5] text-white shadow-[0_3px_0_0_#3525cd]">
          <span className="material-symbols-outlined fill-icon text-[24px]">
            local_fire_department
          </span>
        </div>

        {/* Lencana gamifikasi & pintasan aksesibilitas — sama di semua tab */}
        <div className="flex shrink-0 items-center gap-1.5">
          <button
            className="tactile-chip flex h-9 shrink-0 items-center gap-1 rounded-full border-2 border-[#F59E0B] bg-[#FEF3C7] px-2.5 font-bold text-[#92400E] text-[12px] shadow-[0_2px_0_0_#D97706]"
            onClick={handleStreakClick}
            title="Lihat Rentetan Belajar"
            type="button"
          >
            <span className="material-symbols-outlined fill-icon text-[#D97706] text-[16px]">
              local_fire_department
            </span>
            <span className="whitespace-nowrap">{streakDays} Hari</span>
          </button>

          {/* XP — hanya angka agar tetap muat di navbar sempit */}
          <button
            className="tactile-chip flex h-9 shrink-0 items-center gap-1 rounded-full border-2 border-[#4f46e5] bg-[#EDE9FE] px-2.5 font-bold text-[#3525cd] text-[12px] shadow-[0_2px_0_0_#3525cd]"
            onClick={handleXpClick}
            title={`Total ${xp} XP kamu`}
            type="button"
          >
            <span className="material-symbols-outlined fill-icon text-[#F59E0B] text-[16px]">
              star
            </span>
            <span className="whitespace-nowrap">{xp} XP</span>
          </button>

          {/* Pintasan cepat: profil + pengaturan aksesibilitas (sheet) */}
          <div className="flex shrink-0 items-center gap-1 rounded-full bg-[#eaedff] p-1">
            <button
              aria-label="Buka Profil"
              className="rounded-full focus:outline-none focus:ring-2 focus:ring-[#3525cd]"
              onClick={() => {
                soundEffects.playTap();
                onOpenProfile();
              }}
              type="button"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-[#4f46e5] font-bold text-[13px] text-white shadow-sm">
                M
              </div>
            </button>
            <button
              aria-label="Buka Pengaturan Aksesibilitas"
              className="material-symbols-outlined pr-0.5 text-[#3525cd] text-[20px] transition-transform hover:rotate-45 focus:outline-none focus:ring-2 focus:ring-[#3525cd]"
              onClick={() => {
                soundEffects.playTap();
                onOpenAccessibility();
              }}
              title="Buka Pengaturan Aksesibilitas"
              type="button"
            >
              tune
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
