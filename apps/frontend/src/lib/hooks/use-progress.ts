import { toDateOnly } from "@mudahin/api/voice";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect } from "react";

import { useDeviceIdentity } from "../stores/device-identity-store";
import { useGamificationStore } from "../stores/gamification-store";
import { trpc } from "../trpc";

/**
 * Progres belajar per materi (FR-PRF-05).
 *
 * `record` menyimpan skor kuis terbaik; `summary` memberi ringkasan untuk
 * Beranda & Profil (rata-rata skor, jumlah materi dikerjakan). Keduanya diikat
 * ke identitas perangkat (`deviceId`) karena aplikasi belum memakai akun.
 */
export function useProgressSummary() {
  const deviceId = useDeviceIdentity((state) => state.deviceId);
  return useQuery(trpc.progress.summary.queryOptions({ deviceId }));
}

export function useRecordProgress() {
  const queryClient = useQueryClient();
  const deviceId = useDeviceIdentity((state) => state.deviceId);

  const mutation = useMutation(
    trpc.progress.record.mutationOptions({
      onSuccess: () => queryClient.invalidateQueries(),
    })
  );

  /**
   * Skor diikat ke perangkat ini. `deviceId` disuntikkan otomatis sehingga
   * pemanggil cukup menyebut materi & skornya saja.
   */
  const record = (
    materialId: string,
    score: number,
    options?: Omit<Parameters<typeof mutation.mutate>[1], "onSuccess">
  ) => mutation.mutate({ deviceId, materialId, score }, options);

  return { ...mutation, mutate: record };
}

/**
 * Gamifikasi: XP & rentetan harian.
 *
 * `gamification` membaca keadaan dari server (sumber kebenaran antar perangkat),
 * lalu mencerminkannya ke store lokal agar UI reaktif & tahan luring. `reward`
 * menambah XP baik di server maupun lokal, sehingga XP tidak lagi hilang saat
 * aplikasi dimuat ulang.
 */
export function useGamification() {
  const queryClient = useQueryClient();
  const deviceId = useDeviceIdentity((state) => state.deviceId);
  const rewardLocally = useGamificationStore((state) => state.reward);

  const query = useQuery(trpc.progress.gamification.queryOptions({ deviceId }));

  // Server adalah sumber kebenaran antar perangkat. Bila nilainya lebih baik
  // (mis. pengguna belajar di perangkat lain), naikkan nilai lokal; tetapi jangan
  // pernah menurunkan, agar XP yang belum tersinkron tidak hilang.
  const serverData = query.data;
  useEffect(() => {
    if (!serverData) {
      return;
    }
    const local = useGamificationStore.getState();
    if (serverData.xp > local.xp) {
      useGamificationStore.getState().syncFrom(serverData);
    }
  }, [serverData]);

  const mutation = useMutation(
    trpc.progress.reward.mutationOptions({
      onSuccess: (data) => {
        // Server adalah sumber kebenaran: samakan lokal dengan hasilnya.
        useGamificationStore.getState().syncFrom(data);
        queryClient.invalidateQueries().catch(() => undefined);
      },
    })
  );

  /**
   * Menambah XP. Nilai lokal diperbarui lebih dulu agar UI terasa instan, lalu
   * dikirim ke server. Bila jaringan gagal, XP lokal tetap tersimpan (dan akan
   * disinkronkan kembali lewat pemulihan cadangan).
   */
  const reward = useCallback(
    (amount: number) => {
      rewardLocally(amount, toDateOnly(new Date()));
      mutation.mutate({ amount, deviceId });
    },
    [deviceId, mutation, rewardLocally]
  );

  return { ...query, reward };
}

/** Riwayat latihan lisan untuk satu materi. */
export function useVoiceHistory(materialId?: string) {
  const deviceId = useDeviceIdentity((state) => state.deviceId);
  return useQuery(
    trpc.progress.voiceHistory.queryOptions({ deviceId, materialId })
  );
}

/**
 * Menilai & menyimpan satu percobaan "Jawab dengan Suara".
 *
 * Penilaian dilakukan di server (deterministik) agar keputusan benar/salah
 * konsisten. Percobaan tetap dicatat agar muncul di Riwayat Latihan. Mode
 * `replay` (mengulang dari riwayat) menyimpan riwayat **tanpa** memberi XP.
 */
export function useRecordVoiceAttempt() {
  const queryClient = useQueryClient();
  const deviceId = useDeviceIdentity((state) => state.deviceId);

  const mutation = useMutation(
    trpc.progress.recordVoiceAttempt.mutationOptions({
      onSuccess: () => queryClient.invalidateQueries(),
    })
  );

  const record = useCallback(
    (
      input: Omit<Parameters<typeof mutation.mutate>[0], "deviceId">,
      options?: Parameters<typeof mutation.mutate>[1]
    ) => mutation.mutate({ ...input, deviceId }, options),
    [deviceId, mutation]
  );

  /** Varian `mutateAsync` agar modal suara dapat menunggu penilaian server. */
  const recordAsync = useCallback(
    (input: Omit<Parameters<typeof mutation.mutateAsync>[0], "deviceId">) =>
      mutation.mutateAsync({ ...input, deviceId }),
    [deviceId, mutation]
  );

  return { ...mutation, mutate: record, mutateAsync: recordAsync };
}
