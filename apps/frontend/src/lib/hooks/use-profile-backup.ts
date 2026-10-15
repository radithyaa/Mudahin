import { useMutation } from "@tanstack/react-query";
import {
  fromProfileSnapshot,
  toProfileSnapshot,
  type UiAccessibilitySettings,
} from "../api/profile";
import { trpc, trpcClient } from "../trpc";

/**
 * Cadangan profil lintas perangkat lewat "kode cadangan" (`syncId`) — tanpa akun.
 *
 * `save` menyimpan snapshot setelan (mutasi). `loadSettings` memanggil
 * `profile.load` imperatif lewat klien tRPC dan mengubahnya kembali jadi
 * setelan UI. Keduanya aman dipanggil dari event handler.
 */
export function useProfileBackup() {
  const save = useMutation(trpc.profile.save.mutationOptions());

  const saveSettings = (syncId: string, settings: UiAccessibilitySettings) =>
    save.mutateAsync({ syncId, snapshot: toProfileSnapshot(settings) });

  const loadSettings = async (
    syncId: string
  ): Promise<UiAccessibilitySettings | null> => {
    const result = await trpcClient.profile.load.query({ syncId });
    if (!(result.found && result.snapshot)) {
      return null;
    }
    return fromProfileSnapshot(result.snapshot);
  };

  return {
    saveSettings,
    loadSettings,
    isSaving: save.isPending,
    error: save.error,
  };
}
