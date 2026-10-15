import React from 'react';
import { soundEffects, speakText } from '../utils/audio';

interface AksesViewProps {
  fontSize: 'sm' | 'md' | 'lg' | 'xl';
  onChangeFontSize: (size: 'sm' | 'md' | 'lg' | 'xl') => void;
  readingRuler: boolean;
  onToggleRuler: () => void;
  warmTheme: boolean;
  onToggleWarm: () => void;
  dyslexiaFont: boolean;
  onToggleDyslexiaFont: () => void;
  speechSpeed: number;
  onChangeSpeechSpeed: (speed: number) => void;
}

export const AksesView: React.FC<AksesViewProps> = ({
  fontSize,
  onChangeFontSize,
  readingRuler,
  onToggleRuler,
  warmTheme,
  onToggleWarm,
  dyslexiaFont,
  onToggleDyslexiaFont,
  speechSpeed,
  onChangeSpeechSpeed,
}) => {
  const handleTestSpeech = () => {
    soundEffects.playTap();
    speakText(
      'Halo Rian! Ini adalah contoh suara panduan ramah belajar di aplikasi Mudahin. Kecepatan dan intonasi disesuaikan agar kamu merasa nyaman.',
      speechSpeed
    );
  };

  return (
    <main className="w-full max-w-xl mx-auto px-4 pt-4 space-y-5 pb-32">
      {/* Header */}
      <section className="space-y-1">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#E8F8F0] text-[#006c49] rounded-full text-[12px] font-extrabold">
          <span className="material-symbols-outlined text-[16px]">accessibility_new</span>
          <span>Desain Ramah Neurodiversitas</span>
        </div>
        <h2 className="text-[24px] font-extrabold text-[#131b2e] tracking-tight">
          Pusat Aksesibilitas Belajar
        </h2>
        <p className="text-[14px] text-[#464555] font-medium leading-relaxed">
          Atur tampilan, kontras warna, font khusus, dan panduan audio agar sesi belajarmu minim lelah dan bebas stres.
        </p>
      </section>

      {/* Control Card 1: Tipografi & Ukuran Teks */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border-2 border-[#c7c4d8] shadow-[0_4px_0_0_#cbd5e1] space-y-4">
        <div className="flex items-center gap-2 text-[#131b2e] font-extrabold text-[16px]">
          <span className="material-symbols-outlined text-[#3525cd]">format_size</span>
          <span>Ukuran dan Gaya Huruf</span>
        </div>

        {/* Font scale buttons */}
        <div>
          <label className="text-[12px] font-bold text-[#464555] block mb-2">Ukuran Huruf Baca:</label>
          <div className="grid grid-cols-4 gap-2">
            {[
              { id: 'sm', label: 'A-', desc: 'Kecil' },
              { id: 'md', label: 'A', desc: 'Normal' },
              { id: 'lg', label: 'A+', desc: 'Besar' },
              { id: 'xl', label: 'A++', desc: 'Ekstra' },
            ].map((s) => (
              <button
                key={s.id}
                onClick={() => {
                  soundEffects.playTap();
                  onChangeFontSize(s.id as any);
                }}
                className={`tactile-btn py-2.5 px-2 rounded-xl border-2 text-center transition-all ${
                  fontSize === s.id
                    ? 'bg-[#4f46e5] text-white border-[#3525cd] shadow-[0_3px_0_0_#3525cd]'
                    : 'bg-[#faf8ff] text-[#131b2e] border-[#c7c4d8] shadow-[0_2px_0_0_#cbd5e1]'
                }`}
                type="button"
              >
                <span className="block font-extrabold text-[15px]">{s.label}</span>
                <span className="block text-[10px] opacity-80">{s.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Dyslexia friendly font switch */}
        <div className="flex items-center justify-between p-3.5 bg-[#f2f3ff] rounded-xl border border-[#c7c4d8]">
          <div className="min-w-0 pr-2">
            <span className="text-[14px] font-extrabold text-[#131b2e] block">
              Font Ramah Disleksia (Lexend)
            </span>
            <span className="text-[12px] text-[#464555] font-medium block">
              Bentuk huruf berjarak lega dan terbuka agar tidak mudah tertukar saat membaca.
            </span>
          </div>
          <button
            onClick={() => {
              soundEffects.playTap();
              onToggleDyslexiaFont();
            }}
            className={`w-14 h-8 rounded-full p-1 transition-colors border ${
              dyslexiaFont ? 'bg-[#006c49] border-[#006c49]' : 'bg-slate-300 border-slate-400'
            }`}
          >
            <div
              className={`w-6 h-6 rounded-full bg-white transition-transform shadow-md ${
                dyslexiaFont ? 'translate-x-6' : 'translate-x-0'
              }`}
            ></div>
          </button>
        </div>
      </div>

      {/* Control Card 2: Alat Bantu Penglihatan & Fokus */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border-2 border-[#c7c4d8] shadow-[0_4px_0_0_#cbd5e1] space-y-4">
        <div className="flex items-center gap-2 text-[#131b2e] font-extrabold text-[16px]">
          <span className="material-symbols-outlined text-[#D97706]">visibility</span>
          <span>Bantuan Fokus &amp; Kenyamanan Mata</span>
        </div>

        {/* Reading ruler switch */}
        <div className="flex items-center justify-between p-3.5 bg-[#f2f3ff] rounded-xl border border-[#c7c4d8]">
          <div className="min-w-0 pr-2">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[#006c49] text-[18px]">straighten</span>
              <span className="text-[14px] font-extrabold text-[#131b2e]">
                Garis Pembimbing Baca (Reading Ruler)
              </span>
            </div>
            <span className="text-[12px] text-[#464555] font-medium block mt-0.5">
              Menyorot baris aktif dan meredupkan baris lainnya untuk menjaga fokus ADHD.
            </span>
          </div>
          <button
            onClick={() => {
              soundEffects.playTap();
              onToggleRuler();
            }}
            className={`w-14 h-8 rounded-full p-1 transition-colors border shrink-0 ${
              readingRuler ? 'bg-[#006c49] border-[#006c49]' : 'bg-slate-300 border-slate-400'
            }`}
          >
            <div
              className={`w-6 h-6 rounded-full bg-white transition-transform shadow-md ${
                readingRuler ? 'translate-x-6' : 'translate-x-0'
              }`}
            ></div>
          </button>
        </div>

        {/* Warm theme switch */}
        <div className="flex items-center justify-between p-3.5 bg-[#FEF3C7]/40 rounded-xl border border-[#F59E0B]">
          <div className="min-w-0 pr-2">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[#D97706] text-[18px]">wb_incandescent</span>
              <span className="text-[14px] font-extrabold text-[#78350F]">
                Filter Warna Hangat (Anti Silau)
              </span>
            </div>
            <span className="text-[12px] text-[#92400E] font-medium block mt-0.5">
              Mengganti latar putih tajam menjadi warna sepia/krem lembut agar mata tidak cepat lelah.
            </span>
          </div>
          <button
            onClick={() => {
              soundEffects.playTap();
              onToggleWarm();
            }}
            className={`w-14 h-8 rounded-full p-1 transition-colors border shrink-0 ${
              warmTheme ? 'bg-[#F59E0B] border-[#D97706]' : 'bg-slate-300 border-slate-400'
            }`}
          >
            <div
              className={`w-6 h-6 rounded-full bg-white transition-transform shadow-md ${
                warmTheme ? 'translate-x-6' : 'translate-x-0'
              }`}
            ></div>
          </button>
        </div>
      </div>

      {/* Control Card 3: Narasi Suara */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border-2 border-[#c7c4d8] shadow-[0_4px_0_0_#cbd5e1] space-y-4">
        <div className="flex items-center gap-2 text-[#131b2e] font-extrabold text-[16px]">
          <span className="material-symbols-outlined text-[#3525cd]">record_voice_over</span>
          <span>Pengaturan Suara Panduan</span>
        </div>

        <div>
          <label className="text-[12px] font-bold text-[#464555] block mb-2">
            Kecepatan Bicara Suara:
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { val: 0.8, label: '0.8x (Santai)' },
              { val: 1.0, label: '1.0x (Normal)' },
              { val: 1.25, label: '1.25x (Lincah)' },
            ].map((sp) => (
              <button
                key={sp.val}
                onClick={() => {
                  soundEffects.playTap();
                  onChangeSpeechSpeed(sp.val);
                }}
                className={`tactile-btn py-2.5 px-2 rounded-xl border-2 text-[12px] font-bold transition-all ${
                  speechSpeed === sp.val
                    ? 'bg-[#4f46e5] text-white border-[#3525cd] shadow-[0_2px_0_0_#3525cd]'
                    : 'bg-[#faf8ff] text-[#131b2e] border-[#c7c4d8]'
                }`}
                type="button"
              >
                {sp.label}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleTestSpeech}
          className="tactile-btn w-full py-3 px-4 bg-[#eaedff] text-[#3525cd] border border-[#c7c4d8] rounded-xl font-bold text-[13px] flex items-center justify-center gap-2 shadow-[0_2px_0_0_#cbd5e1]"
          type="button"
        >
          <span className="material-symbols-outlined text-[18px]">play_circle</span>
          <span>Tes Suara Panduan Sekarang</span>
        </button>
      </div>

      {/* Real-time Preview Area */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border-2 border-[#4f46e5] shadow-[0_3px_0_0_#3525cd]">
        <span className="text-[11px] font-extrabold text-[#3525cd] uppercase tracking-wider block mb-2">
          Pratinjau Teks Langsung Sesuai Pilihanmu:
        </span>
        <div
          className={`p-4 rounded-xl bg-[#faf8ff] border border-[#c7c4d8] ${
            dyslexiaFont ? 'font-dyslexia' : ''
          }`}
        >
          <h4 className="text-[17px] font-extrabold text-[#131b2e] mb-1">
            Fotosintesis Tanpa Rumus Rumit
          </h4>
          <p className="text-[#131b2e] leading-relaxed">
            Daun hijau menangkap cahaya matahari bagaikan panel surya alami, meramu air dari akar dan
            udara sejuk menjadi makanan segar yang menghidupkan seluruh bumi.
          </p>
        </div>
      </div>
    </main>
  );
};
