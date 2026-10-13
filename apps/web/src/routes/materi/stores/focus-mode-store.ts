import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * Mode Fokus — pengalaman baca imersif (label baca ramah ADHD).
 *
 * Saat aktif, satu blok teks ditampilkan pada satu waktu dengan tipografi
 * besar dan jeda antar-blok. Preferensi persist agar pilihan siswa diingat.
 * Ini fitur presentasi murni di sisi klien; tidak menambah beban server.
 */
interface FocusModeState {
  index: number;
  isActive: boolean;
  setActive: (active: boolean) => void;
  /** Indeks blok/paragraf yang sedang ditampilkan (berbasis 0). */
  setIndex: (index: number) => void;
  /** Kata per tampilan blok saat mode fokus. */
  setWordsPerBlock: (count: number) => void;
  toggle: () => void;
  wordsPerBlock: number;
}

export const FOCUS_MODE_WORDS_MIN = 3;
export const FOCUS_MODE_WORDS_MAX = 12;
export const FOCUS_MODE_WORDS_DEFAULT = 6;

export const useFocusModeStore = create<FocusModeState>()(
  persist(
    (set) => ({
      isActive: false,
      index: 0,
      wordsPerBlock: FOCUS_MODE_WORDS_DEFAULT,

      setActive: (isActive) => set({ isActive, index: 0 }),
      toggle: () => set((state) => ({ isActive: !state.isActive, index: 0 })),
      setIndex: (index) => set({ index }),
      setWordsPerBlock: (wordsPerBlock) => set({ wordsPerBlock, index: 0 }),
    }),
    {
      name: "mudahin-focus-mode",
      version: 1,
      partialize: (state) => ({
        isActive: state.isActive,
        wordsPerBlock: state.wordsPerBlock,
      }),
    }
  )
);
