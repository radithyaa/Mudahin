import { create } from "zustand";

import { DEVICE_ID, writeRestoredFrom } from "@/lib/offline/device-identity";

/**
 * Identitas perangkat (tanpa akun).
 *
 * Nilainya sendiri **tidak** lagi dipersistenkan lewat Zustand `persist`
 * (middleware itu memanggil `window.localStorage` saat store dibuat dan mati
 * permanen bila aksesnya melempar — itulah yang membuat `deviceId` tidak pernah
 * terisi di WebView ketat). Sumber kebenarannya sekarang
 * `lib/offline/device-identity.ts`, yang selalu mengembalikan id valid.
 *
 * Store ini tinggal menyimpan state turunan yang memang bersifat sesi/UI
 * (kapan terakhir dicadangkan, kode apa yang dipulihkan) dan meneruskan
 * `deviceId` dari modul tersebut agar komponen tetap bisa memantaunya.
 */

export const DEVICE_ID_STORAGE_KEY = "mudahin-device-id";

interface DeviceIdentityState {
  /** Identitas perangkat ini — selalu terisi, stabil selama aplikasi hidup. */
  deviceId: string;
  /** Waktu cadangan terakhir (ISO), null bila belum pernah. */
  lastSyncedAt: string | null;
  markSynced: () => void;
  /** Kode cadangan yang terakhir dipulihkan ke perangkat ini, bila ada. */
  restoredFrom: string | null;
  setRestoredFrom: (syncId: string) => void;
}

export const useDeviceIdentity = create<DeviceIdentityState>()((set) => ({
  // Dibaca sinkron dari modul identitas: bernilai valid sejak render pertama.
  deviceId: DEVICE_ID,

  lastSyncedAt: null,
  markSynced: () => set({ lastSyncedAt: new Date().toISOString() }),

  restoredFrom: null,
  setRestoredFrom: (syncId) => {
    writeRestoredFrom(syncId);
    set({ restoredFrom: syncId });
  },
}));
