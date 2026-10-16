import {
  type AccessibilityBackup,
  type BackupSnapshot,
  type GamificationBackup,
  mergeBackupSnapshot,
  toBackupSnapshot,
} from "@mudahin/api/backup";
import { useMutation } from "@tanstack/react-query";
import { useCallback } from "react";

import { useDeviceIdentity } from "../stores/device-identity-store";
import { readProfileSnapshot } from "../stores/focus-profile-store";
import { trpc, trpcClient } from "../trpc";

/**
 * Cadangan perangkat & pemulihan lintas perangkat (tanpa akun).
 *
 * Model sederhana yang dipakai aplikasi ini:
 * 1. Semua orang mulai **dari nol** — data hidup lokal (localStorage/IndexedDB)
 *    dan dititipkan ke server dengan identitas perangkat acak.
 * 2. Tekan "Cadangkan Data Saya" → snapshot lengkap (setelan, pustaka, progres)
 *    dititipkan di server di bawah satu **kode cadangan**.
 * 3. Di perangkat baru, masukkan kode itu → seluruh data dipulihkan, dan sejak
 *    itu perangkat tersebut memakai kembali datanya sendiri di server.
 *
 * Identitas perangkat **tidak pernah** ditampilkan sebagai "kode"; kode
 * cadangan selalu dipilih pengguna sehingga mudah diingat & dibagikan.
 */

export interface RestoreResult {
  gamification: GamificationBackup;
  materials: number;
  progress: number;
  savedAt: string | null;
  settings: BackupSnapshot["accessibility"];
}

/** Menormalisasi kode cadangan: huruf kecil, tanpa spasi berlebih. */
export function normalizeSyncCode(raw: string): string {
  return raw.trim().toLowerCase();
}

/**
 * Menyiapkan data lokal lalu menitipkannya ke server di bawah satu kode.
 *
 * Materi & progres dibaca lewat `data.export` (server) agar cadangan tetap
 * lengkap walau cache luring di perangkat sedang kosong. `settings` (setelan
 * yang sedang aktif di UI) diutamakan karena store Focus Profile belum tentu
 * memuat `speechSpeed` — keduanya hidup lokal di perangkat ini.
 */
async function buildBackup(deviceId: string, settings?: AccessibilityBackup) {
  const accessibility = settings ?? readProfileSnapshot();
  const exported = await trpcClient.data.export.query({
    accessibility,
    deviceId,
  });

  return toBackupSnapshot({
    accessibility,
    gamification: exported.gamification,
    materials: exported.materials,
    progress: exported.progress,
    savedAt: null,
  });
}

export function useDeviceBackup() {
  const save = useMutation(trpc.backup.save.mutationOptions());
  const deviceId = useDeviceIdentity((state) => state.deviceId);
  const markSynced = useDeviceIdentity((state) => state.markSynced);
  const setRestoredFrom = useDeviceIdentity((state) => state.setRestoredFrom);

  /** Mengumpulkan seluruh data lokal lalu mengirimkannya sebagai cadangan. */
  const createBackup = useCallback(
    async (
      syncCode: string,
      settings?: AccessibilityBackup
    ): Promise<RestoreResult> => {
      const snapshot = await buildBackup(deviceId, settings);

      const result = await save.mutateAsync({
        snapshot,
        syncId: normalizeSyncCode(syncCode),
      });
      markSynced();

      return {
        gamification: snapshot.gamification,
        materials: result.materialCount,
        progress: result.progressCount,
        savedAt: result.updatedAt,
        settings: snapshot.accessibility,
      };
    },
    [deviceId, markSynced, save]
  );

  /**
   * Memulihkan data dari kode cadangan ke perangkat ini.
   *
   * Urutan penting: data ditulis ke server lebih dulu (`data.import`), baru
   * dilaporkan sukses — sehingga UI tidak pernah menampilkan data "terpulihkan"
   * yang sebenarnya gagal tersimpan.
   */
  const restoreBackup = useCallback(
    async (syncCode: string): Promise<RestoreResult | null> => {
      const syncId = normalizeSyncCode(syncCode);
      const result = await trpcClient.backup.load.query({ syncId });

      if (!(result.found && result.snapshot)) {
        return null;
      }

      const { snapshot } = result;

      await trpcClient.data.import.mutate({
        deviceId,
        gamification: snapshot.gamification,
        materials: snapshot.materials,
        progress: snapshot.progress,
      });

      // Perangkat ini kini memuat data cadangan: gabungkan snapshot dengan data
      // yang sudah ada agar tidak ada yang hilang, lalu simpan kembali agar
      // cadangan berikutnya tetap sinkron (idempoten).
      const local = await trpcClient.data.export.query({
        accessibility: snapshot.accessibility,
        deviceId,
      });
      const merged = mergeBackupSnapshot(
        { ...local, savedAt: result.savedAt },
        snapshot
      );

      await save.mutateAsync({ snapshot: toBackupSnapshot(merged), syncId });
      markSynced();
      setRestoredFrom(syncId);

      return {
        gamification: snapshot.gamification,
        materials: snapshot.materials.length,
        progress: snapshot.progress.length,
        savedAt: result.savedAt,
        settings: snapshot.accessibility,
      };
    },
    [deviceId, markSynced, save, setRestoredFrom]
  );

  return {
    createBackup,
    error: save.error,
    isSaving: save.isPending,
    restoreBackup,
  };
}
