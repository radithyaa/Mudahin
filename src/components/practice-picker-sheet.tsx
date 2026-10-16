import type React from "react";
import { useEffect } from "react";

import { canRecordSpeech } from "../lib/speech-support";
import type { LearningModule } from "../types";
import { soundEffects } from "../utils/audio";

/** Jenis latihan yang bisa dipilih untuk sebuah materi. */
export type PracticeKind =
  | "flashcards"
  | "voice"
  | "narration"
  | "quiz"
  | "reader";

interface PracticeKindOption {
  /** Ikon Material Symbols. */
  icon: string;
  /** Kelas Tailwind untuk kotak ikon (bg + teks + border). */
  iconClass: string;
  id: PracticeKind;
  /** Keterangan singkat di bawah judul. */
  subtitle: string;
  title: string;
}

/**
 * Daftar jenis latihan beserta tampilannya.
 *
 * Didefinisikan di sini (bukan di tiap pemanggil) agar dialog dan halaman
 * Belajar menampilkan pilihan yang persis sama.
 */
export const PRACTICE_KINDS: PracticeKindOption[] = [
  {
    id: "flashcards",
    title: "🃏 Kartu Tanya Jawab (Flashcard)",
    subtitle:
      "Latih ingatan satu per satu, balik kartu dan beri tanda paham tanpa tekanan.",
    icon: "style",
    iconClass: "border-[#c7c4d8] bg-[#e2e7ff] text-[#3525cd]",
  },
  {
    id: "voice",
    title: "🎙️ Jawab dengan Suara",
    subtitle:
      "Latihan berbicara dan menjawab pertanyaan secara lisan tanpa perlu mengetik.",
    icon: "mic",
    iconClass: "border-[#F59E0B] bg-[#FEF3C7] text-[#92400E]",
  },
  {
    id: "narration",
    title: "🎧 Dengarkan Bacaan Nyaring",
    subtitle:
      "Narasi suara lembut menenangkan dengan penunjuk bagian berjalan ritmis.",
    icon: "headphones",
    iconClass: "border-[#c7c4d8] bg-[#dae2fd] text-[#3525cd]",
  },
  {
    id: "quiz",
    title: "🧩 Kuis Santai Adaptif",
    subtitle:
      "Tantangan seru 3 pertanyaan ramah waktu yang menyesuaikan kemampuanmu.",
    icon: "extension",
    iconClass: "border-[#006c49] bg-[#6cf8bb] text-[#00714d]",
  },
  {
    id: "reader",
    title: "📖 Buka Format Focus Reader",
    subtitle: "Penggaris baca khusus & kontras hangat agar mata tidak lelah.",
    icon: "chrome_reader_mode",
    iconClass: "border-[#38BDF8] bg-[#E0F2FE] text-[#0369A1]",
  },
];

interface PracticePickerSheetProps {
  module: LearningModule | null;
  onClose: () => void;
  onSelect: (kind: PracticeKind, module: LearningModule) => void;
}

/**
 * Dialog pilih jenis latihan untuk satu materi.
 *
 * Muncul saat pengguna mengetuk materi di pustaka. Memilih salah satu jenis
 * langsung membuka modal latihan yang bersangkutan dengan materi terpilih —
 * kartu/soal dibuat AI dari isi materi tersebut.
 */
export const PracticePickerSheet: React.FC<PracticePickerSheetProps> = ({
  module,
  onClose,
  onSelect,
}) => {
  useEffect(() => {
    if (!module) {
      return;
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [module, onClose]);

  if (!module) {
    return null;
  }

  const speechSupported = canRecordSpeech();

  return (
    <div className="dialog-layer dialog-layer--bottom">
      <button
        aria-label="Tutup pilihan latihan"
        className="absolute inset-0 h-full w-full cursor-default bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        type="button"
      />

      <div className="dialog-panel fade-in slide-in-from-bottom-6 z-10 max-h-[85%] animate-in rounded-t-3xl border-2 border-[#4f46e5] bg-[#faf8ff] shadow-2xl duration-200">
        <div className="flex shrink-0 items-start justify-between gap-3 border-[#c7c4d8] border-b-2 bg-white px-4 pt-2 pb-3">
          <div className="min-w-0">
            <span
              aria-hidden="true"
              className="mx-auto mb-1.5 block h-1.5 w-12 rounded-full bg-[#c7c4d8]"
            />
            <span className="block font-extrabold text-[#3525cd] text-[11px] uppercase tracking-wider">
              Pilih Jenis Latihan
            </span>
            <h3 className="truncate font-extrabold text-[#131b2e] text-[17px]">
              {module.title}
            </h3>
          </div>
          <button
            aria-label="Tutup"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#eaedff] text-[#3525cd] transition-colors hover:bg-[#dae2fd]"
            onClick={() => {
              soundEffects.playTap();
              onClose();
            }}
            type="button"
          >
            <span className="material-symbols-outlined text-[22px]">close</span>
          </button>
        </div>

        <div
          className="flex-1 overflow-y-auto overscroll-contain p-4"
          style={{ paddingBottom: "calc(1rem + var(--safe-bottom))" }}
        >
          <p className="mb-3 font-medium text-[#464555] text-[13px] leading-relaxed">
            Soal latihan akan dibuat Teman AI dari materi ini. Pilih mode yang
            paling nyaman buatmu hari ini.
          </p>

          <div className="space-y-2">
            {PRACTICE_KINDS.map((kind) => {
              const isVoice = kind.id === "voice";
              const disabled = isVoice && !speechSupported;
              return (
                <button
                  className={`group flex w-full items-start gap-3 rounded-xl border-2 border-[#c7c4d8] bg-[#faf8ff] p-3 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                    disabled ? "" : "hover:bg-[#eaedff]"
                  }`}
                  disabled={disabled}
                  key={kind.id}
                  onClick={() => {
                    soundEffects.playTap();
                    onSelect(kind.id, module);
                  }}
                  title={
                    disabled
                      ? "Perekaman suara belum didukung di perangkat ini"
                      : kind.title
                  }
                  type="button"
                >
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border ${kind.iconClass}`}
                  >
                    <span className="material-symbols-outlined text-[24px]">
                      {kind.icon}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="block font-extrabold text-[#131b2e] text-[14px]">
                      {kind.title}
                    </span>
                    <p className="mt-0.5 text-[#464555] text-[13px] leading-snug">
                      {disabled
                        ? "Belum didukung di perangkat ini."
                        : kind.subtitle}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
