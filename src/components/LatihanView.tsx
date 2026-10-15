import React, { useState } from 'react';
import { LearningModule } from '../types';
import { soundEffects, speakText } from '../utils/audio';

interface LatihanViewProps {
  modules: LearningModule[];
  onOpenFlashcards: (module: LearningModule) => void;
  onOpenVoice: (module: LearningModule) => void;
  onOpenAudioNarration: (module: LearningModule) => void;
  onOpenQuiz: (module: LearningModule) => void;
  onOpenFocusReader: (module: LearningModule) => void;
  onOpenAiStudioPrompt: () => void;
}

export const LatihanView: React.FC<LatihanViewProps> = ({
  modules,
  onOpenFlashcards,
  onOpenVoice,
  onOpenAudioNarration,
  onOpenQuiz,
  onOpenFocusReader,
  onOpenAiStudioPrompt,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<'Semua' | 'Sains' | 'Bahasa' | 'Sosial'>('Semua');

  const featuredModule = modules.find((m) => m.id === 'fotosintesis') || modules[0];
  const siklusModule = modules.find((m) => m.id === 'siklus-air') || modules[1] || modules[0];
  const tataSuryaModule = modules.find((m) => m.id === 'tata-surya') || modules[2] || modules[0];

  const handleAudioGuide = () => {
    soundEffects.playTap();
    speakText(
      'Halo! Ini Pusat Latihan Asyik Mudahin. Di sini kamu bisa melatih pemahaman materi lewat 5 mode santai: kartu flashcard, latihan jawab dengan suara, bacaan nyaring, kuis adaptif, atau focus reader. Pilih mode yang paling nyaman buatmu hari ini!'
    );
  };

  const filteredModules = modules.filter((m) => {
    const matchSearch =
      m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchTag =
      selectedTag === 'Semua' ||
      (selectedTag === 'Sains' && m.category === 'Sains') ||
      (selectedTag === 'Bahasa' && m.category === 'Bahasa') ||
      (selectedTag === 'Sosial' && (m.category === 'Sosial' || m.subjectBadge.includes('Geografi')));
    return matchSearch && matchTag;
  });

  return (
    <main className="w-full max-w-xl mx-auto px-4 pt-3 space-y-5 pb-32">
      {/* Audio Assist Action Banner */}
      <div>
        <button
          onClick={handleAudioGuide}
          className="tactile-btn w-full bg-white border-2 border-[#c7c4d8] rounded-xl p-3 flex items-center justify-between shadow-[0_3px_0_0_#c7c4d8] hover:bg-[#eaedff] text-left group"
          type="button"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#dae2fd] text-[#3525cd] flex items-center justify-center">
              <span className="material-symbols-outlined text-[22px]">volume_up</span>
            </div>
            <div>
              <span className="text-[14px] text-[#131b2e] font-extrabold block">
                🔊 Dengarkan Panduan Belajar
              </span>
              <span className="text-[13px] text-[#464555] font-medium">
                Panduan suara tenang dan ramah ADHD
              </span>
            </div>
          </div>
          <span className="material-symbols-outlined text-[#464555] group-hover:translate-x-0.5 transition-transform text-[24px]">
            play_circle
          </span>
        </button>
      </div>

      {/* Friendly Selector & Intro Section */}
      <section className="space-y-3">
        <div>
          <h2 className="text-[24px] font-extrabold text-[#131b2e] tracking-tight">
            Pilih Materi yang Ingin Dilatih
          </h2>
          <p className="text-[14px] text-[#464555] mt-1 leading-relaxed font-medium">
            Pilih modul dari catatan yang sudah kamu buat bersama Teman AI untuk memulai latihan mandiri tanpa stres.
          </p>
        </div>

        {/* Search Box and Tag Filters */}
        <div className="space-y-3 pt-1">
          <div className="relative flex items-center">
            <span className="material-symbols-outlined absolute left-3.5 text-[#777587]">search</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari judul materi..."
              className="w-full min-h-[52px] pl-11 pr-4 bg-white border-2 border-[#c7c4d8] rounded-xl text-[#131b2e] placeholder:text-[#777587] focus:outline-none focus:border-[#4f46e5] focus:ring-4 focus:ring-[#dad7ff] text-[15px]"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => {
                soundEffects.playTap();
                setSelectedTag('Semua');
              }}
              className={`tactile-chip px-4 py-1.5 rounded-full text-[13px] font-bold flex items-center gap-1.5 shrink-0 transition-colors ${
                selectedTag === 'Semua'
                  ? 'bg-[#4f46e5] text-white shadow-[0_2px_0_0_#3525cd]'
                  : 'bg-white border-2 border-[#c7c4d8] text-[#464555] shadow-[0_2px_0_0_#c7c4d8]'
              }`}
              type="button"
            >
              {selectedTag === 'Semua' && (
                <span className="material-symbols-outlined text-[16px]">check</span>
              )}
              <span>Semua</span>
            </button>

            <button
              onClick={() => {
                soundEffects.playTap();
                setSelectedTag('Sains');
              }}
              className={`tactile-chip px-4 py-1.5 rounded-full text-[13px] font-bold shrink-0 transition-colors ${
                selectedTag === 'Sains'
                  ? 'bg-[#4f46e5] text-white shadow-[0_2px_0_0_#3525cd]'
                  : 'bg-white border-2 border-[#c7c4d8] text-[#464555] shadow-[0_2px_0_0_#c7c4d8]'
              }`}
              type="button"
            >
              🌱 Sains
            </button>

            <button
              onClick={() => {
                soundEffects.playTap();
                setSelectedTag('Bahasa');
              }}
              className={`tactile-chip px-4 py-1.5 rounded-full text-[13px] font-bold shrink-0 transition-colors ${
                selectedTag === 'Bahasa'
                  ? 'bg-[#4f46e5] text-white shadow-[0_2px_0_0_#3525cd]'
                  : 'bg-white border-2 border-[#c7c4d8] text-[#464555] shadow-[0_2px_0_0_#c7c4d8]'
              }`}
              type="button"
            >
              📚 Bahasa
            </button>

            <button
              onClick={() => {
                soundEffects.playTap();
                setSelectedTag('Sosial');
              }}
              className={`tactile-chip px-4 py-1.5 rounded-full text-[13px] font-bold shrink-0 transition-colors ${
                selectedTag === 'Sosial'
                  ? 'bg-[#4f46e5] text-white shadow-[0_2px_0_0_#3525cd]'
                  : 'bg-white border-2 border-[#c7c4d8] text-[#464555] shadow-[0_2px_0_0_#c7c4d8]'
              }`}
              type="button"
            >
              🏛️ Sosial
            </button>
          </div>
        </div>
      </section>

      {/* Daftar Modul Materi Siap Latihan */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-[16px] font-extrabold text-[#131b2e]">
            Modul Siap Latihan ({filteredModules.length})
          </h3>
          <span className="text-[12px] text-[#006c49] font-extrabold">✨ AI Generated</span>
        </div>

        {/* MODULE 1: Primary Featured Card (Expanded/Showcase with 5 Practice Modes) */}
        {featuredModule && (
          <article className="bg-white border-2 border-[#4f46e5] rounded-2xl p-4 sm:p-5 shadow-[0_5px_0_0_#4f46e5] relative overflow-hidden">
            {/* Header badge & Subject */}
            <div className="flex items-start justify-between gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#dae2fd] text-[#3525cd] border border-[#3525cd] text-[12px] font-bold">
                <span className="material-symbols-outlined text-[14px] fill-icon">photo_camera</span>
                Baru Dibuat dari Foto Catatan
              </span>
              <span className="text-[12px] text-[#464555] bg-[#eaedff] px-2 py-0.5 rounded-md font-bold">
                {featuredModule.subjectBadge}
              </span>
            </div>

            {/* Module Title */}
            <h4 className="text-[20px] font-extrabold text-[#131b2e] mb-2 leading-tight">
              {featuredModule.title}
            </h4>
            <p className="text-[14px] text-[#464555] mb-4 leading-relaxed font-medium">
              {featuredModule.description} Lengkap dengan 5 mode latihan ramah sensorik.
            </p>

            {/* Bento Grid for 5 Practice Modes Inside this Module */}
            <div className="space-y-2 mb-5">
              <div className="text-[11px] font-extrabold text-[#464555] tracking-wider uppercase mb-1">
                PILIH MODE LATIHAN SPESIFIK:
              </div>

              {/* Feature A: Flashcard */}
              <div
                onClick={() => {
                  soundEffects.playTap();
                  onOpenFlashcards(featuredModule);
                }}
                className="p-3 rounded-xl border-2 border-[#c7c4d8] bg-[#faf8ff] hover:bg-[#eaedff] transition-colors flex items-start gap-3 cursor-pointer group"
              >
                <div className="w-10 h-10 rounded-lg bg-[#e2e7ff] text-[#3525cd] flex items-center justify-center shrink-0 border border-[#c7c4d8] group-hover:scale-105 transition-transform">
                  <span className="material-symbols-outlined text-[24px]">style</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-[14px] text-[#131b2e] font-extrabold">
                      🃏 Kartu Tanya Jawab (Flashcard)
                    </span>
                    <span className="text-[12px] text-[#3525cd] font-extrabold">
                      {featuredModule.flashcards.length} Kartu
                    </span>
                  </div>
                  <p className="text-[13px] text-[#464555] mt-0.5 leading-snug">
                    Latih ingatan satu per satu, balik kartu dan beri tanda paham tanpa tekanan.
                  </p>
                </div>
              </div>

              {/* Feature B: Voice Response */}
              <div
                onClick={() => {
                  soundEffects.playTap();
                  onOpenVoice(featuredModule);
                }}
                className="p-3 rounded-xl border-2 border-[#c7c4d8] bg-[#faf8ff] hover:bg-[#eaedff] transition-colors flex items-start gap-3 cursor-pointer group"
              >
                <div className="w-10 h-10 rounded-lg bg-[#FEF3C7] text-[#92400E] flex items-center justify-center shrink-0 border border-[#F59E0B] group-hover:scale-105 transition-transform">
                  <span className="material-symbols-outlined text-[24px]">mic</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-[14px] text-[#131b2e] font-extrabold">
                      🎙️ Jawab dengan Suara
                    </span>
                    <span className="text-[12px] text-[#92400E] font-extrabold">Lisan</span>
                  </div>
                  <p className="text-[13px] text-[#464555] mt-0.5 leading-snug">
                    Latihan berbicara dan menjawab pertanyaan secara lisan tanpa perlu mengetik.
                  </p>
                </div>
              </div>

              {/* Feature C: Read Aloud */}
              <div
                onClick={() => {
                  soundEffects.playTap();
                  onOpenAudioNarration(featuredModule);
                }}
                className="p-3 rounded-xl border-2 border-[#c7c4d8] bg-[#faf8ff] hover:bg-[#eaedff] transition-colors flex items-start gap-3 cursor-pointer group"
              >
                <div className="w-10 h-10 rounded-lg bg-[#dae2fd] text-[#3525cd] flex items-center justify-center shrink-0 border border-[#c7c4d8] group-hover:scale-105 transition-transform">
                  <span className="material-symbols-outlined text-[24px]">headphones</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-[14px] text-[#131b2e] font-extrabold">
                      🎧 Dengarkan Bacaan Nyaring
                    </span>
                    <span className="text-[12px] text-[#3525cd] font-extrabold">Narasi</span>
                  </div>
                  <p className="text-[13px] text-[#464555] mt-0.5 leading-snug">
                    Narasi suara lembut menenangkan dengan penunjuk kata berjalan ritmis.
                  </p>
                </div>
              </div>

              {/* Feature D: Adaptive Quiz */}
              <div
                onClick={() => {
                  soundEffects.playTap();
                  onOpenQuiz(featuredModule);
                }}
                className="p-3 rounded-xl border-2 border-[#6cf8bb] text-[#131b2e] bg-[#E6FBF2] flex items-start gap-3 cursor-pointer hover:brightness-95 group transition-colors"
              >
                <div className="w-10 h-10 rounded-lg bg-[#6cf8bb] text-[#00714d] flex items-center justify-center shrink-0 border border-[#006c49] group-hover:scale-105 transition-transform">
                  <span className="material-symbols-outlined text-[24px]">extension</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-[14px] text-[#006c49] font-extrabold">
                      🧩 Kuis Santai Adaptif
                    </span>
                    <span className="text-[12px] bg-[#6cf8bb] text-[#00714d] px-2 py-0.5 rounded-full font-extrabold">
                      +40 XP
                    </span>
                  </div>
                  <p className="text-[13px] text-[#00714d] mt-0.5 leading-snug font-medium">
                    Tantangan seru 3 pertanyaan ramah waktu yang menyesuaikan kemampuanmu.
                  </p>
                </div>
              </div>

              {/* Feature E: Focus Reader */}
              <div
                onClick={() => {
                  soundEffects.playTap();
                  onOpenFocusReader(featuredModule);
                }}
                className="p-3 rounded-xl border-2 border-dashed border-[#0EA5E9] bg-[#F0F9FF] flex items-start gap-3 cursor-pointer hover:bg-[#E0F2FE] transition-colors group"
              >
                <div className="w-10 h-10 rounded-lg bg-[#E0F2FE] text-[#0369A1] flex items-center justify-center shrink-0 border border-[#38BDF8] group-hover:scale-105 transition-transform">
                  <span className="material-symbols-outlined text-[24px]">chrome_reader_mode</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-[14px] text-[#0369A1] font-extrabold">
                      📖 Buka Format Focus Reader
                    </span>
                    <span className="text-[12px] text-[#0369A1] font-extrabold">Aksesibel</span>
                  </div>
                  <p className="text-[13px] text-[#0369A1] mt-0.5 leading-snug font-medium">
                    Penggaris baca khusus &amp; kontras hangat agar mata tidak lelah.
                  </p>
                </div>
              </div>
            </div>

            {/* Primary Tactile Launch Button */}
            <button
              onClick={() => {
                soundEffects.playTap();
                onOpenFlashcards(featuredModule);
              }}
              className="tactile-btn w-full h-[52px] bg-[#4f46e5] text-white rounded-xl font-extrabold text-[16px] flex items-center justify-center gap-2 shadow-[0_4px_0_0_#3525cd] transition-all cursor-pointer hover:brightness-105"
              type="button"
            >
              <span>Mulai Latihan Sekarang</span>
              <span className="material-symbols-outlined text-[22px]">rocket_launch</span>
            </button>
          </article>
        )}

        {/* MODULE 2: Siklus Air & Hujan di Bumi */}
        {siklusModule && (
          <article className="bg-white border-2 border-[#c7c4d8] rounded-2xl p-4 shadow-[0_4px_0_0_#cbd5e1] hover:border-[#4f46e5] transition-colors">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[12px] bg-[#eaedff] text-[#464555] px-2.5 py-1 rounded-md font-bold">
                {siklusModule.subjectBadge}
              </span>
              <div className="flex items-center gap-1.5 text-[#006c49] text-[12px] font-extrabold">
                <span className="material-symbols-outlined text-[16px] fill-icon">verified</span>
                75% Dikuasai
              </div>
            </div>
            <h4 className="text-[18px] font-extrabold text-[#131b2e]">{siklusModule.title}</h4>
            <p className="text-[13px] text-[#464555] mt-1 mb-3 font-medium">
              8 Kartu Tanya Jawab • 1 Kuis Adaptif • Narasi Suara Siap
            </p>

            {/* Progress Bar */}
            <div className="w-full h-2.5 bg-[#e2e7ff] rounded-full overflow-hidden mb-4 border border-[#c7c4d8]">
              <div className="h-full bg-[#006c49] rounded-full" style={{ width: '75%' }}></div>
            </div>

            {/* Action Button */}
            <button
              onClick={() => {
                soundEffects.playTap();
                onOpenFlashcards(siklusModule);
              }}
              className="tactile-btn w-full h-12 bg-[#faf8ff] border-2 border-[#c7c4d8] text-[#131b2e] rounded-xl font-bold text-[14px] flex items-center justify-center gap-2 shadow-[0_3px_0_0_#cbd5e1] hover:bg-[#eaedff]"
              type="button"
            >
              <span>Buka Menu Latihan</span>
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </button>
          </article>
        )}

        {/* MODULE 3: Tata Surya & Planet Kita */}
        {tataSuryaModule && (
          <article className="bg-white border-2 border-[#c7c4d8] rounded-2xl p-4 shadow-[0_4px_0_0_#cbd5e1] hover:border-[#4f46e5] transition-colors">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[12px] bg-[#eaedff] text-[#464555] px-2.5 py-1 rounded-md font-bold">
                {tataSuryaModule.subjectBadge}
              </span>
              <span className="text-[12px] text-[#885500] bg-[#ffddb8] px-2.5 py-1 rounded-md font-extrabold">
                Belum Dicoba
              </span>
            </div>
            <h4 className="text-[18px] font-extrabold text-[#131b2e]">{tataSuryaModule.title}</h4>
            <p className="text-[13px] text-[#464555] mt-1 mb-4 font-medium">
              6 Kartu Siap Latih • Ringkasan visual orbit &amp; gaya gravitasi
            </p>

            {/* Action Button */}
            <button
              onClick={() => {
                soundEffects.playTap();
                onOpenFlashcards(tataSuryaModule);
              }}
              className="tactile-btn w-full h-12 bg-[#faf8ff] border-2 border-[#c7c4d8] text-[#131b2e] rounded-xl font-bold text-[14px] flex items-center justify-center gap-2 shadow-[0_3px_0_0_#cbd5e1] hover:bg-[#eaedff]"
              type="button"
            >
              <span>Buka Menu Latihan</span>
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </button>
          </article>
        )}
      </section>

      {/* Quick Chat AI Assistance Callout Banner */}
      <section className="bg-gradient-to-r from-[#eaedff] to-[#dae2fd] border-2 border-[#c7c4d8] rounded-2xl p-4 shadow-[0_4px_0_0_#cbd5e1] flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-[#4f46e5] text-white flex items-center justify-center shrink-0 shadow-[0_3px_0_0_#3525cd]">
          <span className="material-symbols-outlined text-[26px] fill-icon">smart_toy</span>
        </div>
        <div className="flex-1 min-w-0">
          <h5 className="text-[14px] text-[#131b2e] font-extrabold">Teman AI Selalu Siap Membantu</h5>
          <p className="text-[13px] text-[#464555] leading-snug mt-0.5 font-medium">
            Bingung saat latihan? Sentuh Teman AI di bawah untuk minta bantuan atau buatkan soal latihan baru dari fotomu!
          </p>
        </div>
        <button
          onClick={() => {
            soundEffects.playTap();
            onOpenAiStudioPrompt();
          }}
          className="tactile-btn px-3 py-2 bg-white text-[#3525cd] border border-[#c7c4d8] rounded-xl text-[12px] font-extrabold shadow-sm hover:bg-[#faf8ff] shrink-0"
        >
          Tanya AI
        </button>
      </section>
    </main>
  );
};
