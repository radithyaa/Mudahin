import React, { useState, useEffect } from 'react';

interface AIProcessingModalProps {
  isOpen: boolean;
}

export const AIProcessingModal: React.FC<AIProcessingModalProps> = ({ isOpen }) => {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    'Membaca teks dari catatan foto & diagram...',
    'Menyederhanakan konsep rumit menjadi ramah baca...',
    'Menyiapkan 12 kartu tanya jawab santai...',
    'Meracik kuis adaptif dan narasi suara...',
  ];

  useEffect(() => {
    if (!isOpen) {
      setCurrentStep(0);
      return;
    }

    const interval = setInterval(() => {
      setCurrentStep((prev) => (prev < steps.length - 1 ? prev + 1 : prev));
    }, 600);

    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-center items-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl p-6 border-2 border-[#4f46e5] shadow-2xl text-center space-y-5 animate-in zoom-in-95 duration-200">
        <div className="w-16 h-16 rounded-2xl bg-[#EDE9FE] text-[#4f46e5] border-2 border-[#4f46e5] flex items-center justify-center mx-auto shadow-[0_3px_0_0_#3525cd]">
          <span className="material-symbols-outlined text-[36px] animate-spin">auto_awesome</span>
        </div>

        <div>
          <h3 className="text-[20px] font-extrabold text-[#131b2e]">Teman AI Sedang Bekerja</h3>
          <p className="text-[13px] text-[#464555] mt-1 font-medium">
            Merangkum catatanmu menjadi materi asyik dan tidak membosankan
          </p>
        </div>

        {/* Steps List */}
        <div className="space-y-2.5 text-left bg-[#faf8ff] p-4 rounded-2xl border border-[#c7c4d8]">
          {steps.map((text, idx) => {
            const isDone = idx < currentStep;
            const isCurrent = idx === currentStep;

            return (
              <div key={idx} className="flex items-center gap-2.5 text-[13px]">
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[12px] font-bold ${
                    isDone
                      ? 'bg-[#22C55E] text-white'
                      : isCurrent
                      ? 'border-2 border-[#4f46e5] bg-[#eaedff] text-[#3525cd] animate-pulse'
                      : 'bg-slate-200 text-slate-400'
                  }`}
                >
                  {isDone ? (
                    <span className="material-symbols-outlined text-[14px]">check</span>
                  ) : (
                    <span>{idx + 1}</span>
                  )}
                </div>
                <span
                  className={`font-semibold ${
                    isDone
                      ? 'text-[#166534]'
                      : isCurrent
                      ? 'text-[#3525cd] font-bold'
                      : 'text-slate-400'
                  }`}
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
