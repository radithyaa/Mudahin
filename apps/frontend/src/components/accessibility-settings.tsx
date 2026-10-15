import type React from "react";
import { useEffect, useState } from "react";

import {
  collectSpeechDiagnostics,
  describeSpeechDiagnostics,
} from "../lib/speech-diagnostics";
import { canSpeakText, hasSpeechSynthesis } from "../lib/speech-support";
import { soundEffects, speakText } from "../utils/audio";

export type FontSize = "sm" | "md" | "lg" | "xl";

export interface AccessibilityValues {
  dyslexiaFont: boolean;
  fontSize: FontSize;
  readingRuler: boolean;
  speechSpeed: number;
  warmTheme: boolean;
}

export interface AccessibilitySettingsProps {
  onChangeFontSize: (size: FontSize) => void;
  onChangeSpeechSpeed: (speed: number) => void;
  onToggleDyslexiaFont: () => void;
  onToggleRuler: () => void;
  onToggleWarm: () => void;
  value: AccessibilityValues;
}

export const FONT_SIZE_OPTIONS = [
  { id: "sm", label: "A-", desc: "Kecil", scale: "88%" },
  { id: "md", label: "A", desc: "Normal", scale: "100%" },
  { id: "lg", label: "A+", desc: "Besar", scale: "114%" },
  { id: "xl", label: "A++", desc: "Ekstra", scale: "130%" },
] as const satisfies readonly {
  id: FontSize;
  label: string;
  desc: string;
  scale: string;
}[];

export const SPEED_OPTIONS = [
  { val: 0.8, label: "0.8x", desc: "Santai" },
  { val: 1, label: "1.0x", desc: "Normal" },
  { val: 1.25, label: "1.25x", desc: "Lincah" },
] as const;

/** Kelas bersama untuk tombol pilihan (ukuran huruf & kecepatan suara). */
function choiceClass(isActive: boolean): string {
  return `tactile-btn rounded-xl border-2 px-2 py-2.5 text-center transition-all ${
    isActive
      ? "border-[#3525cd] bg-[#4f46e5] text-white shadow-[0_3px_0_0_#3525cd]"
      : "border-[#c7c4d8] bg-[#faf8ff] text-[#131b2e] shadow-[0_2px_0_0_#CBD5E1]"
  }`;
}

/** Sakelar geser standar untuk seluruh preferensi biner. */
function SwitchButton({
  checked,
  offColor,
  onColor,
  onToggle,
  title,
}: {
  checked: boolean;
  offColor: string;
  onColor: string;
  onToggle: () => void;
  title: string;
}) {
  return (
    <button
      aria-label={title}
      aria-pressed={checked}
      className={`h-8 w-14 shrink-0 rounded-full border p-1 transition-colors ${
        checked ? onColor : offColor
      }`}
      onClick={() => {
        soundEffects.playTap();
        onToggle();
      }}
      title={title}
      type="button"
    >
      <div
        className={`h-6 w-6 rounded-full bg-white shadow-md transition-transform ${
          checked ? "translate-x-6" : "translate-x-0"
        }`}
      />
    </button>
  );
}

/** Satu baris sakelar: judul + keterangan di kiri, sakelar di kanan. */
function SwitchRow({
  checked,
  description,
  offColor,
  onColor,
  onToggle,
  title,
}: {
  checked: boolean;
  description: string;
  offColor?: string;
  onColor?: string;
  onToggle: () => void;
  title: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-[#c7c4d8] bg-[#f2f3ff] p-3.5">
      <div className="min-w-0 pr-2">
        <span className="block font-extrabold text-[#131b2e] text-[14px]">
          {title}
        </span>
        <span className="block font-medium text-[#464555] text-[12px]">
          {description}
        </span>
      </div>
      <SwitchButton
        checked={checked}
        offColor={offColor ?? "border-slate-400 bg-slate-300"}
        onColor={onColor ?? "border-[#006c49] bg-[#006c49]"}
        onToggle={onToggle}
        title={title}
      />
    </div>
  );
}

/**
 * Kartu pengaturan aksesibilitas inti.
 *
 * Dipakai bersama oleh halaman **Akses** dan **bottom sheet** dari navbar,
 * sehingga perilaku di keduanya selalu identik (source of truth tunggal).
 */
export const AccessibilitySettings: React.FC<AccessibilitySettingsProps> = ({
  value,
  onChangeFontSize,
  onToggleRuler,
  onToggleWarm,
  onToggleDyslexiaFont,
  onChangeSpeechSpeed,
}) => {
  const handleTestSpeech = () => {
    soundEffects.playTap();
    speakText(
      "Ini contoh suara panduan ramah belajar di aplikasi Mudahin. Kecepatan dan intonasi disesuaikan agar kamu merasa nyaman.",
      value.speechSpeed
    );
  };

  const speechSupported = canSpeakText();

  /** Ringkasan diagnostik; diperbarui saat mesin suara selesai memuat voice. */
  const [diagnosticsSummary, setDiagnosticsSummary] = useState(() =>
    describeSpeechDiagnostics(collectSpeechDiagnostics())
  );

  useEffect(() => {
    const synthesis = hasSpeechSynthesis() ? window.speechSynthesis : null;
    if (!synthesis) {
      return;
    }
    const refresh = () =>
      setDiagnosticsSummary(
        describeSpeechDiagnostics(collectSpeechDiagnostics())
      );
    refresh();
    synthesis.addEventListener("voiceschanged", refresh);
    return () => synthesis.removeEventListener("voiceschanged", refresh);
  }, []);

  return (
    <div className="space-y-5">
      {/* Tipografi & Ukuran Teks */}
      <section className="space-y-4 rounded-2xl border-2 border-[#c7c4d8] bg-white p-4 shadow-[0_4px_0_0_#cbd5e1]">
        <div className="flex items-center gap-2 font-extrabold text-[#131b2e] text-[16px]">
          <span className="material-symbols-outlined text-[#3525cd]">
            format_size
          </span>
          <span>Ukuran dan Gaya Huruf</span>
        </div>

        <div>
          <span className="mb-2 block font-bold text-[#464555] text-[12px]">
            Ukuran Huruf Baca:
          </span>
          <div className="grid grid-cols-4 gap-2">
            {FONT_SIZE_OPTIONS.map((size) => (
              <button
                aria-pressed={value.fontSize === size.id}
                className={choiceClass(value.fontSize === size.id)}
                key={size.id}
                onClick={() => {
                  soundEffects.playTap();
                  onChangeFontSize(size.id);
                }}
                type="button"
              >
                <span className="block font-extrabold text-[15px]">
                  {size.label}
                </span>
                <span className="block text-[10px] opacity-80">
                  {size.desc}
                </span>
              </button>
            ))}
          </div>
        </div>

        <SwitchRow
          checked={value.dyslexiaFont}
          description="Bentuk huruf berjarak lega dan terbuka agar tidak mudah tertukar saat membaca."
          onToggle={onToggleDyslexiaFont}
          title="Font Ramah Disleksia (Lexend)"
        />
      </section>

      {/* Bantuan Fokus & Kenyamanan Mata */}
      <section className="space-y-4 rounded-2xl border-2 border-[#c7c4d8] bg-white p-4 shadow-[0_4px_0_0_#cbd5e1]">
        <div className="flex items-center gap-2 font-extrabold text-[#131b2e] text-[16px]">
          <span className="material-symbols-outlined text-[#D97706]">
            visibility
          </span>
          <span>Bantuan Fokus &amp; Kenyamanan Mata</span>
        </div>

        <SwitchRow
          checked={value.readingRuler}
          description="Menyorot baris aktif dan meredupkan baris lainnya untuk menjaga fokus ADHD."
          onToggle={onToggleRuler}
          title="Garis Pembimbing Baca (Reading Ruler)"
        />

        <SwitchRow
          checked={value.warmTheme}
          description="Mengganti latar putih tajam menjadi warna sepia/krem lembut agar mata tidak cepat lelah."
          offColor="border-slate-400 bg-slate-300"
          onColor="border-[#D97706] bg-[#F59E0B]"
          onToggle={onToggleWarm}
          title="Filter Warna Hangat (Anti Silau)"
        />
      </section>

      {/* Suara Panduan */}
      <section className="space-y-4 rounded-2xl border-2 border-[#c7c4d8] bg-white p-4 shadow-[0_4px_0_0_#cbd5e1]">
        <div className="flex items-center gap-2 font-extrabold text-[#131b2e] text-[16px]">
          <span className="material-symbols-outlined text-[#3525cd]">
            record_voice_over
          </span>
          <span>Pengaturan Suara Panduan</span>
        </div>

        <div>
          <span className="mb-2 block font-bold text-[#464555] text-[12px]">
            Kecepatan Bicara Suara:
          </span>
          <div className="grid grid-cols-3 gap-2">
            {SPEED_OPTIONS.map((speed) => (
              <button
                aria-pressed={value.speechSpeed === speed.val}
                className={choiceClass(value.speechSpeed === speed.val)}
                key={speed.val}
                onClick={() => {
                  soundEffects.playTap();
                  onChangeSpeechSpeed(speed.val);
                }}
                type="button"
              >
                <span className="block font-bold text-[13px]">
                  {speed.label}
                </span>
                <span className="block text-[10px] opacity-80">
                  {speed.desc}
                </span>
              </button>
            ))}
          </div>
        </div>

        <button
          className="tactile-btn flex w-full items-center justify-center gap-2 rounded-xl border border-[#c7c4d8] bg-[#eaedff] px-4 py-3 font-bold text-[#3525cd] text-[13px] shadow-[0_2px_0_0_#CBD5E1] disabled:opacity-50"
          disabled={!speechSupported}
          onClick={handleTestSpeech}
          title={
            speechSupported
              ? "Tes suara panduan"
              : "Pembacaan suara belum tersedia di perangkat ini"
          }
          type="button"
        >
          <span className="material-symbols-outlined text-[18px]">
            play_circle
          </span>
          <span>
            {speechSupported
              ? "Tes Suara Panduan Sekarang"
              : "Suara Belum Tersedia di Perangkat Ini"}
          </span>
        </button>

        {/*
         * Status jujur kemampuan suara perangkat. Voice terpasang di Android
         * sering 0 sampai mesin suara selesai dimuat, jadi kita dengarkan
         * `voiceschanged` supaya angka ini memperbarui diri sendiri.
         */}
        <p className="rounded-xl bg-[#f2f3ff] px-3 py-2 font-medium text-[#464555] text-[11px] leading-relaxed">
          {diagnosticsSummary}
        </p>
      </section>

      {/* Pratinjau langsung — teks contoh netral, bukan materi tertentu. */}
      <section className="rounded-2xl border-2 border-[#4f46e5] bg-white p-4 shadow-[0_3px_0_0_#3525cd]">
        <span className="mb-2 block font-extrabold text-[#3525cd] text-[11px] uppercase tracking-wider">
          Pratinjau Teks Langsung Sesuai Pilihanmu:
        </span>
        <div className="rounded-xl border border-[#c7c4d8] bg-[#faf8ff] p-4">
          <h4 className="mb-1 font-extrabold text-[#131b2e] text-[17px]">
            Contoh Judul Materi
          </h4>
          <p className="text-[#131b2e] leading-relaxed">
            Ini contoh paragraf untuk memperlihatkan ukuran huruf, jarak baris,
            dan warna latar yang kamu pilih. Materi aslimu akan tampil dengan
            gaya yang sama agar nyaman dibaca.
          </p>
        </div>
      </section>
    </div>
  );
};
