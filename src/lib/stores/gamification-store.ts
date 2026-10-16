import {
  EMPTY_GAMIFICATION,
  type GamificationBackup,
} from "@mudahin/api/backup";
import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * Gamifikasi lokal — XP & rentetan harian.
 *
 * Sebelumnya XP hanya hidup di `useState` di `app.tsx`, sehingga hilang setiap
 * reload dan tidak pernah ikut cadangan. Store ini adalah cermin lokal dari
 * `gamification_state` di server (prosedur `progress.reward`/`progress.gamification`):
 * server tetap sumber kebenaran antar perangkat, tetapi nilai lokal membuat UI
 * langsung menampilkan XP/rentetan tanpa menunggu jaringan — termasuk saat luring.
 *
 * Perhitungan rentetan memakai logika murni `@mudahin/api/voice` agar aturan hari
 * kalender sama persis di klien dan server.
 */

/** Rentetan dimulai dari 1 hari begitu pengguna belajar pertama kali. */
export interface GamificationState extends GamificationBackup {
  reset: () => void;
  /** Menjumlahkan XP dan memperbarui rentetan untuk `today` (`YYYY-MM-DD`). */
  reward: (amount: number, today: string) => void;
  /** Menimpa keadaan lokal dengan nilai dari server / hasil pemulihan. */
  syncFrom: (value: GamificationBackup) => void;
}

export const useGamificationStore = create<GamificationState>()(
  persist(
    (set, get) => ({
      ...EMPTY_GAMIFICATION,

      reward: (amount, today) =>
        set(() => {
          const current = get();
          const { changedToday, lastActiveDate, streakDays } = nextStreakState(
            current,
            today
          );
          return {
            xp: Math.max(0, current.xp + amount),
            lastActiveDate,
            streakDays: changedToday ? streakDays : current.streakDays,
          };
        }),

      reset: () => set({ ...EMPTY_GAMIFICATION }),

      syncFrom: (value) =>
        set(() => ({
          xp: Math.max(0, value.xp),
          lastActiveDate: value.lastActiveDate,
          streakDays: Math.max(0, value.streakDays),
        })),
    }),
    {
      name: "mudahin-gamification",
      version: 1,
      // Hanya data gamifikasi yang dipersistenkan; fungsi tidak ikut disimpan.
      partialize: (state) => ({
        xp: state.xp,
        lastActiveDate: state.lastActiveDate,
        streakDays: state.streakDays,
      }),
    }
  )
);

/**
 * Perhitungan rentetan yang sama dengan server (`nextStreak`).
 *
 * Disalin lokal agar store ini tidak mengimpor modul server di bundel klien;
 * perilakunya dijaga identik lewat uji `scripts/verify-voice.ts`.
 */
function nextStreakState(
  current: GamificationBackup,
  today: string
): { changedToday: boolean; lastActiveDate: string; streakDays: number } {
  if (current.lastActiveDate === today) {
    return {
      changedToday: false,
      lastActiveDate: today,
      streakDays: Math.max(1, current.streakDays),
    };
  }

  const gap = current.lastActiveDate
    ? dayDifference(current.lastActiveDate, today)
    : Number.NaN;

  return {
    changedToday: true,
    lastActiveDate: today,
    streakDays: gap === 1 ? Math.max(1, current.streakDays) + 1 : 1,
  };
}

/** Selisih hari kalender antara dua tanggal `YYYY-MM-DD` (b − a). */
function dayDifference(from: string, to: string): number {
  const start = Date.parse(`${from}T00:00:00Z`);
  const end = Date.parse(`${to}T00:00:00Z`);
  if (Number.isNaN(start) || Number.isNaN(end)) {
    return Number.NaN;
  }
  return Math.round((end - start) / 86_400_000);
}
