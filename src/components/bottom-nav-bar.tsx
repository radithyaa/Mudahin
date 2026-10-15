import type React from "react";
import { soundEffects } from "../utils/audio";

interface BottomNavBarProps {
  activeTab: "belajar" | "latihan" | "akses" | "profil";
  onChangeTab: (tab: "belajar" | "latihan" | "akses" | "profil") => void;
}

const TABS = [
  { id: "belajar", label: "Belajar", icon: "menu_book" },
  { id: "latihan", label: "Latihan", icon: "sports_esports" },
  { id: "akses", label: "Akses", icon: "accessibility_new" },
  { id: "profil", label: "Profil", icon: "person" },
] as const;

/**
 * Tab bar bawah — **selalu fixed & terlihat** di seluruh halaman.
 *
 * Setiap tab tampil sebagai *pill* yang dapat diketuk (menggabungkan label ke
 * dalam pill aktif) agar empat tab tetap muat di lebar layar ponsel tanpa
 * memicu gulir mendatar. Sudah memperhitungkan `safe-area-inset-bottom`
 * (home indicator iPhone / gesture bar Android).
 *
 * Bilah ini **selalu selebar layar** perangkat: tidak ada batas `max-w-xl` di
 * dalamnya, sehingga di tablet/desktop tombol tab tetap merentang penuh dan
 * tidak "menggantung" di tengah dengan sisa lebar kosong.
 */
export const BottomNavBar: React.FC<BottomNavBarProps> = ({
  activeTab,
  onChangeTab,
}) => (
  <nav
    aria-label="Navigasi utama"
    className="fixed inset-x-0 bottom-0 z-50 border-[#c7c4d8] border-t-2 bg-white/95 shadow-[0_-4px_0_0_#c7c4d8] backdrop-blur-md"
    style={{
      paddingBottom: "var(--safe-bottom)",
      paddingLeft: "var(--safe-left)",
      paddingRight: "var(--safe-right)",
    }}
  >
    <div className="flex h-16 w-full items-center justify-around gap-1 px-3 sm:px-4">
      {TABS.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            aria-current={isActive ? "page" : undefined}
            aria-label={tab.label}
            className={
              isActive
                ? "pill-active-nav flex h-12 min-w-0 flex-1 basis-0 cursor-pointer items-center justify-center gap-1.5 overflow-hidden rounded-2xl bg-[#4f46e5] px-2 font-bold text-white shadow-[0_3px_0_0_#3525cd]"
                : "flex h-12 min-w-0 flex-1 basis-0 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl text-[#464555] transition-colors hover:bg-[#eaedff] hover:text-[#131b2e]"
            }
            key={tab.id}
            onClick={() => {
              soundEffects.playTap();
              onChangeTab(tab.id);
            }}
            type="button"
          >
            <span
              className={`material-symbols-outlined text-[22px] ${isActive ? "fill-icon" : ""}`}
            >
              {tab.icon}
            </span>
            <span
              className={
                isActive
                  ? "whitespace-nowrap font-bold text-[12px] leading-none tracking-wide"
                  : "mt-0.5 whitespace-nowrap font-bold text-[12px] leading-none tracking-wide"
              }
            >
              {tab.label}
            </span>
          </button>
        );
      })}
    </div>
  </nav>
);
