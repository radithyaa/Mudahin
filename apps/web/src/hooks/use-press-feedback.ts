import gsap from "gsap";
import { useEffect, useRef } from "react";

import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { animatePress } from "@/lib/motion";

/**
 * Mikro-interaksi tekan (tap feedback) yang reusable untuk satu elemen interaktif.
 *
 * - Memakai pointer events sehingga bekerja untuk jempol (mobile) & mouse.
 * - Hormati reduced-motion: tidak ada animasi saat aktif.
 *
 * @example
 * const ref = usePressFeedback<HTMLAnchorElement>();
 * return <a ref={ref} ... />;
 */
export function usePressFeedback<T extends Element>() {
  const reducedMotion = useReducedMotion();
  const ref = useRef<T>(null);

  useEffect(() => {
    const element = ref.current;
    if (reducedMotion || element === null) {
      return;
    }

    const press = () => animatePress(element, true);
    const release = () => animatePress(element, false);

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
  }, [reducedMotion]);

  return ref;
}
