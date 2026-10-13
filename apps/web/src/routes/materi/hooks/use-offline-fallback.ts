import { useEffect, useState } from "react";

/**
 * Membaca salinan luring ketika permintaan AI gagal (mis. sedang offline).
 *
 * Mengembalikan data luring (atau `null`). Dipakai Ringkasan & Kuis agar
 * demo tetap berjalan tanpa jaringan (SRS §4.5, FR-PRF-06).
 */
export function useOfflineFallback<T>(
  shouldLoad: boolean,
  materialId: string,
  loader: (materialId: string) => Promise<T | null>
): T | null {
  const [data, setData] = useState<T | null>(null);

  useEffect(() => {
    if (!shouldLoad) {
      return;
    }
    let active = true;
    loader(materialId)
      .then((cached) => {
        if (active && cached) {
          setData(cached);
        }
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [loader, materialId, shouldLoad]);

  return data;
}
