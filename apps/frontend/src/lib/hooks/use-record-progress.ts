import { useMutation } from "@tanstack/react-query";
import { useCallback } from "react";

import { trpc } from "../trpc";

/**
 * Menyimpan progres ke server (FR-PRF-05) sebagai lapisan opsional.
 *
 * State lokal (Zustand + localStorage) tetap menjadi sumber utama agar
 * aplikasi berfungsi tanpa jaringan (SRS §4.5); panggilan server bersifat
 * best-effort — kegagalannya diabaikan dan tidak pernah menggagalkan UI.
 */
export function useRecordProgress() {
  const { mutate } = useMutation(trpc.progress.record.mutationOptions());

  const record = useCallback(
    (materialId: string, score: number) => {
      mutate(
        { materialId, score },
        { onError: () => undefined, onSuccess: () => undefined }
      );
    },
    [mutate]
  );

  return record;
}
