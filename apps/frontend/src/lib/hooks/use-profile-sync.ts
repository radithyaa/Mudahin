import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { FocusNeed } from "@/lib/stores/focus-profile";
import { useFocusProfile } from "@/lib/stores/focus-profile-store";

/**
 * Pencadangan profil ke server (FR-PRF-05 lanjutan).
 *
 * Profil aksesibilitas tetap disimpan lokal (offline-first). Untuk mencadangkan
 * preferensi agar dapat dipulihkan di perangkat lain, snapshot dikirim ke
 * prosedur `profile.save` diikat pada `syncId` acak per perangkat — bukan akun.
 * Inilah batas jujur MVP: sinkronisasi lintas perangkat berjalan lewat "kode
 * cadangan" yang dapat dimasukkan di perangkat lain, tanpa membangun
 * autentikasi multi-pengguna.
 */

/** Ringkasan preferensi yang disimpan di server (tanpa secret). */
export interface ProfileSnapshot {
  fontFamily: "default" | "dyslexic";
  fontSize: number;
  highContrast: boolean;
  letterSpacing: number;
  lineHeight: number;
  needs: string[];
  readingRuler: boolean;
  reduceMotion: boolean;
}

interface ProfileSyncState {
  /** Menghasilkan (atau memakai ulang) ID sinkronisasi lokal. */
  ensureSyncId: () => string;
  /** Waktu cadangan terakhir (ISO), null bila belum pernah. */
  lastSyncedAt: string | null;
  markSynced: () => void;
  setSyncId: (syncId: string) => void;
  /** ID sinkronisasi perangkat — dibuat sekali, dipakai sebagai kunci pemulihan. */
  syncId: string | null;
}

const SYNC_ID_STORAGE_KEY = "mudahin-profile-sync";

function createSyncId(): string {
  const random = Math.random().toString(36).slice(2, 8);
  return `${Date.now().toString(36)}${random}`;
}

export const useProfileSyncStore = create<ProfileSyncState>()(
  persist(
    (set, get) => ({
      syncId: null,
      lastSyncedAt: null,

      ensureSyncId: () => {
        const existing = get().syncId;
        if (existing) {
          return existing;
        }
        const created = createSyncId();
        set({ syncId: created });
        return created;
      },

      setSyncId: (syncId) => set({ syncId }),
      markSynced: () => set({ lastSyncedAt: new Date().toISOString() }),
    }),
    { name: SYNC_ID_STORAGE_KEY, version: 1 }
  )
);

/** Membaca preferensi profil saat ini sebagai snapshot ringkas. */
export function readProfileSnapshot(): ProfileSnapshot {
  const state = useFocusProfile.getState();
  return {
    fontFamily: state.fontFamily,
    fontSize: state.fontSize,
    highContrast: state.highContrast,
    letterSpacing: state.letterSpacing,
    lineHeight: state.lineHeight,
    needs: state.needs,
    readingRuler: state.readingRuler,
    reduceMotion: state.reduceMotion,
  };
}

/** Menerapkan snapshot yang dipulihkan ke profil lokal. */
export function applyProfileSnapshot(snapshot: ProfileSnapshot): void {
  const { setPreferences, setNeeds } = useFocusProfile.getState();
  setPreferences({
    fontFamily: snapshot.fontFamily,
    fontSize: snapshot.fontSize,
    highContrast: snapshot.highContrast,
    letterSpacing: snapshot.letterSpacing,
    lineHeight: snapshot.lineHeight,
    readingRuler: snapshot.readingRuler,
    reduceMotion: snapshot.reduceMotion,
  });
  setNeeds(snapshot.needs as FocusNeed[]);
}

/** Kode cadangan ringkas (aman dibagikan ke perangkat lain). */
export function formatSyncCode(syncId: string): string {
  return syncId.toUpperCase();
}
