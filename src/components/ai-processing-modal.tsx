import type React from "react";
import { useEffect, useState } from "react";

interface AIProcessingModalProps {
  isOpen: boolean;
}

const STEPS = [
  "Membaca teks dari catatan foto & diagram...",
  "Menyederhanakan konsep rumit menjadi ramah baca...",
  "Menyiapkan kartu tanya jawab santai...",
  "Meracik kuis adaptif dan narasi suara...",
] as const;

/** Gaya lencana angka langkah sesuai statusnya. */
function stepBadgeClass(isDone: boolean, isCurrent: boolean): string {
  if (isDone) {
    return "bg-[#22C55E] text-white";
  }
  if (isCurrent) {
    return "animate-pulse border-2 border-[#4f46e5] bg-[#eaedff] text-[#3525cd]";
  }
  return "bg-slate-200 text-slate-400";
}

/** Gaya teks langkah sesuai statusnya. */
function stepTextClass(isDone: boolean, isCurrent: boolean): string {
  if (isDone) {
    return "text-[#166534]";
  }
  if (isCurrent) {
    return "font-bold text-[#3525cd]";
  }
  return "text-slate-400";
}

export const AIProcessingModal: React.FC<AIProcessingModalProps> = ({
  isOpen,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const stepCount = STEPS.length;

  useEffect(() => {
    if (!isOpen) {
      setCurrentStep(0);
      return;
    }

    const interval = setInterval(() => {
      setCurrentStep((prev) => Math.min(prev + 1, stepCount - 1));
    }, 600);

    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="dialog-layer dialog-layer--center">
      <div className="dialog-panel zoom-in-95 max-w-md animate-in space-y-5 rounded-3xl border-2 border-[#4f46e5] bg-white p-6 text-center shadow-2xl duration-200">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-[#4f46e5] bg-[#EDE9FE] text-[#4f46e5] shadow-[0_3px_0_0_#3525cd]">
          <span className="material-symbols-outlined animate-spin text-[36px]">
            auto_awesome
          </span>
        </div>

        <div>
          <h3 className="font-extrabold text-[#131b2e] text-[20px]">
            Teman AI Sedang Bekerja
          </h3>
          <p className="mt-1 font-medium text-[#464555] text-[13px]">
            Merangkum catatanmu menjadi materi asyik dan tidak membosankan
          </p>
        </div>

        {/* Steps List */}
        <div className="space-y-2.5 rounded-2xl border border-[#c7c4d8] bg-[#faf8ff] p-4 text-left">
          {STEPS.map((text, idx) => {
            const isDone = idx < currentStep;
            const isCurrent = idx === currentStep;

            return (
              <div className="flex items-center gap-2.5 text-[13px]" key={text}>
                <div
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full font-bold text-[12px] ${stepBadgeClass(
                    isDone,
                    isCurrent
                  )}`}
                >
                  {isDone ? (
                    <span className="material-symbols-outlined text-[14px]">
                      check
                    </span>
                  ) : (
                    <span>{idx + 1}</span>
                  )}
                </div>
                <span
                  className={`font-semibold ${stepTextClass(isDone, isCurrent)}`}
                >
                  {text}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
