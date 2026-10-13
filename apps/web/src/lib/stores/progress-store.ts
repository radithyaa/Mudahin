import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * Progres belajar — catatan materi yang sudah dibaca & dikerjakan kuisnya.
 *
 * Dipakai lintas fitur (hasil kuis menulis, Profil & Beranda membaca), sehingga
 * diletakkan di level global bersama Focus Profile.
 * Persistensi: Zustand `persist` → localStorage (tanpa server, sesuai SRS §4.5).
 */

export interface MaterialProgress {
  /** Skor terbaik kuis (0–100). */
  bestScore: number;
  /** Waktu (ISO) penyelesaian terakhir. */
  lastCompletedAt: string;
  materialId: string;
}

interface ProgressState {
  /** Tandai materi selesai dibaca (tanpa kuis). */
  markRead: (materialId: string) => void;
  /** Peta materialId → progres. */
  materials: Record<string, MaterialProgress>;
  readMaterials: string[];
  /** Catat hasil kuis; menyimpan skor terbaik. */
  recordQuiz: (materialId: string, score: number) => void;
  reset: () => void;
}

export const useProgressStore = create<ProgressState>()(
  persist(
    (set) => ({
      materials: {},
      readMaterials: [],

      markRead: (materialId) =>
        set((state) => {
          if (state.readMaterials.includes(materialId)) {
            return state;
          }
          return {
            ...state,
            readMaterials: [...state.readMaterials, materialId],
          };
        }),

      recordQuiz: (materialId, score) =>
        set((state) => {
          const previous = state.materials[materialId];
          const bestScore = Math.max(previous?.bestScore ?? 0, score);
          return {
            ...state,
            materials: {
              ...state.materials,
              [materialId]: {
                bestScore,
                lastCompletedAt: new Date().toISOString(),
                materialId,
              },
            },
            readMaterials: state.readMaterials.includes(materialId)
              ? state.readMaterials
              : [...state.readMaterials, materialId],
          };
        }),

      reset: () => set({ materials: {}, readMaterials: [] }),
    }),
    {
      name: "mudahin-progress",
      version: 1,
    }
  )
);
