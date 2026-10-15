import { useEffect, useState } from "react";

import { useFocusProfile } from "@/lib/stores/focus-profile-store";

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

/**
 * Menentukan apakah animasi harus dimatikan.
 *
 * Gabungan dua sumber (Aturan Teknis §7.6 & §7.8):
 * 1. Preferensi OS pengguna (`prefers-reduced-motion`).
 * 2. Preferensi aplikasi ("Kurangi animasi" pada Focus Profile).
 *
 * Dipakai sebelum menjalankan animasi berbasis JS (GSAP), karena override CSS
 * `reduce-motion` hanya berlaku untuk animasi CSS, bukan animasi JS inline.
 */
export function useReducedMotion(): boolean {
  const appReduceMotion = useFocusProfile((s) => s.reduceMotion);
  const [osReduceMotion, setOsReduceMotion] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(REDUCED_MOTION_QUERY);
    setOsReduceMotion(media.matches);

    const handleChange = (event: MediaQueryListEvent) =>
      setOsReduceMotion(event.matches);

    media.addEventListener("change", handleChange);
    return () => media.removeEventListener("change", handleChange);
  }, []);

  return appReduceMotion || osReduceMotion;
}
