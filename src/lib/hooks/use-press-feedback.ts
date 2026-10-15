import gsap from "gsap";
import { useEffect, useRef } from "react";
import { HAPTIC, vibrate } from "@/lib/haptics";
import { animatePress } from "@/lib/motion";
import { useFocusProfile } from "@/lib/stores/focus-profile-store";
import { useReducedMotion } from "./use-reduced-motion";

/**
 * Mikro-interaksi tekan (tap feedback) yang reusable untuk satu elemen interaktif.
 *
 * - Memakai pointer events sehingga bekerja untuk jempol (mobile) & mouse.
 * - Hormati reduced-motion: tidak ada animasi saat aktif.
 * - Getar (haptic) mengikuti preferensi "Getar saat menekan".
 *
 * @example
 * const ref = usePressFeedback<HTMLAnchorElement>();
 * return <a ref={ref} ... />;
 */
export function usePressFeedback<T extends Element>() {
  const reducedMotion = useReducedMotion();
  const hapticsEnabled = useFocusProfile((s) => s.haptics);
  const ref = useRef<T>(null);

  useEffect(() => {
    const element = ref.current;
    if (element === null) {
      return;
    }

    // Setelan "Kurangi animasi" hanya mematikan animasi, bukan getar.
    const press = () => {
      if (!reducedMotion) {
        animatePress(element, true);
      }
      vibrate(HAPTIC.tap, !hapticsEnabled);
    };
    const release = () => {
      if (!reducedMotion) {
        animatePress(element, false);
      }
    };

    element.addEventListener("pointerdown", press);
    element.addEventListener("pointerup", release);
    element.addEventListener("pointercancel", release);
    element.addEventListener("pointerleave", release);

    return () => {
      element.removeEventListener("pointerdown", press);
      element.removeEventListener("pointerup", release);
      element.removeEventListener("pointercancel", release);
      element.removeEventListener("pointerleave", release);
      gsap.set(element, { clearProps: "transform" });
    };
  }, [hapticsEnabled, reducedMotion]);

  return ref;
}
