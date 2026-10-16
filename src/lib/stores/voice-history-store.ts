import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * Catatan lokal materi yang pernah dilatih dengan suara.
 *
 * Server menyimpan riwayat lengkap (`progress.voiceHistory`), tetapi daftar
 * "materi mana yang bisa diulang" perlu tetap tersedia meski perangkat sedang
 * luring atau kueri belum selesai. Store ini hanya menyimpan id materi, sehingga
 * ringan dan aman dipersistenkan.
 *
 * Setiap id unik (tanpa duplikat) agar daftar tombol "Ulangi" tetap rapi.
 */

interface VoiceAttemptsState {
  /** Id materi yang pernah dilatik secara lisan, terbaru lebih dulu. */
  attemptedMaterialIds: string[];
  markAttempted: (materialId: string) => void;
  reset: () => void;
}

export const useVoiceAttemptsStore = create<VoiceAttemptsState>()(
  persist(
    (set) => ({
      attemptedMaterialIds: [],

      markAttempted: (materialId) =>
        set((state) => ({
          attemptedMaterialIds: state.attemptedMaterialIds.includes(materialId)
            ? state.attemptedMaterialIds
            : [materialId, ...state.attemptedMaterialIds].slice(0, 200),
        })),

      reset: () => set({ attemptedMaterialIds: [] }),
    }),
    {
      name: "mudahin-voice-attempts",
      version: 1,
    }
  )
);
