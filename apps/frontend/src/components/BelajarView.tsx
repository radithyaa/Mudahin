import React, { useState, useRef } from 'react';
import { LearningModule, DailyMission } from '../types';
import { soundEffects, speakText } from '../utils/audio';

interface BelajarViewProps {
  modules: LearningModule[];
  missions: DailyMission[];
  onOpenReader: (module: LearningModule) => void;
  onOpenQuiz: (module: LearningModule) => void;
  onGenerateModule: (text: string, files: string[]) => void;
  isGenerating: boolean;
  onToggleFontSize: () => void;
  currentFontSize: string;
  onToggleRuler: () => void;
  rulerActive: boolean;
  onToggleWarm: () => void;
  warmActive: boolean;
  onGoToLatihan: () => void;
}

export const BelajarView: React.FC<BelajarViewProps> = ({
  modules,
  missions,
  onOpenReader,
  onOpenQuiz,
  onGenerateModule,
  isGenerating,
  onToggleFontSize,
  currentFontSize,
  onToggleRuler,
  rulerActive,
  onToggleWarm,
  warmActive,
  onGoToLatihan,
}) => {
  const [inputText, setInputText] = useState('');
  const [attachedFiles, setAttachedFiles] = useState<string[]>([
    'catatan_biologi_bab3.jpg',
    'diagram_sel.png',
  ]);
  const [selectedFilter, setSelectedFilter] = useState('Semua Materi');
  const [isListeningMic, setIsListeningMic] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Compute daily mission stats
  const completedMissionsCount = missions.filter((m) => m.completed).length;
  const missionProgressPct = Math.round((completedMissionsCount / missions.length) * 100);

  const fotosintesisModule = modules.find((m) => m.id === 'fotosintesis') || modules[0];

  const handleRemoveFile = (fileName: string) => {
    soundEffects.playTap();
    setAttachedFiles((prev) => prev.filter((f) => f !== fileName));
  };

  const handleAddSamplePhoto = () => {
    soundEffects.playTap();
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAttachedFiles((prev) => [...prev, file.name]);
    }
  };

  const handleAddPdf = () => {
    soundEffects.playTap();
    const samplePdfs = ['ringkasan_bab4.pdf', 'modul_ekosistem.pdf', 'tata_surya.pdf'];
    const chosen = samplePdfs[Math.floor(Math.random() * samplePdfs.length)];
    if (!attachedFiles.includes(chosen)) {
      setAttachedFiles((prev) => [...prev, chosen]);
    }
  };

  const handleVoiceInput = () => {
    soundEffects.playTap();
    setIsListeningMic(true);

    const SpeechRec =
      (window as unknown as { SpeechRecognition?: any; webkitSpeechRecognition?: any })
        .SpeechRecognition ||
      (window as unknown as { SpeechRecognition?: any; webkitSpeechRecognition?: any })
        .webkitSpeechRecognition;

    if (SpeechRec) {
      try {
        const rec = new SpeechRec();
        rec.lang = 'id-ID';
        rec.onresult = (ev: any) => {
          const spoken = ev.results[0][0].transcript;
          setInputText((prev) => (prev ? `${prev} ${spoken}` : spoken));
          setIsListeningMic(false);
        };
        rec.onerror = () => setIsListeningMic(false);
        rec.onend = () => setIsListeningMic(false);
        rec.start();
        return;
      } catch {
        // simulation
      }
    }

    setTimeout(() => {
      setInputText('Jelaskan sistem peredaran darah manusia dan cara kerja jantung');
      setIsListeningMic(false);
    }, 1500);
  };

  const handleOlahMateri = () => {
    soundEffects.playTap();
    onGenerateModule(inputText, attachedFiles);
    setInputText('');
  };

  const handleSuaraRamah = () => {
    soundEffects.playTap();
    speakText(
      'Halo Rian! Semangat pagi! Hari ini ada satu bacaan fokus dan kuis santai yang sudah disiapkan Teman AI untukmu. Selamat belajar tanpa stres!'
    );
  };

  // Filter modules
  const filteredModules = modules.filter((m) => {
    if (selectedFilter === 'Semua Materi') return true;
    if (selectedFilter === 'Sains Biologi') return m.category === 'Sains' && m.subjectBadge.includes('Biologi');
    if (selectedFilter === 'Matematika Santai') return m.category === 'Sains' && m.title.includes('Matematika');
    if (selectedFilter === 'Bahasa') return m.category === 'Bahasa';
    return true;
  });

  return (
    <main className="w-full max-w-xl mx-auto px-4 pt-5 space-y-5 pb-28">
      {/* Hidden file input for real attachments */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.pdf"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Hero / Welcome Greeting */}
      <section className="space-y-1">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#eaedff] text-[#3525cd] rounded-full text-[12px] font-bold">
          <span className="material-symbols-outlined text-[16px]">waving_hand</span>
          <span>Semangat Pagi</span>
        </div>
        <h1 className="text-[24px] sm:text-[26px] text-[#131b2e] font-extrabold tracking-tight">
          Halo Rian! Mau belajar apa hari ini?
        </h1>
        <p className="text-[14px] text-[#464555] font-medium">
          Tulis topik bebas, atau unggah foto catatan belajarmu biar Teman AI rapikan.
        </p>
      </section>

      {/* Daily Mission Card (Misi Seru Hari Ini) */}
      <section className="bg-gradient-to-r from-[#FEF3C7] to-[#FFFBEB] rounded-3xl p-4 sm:p-5 border-2 border-[#F59E0B] shadow-[0_4px_0_0_#D97706] space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#F59E0B] text-white flex items-center justify-center shadow-[0_2px_0_0_#D97706] flex-shrink-0">
              <span className="material-symbols-outlined text-[24px]">military_tech</span>
            </div>
            <div>
              <span className="inline-block text-[11px] font-bold text-[#92400E] uppercase tracking-wider bg-white/70 px-2 py-0.5 rounded-full border border-[#F59E0B]/30">
                Misi Seru Hari Ini
              </span>
              <h2 className="text-[17px] sm:text-[18px] text-[#78350F] font-extrabold leading-tight">
                1 Bacaan Fokus &amp; Kuis Adaptif
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-1 bg-white/90 border-2 border-[#F59E0B] text-[#B45309] px-2.5 py-1 rounded-xl text-[12px] font-bold shadow-[0_2px_0_0_#D97706] flex-shrink-0">
            <span className="material-symbols-outlined text-[16px] text-[#D97706] fill-icon">stars</span>
            <span>+50 XP Bonus</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-[12px] text-[#92400E]">
            <span className="font-bold">Progres Misi Harian</span>
            <span className="font-extrabold">
              {completedMissionsCount} dari {missions.length} Selesai ({missionProgressPct}%)
            </span>
          </div>
          <div className="w-full h-3 bg-white/80 rounded-full overflow-hidden border border-[#F59E0B]/40 p-0.5">
            <div
              className="h-full bg-[#F59E0B] rounded-full shadow-[0_1px_0_0_#D97706] transition-all duration-300"
              style={{ width: `${missionProgressPct}%` }}
            ></div>
          </div>
        </div>

        {/* Missions Sub-Items */}
        <div className="space-y-2 pt-1">
          {/* Mission 1: Bacaan */}
          <div
            onClick={() => onOpenReader(fotosintesisModule)}
            className="flex items-center justify-between p-2.5 bg-white/95 rounded-xl border border-[#34D399] shadow-sm cursor-pointer hover:bg-white"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-6 h-6 rounded-full bg-[#22C55E] text-white flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-[16px] font-bold">check</span>
              </div>
              <div className="min-w-0">
                <p className="text-[14px] font-bold text-[#14532D] truncate line-through opacity-80">
                  Bacaan Fokus (Fotosintesis)
                </p>
                <span className="text-[11px] font-bold text-[#16A34A]">Selesai • Berhasil dapat +20 XP</span>
              </div>
            </div>
            <span className="text-[#006c49] text-[12px] font-bold flex-shrink-0">Selesai</span>
          </div>

          {/* Mission 2: Kuis */}
          <div
            onClick={() => onOpenQuiz(fotosintesisModule)}
            className={`flex items-center justify-between p-2.5 bg-white/95 rounded-xl border-2 shadow-sm cursor-pointer hover:bg-white ${
              missions[1]?.completed ? 'border-[#34D399]' : 'border-[#4f46e5]'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                  missions[1]?.completed
                    ? 'bg-[#22C55E] text-white'
                    : 'border-2 border-[#4f46e5] bg-[#faf8ff] text-[#3525cd]'
                }`}
              >
                <span className="material-symbols-outlined text-[14px]">
                  {missions[1]?.completed ? 'check' : 'arrow_forward'}
                </span>
              </div>
              <div className="min-w-0">
                <p className="text-[14px] font-bold text-[#131b2e] truncate">
                  Kuis Santai Adaptif (3 Soal)
                </p>
                <span className="text-[11px] font-bold text-[#3525cd]">
                  {missions[1]?.completed ? 'Selesai • +30 XP Didapat' : 'Siap Dikerjakan • Hadiah +30 XP'}
                </span>
              </div>
            </div>
            <span
              className={`font-extrabold text-[12px] px-2 py-0.5 rounded-md flex-shrink-0 ${
                missions[1]?.completed
                  ? 'text-[#006c49] bg-[#E8F8F0]'
                  : 'text-[#4f46e5] bg-[#eaedff]'
              }`}
            >
              {missions[1]?.completed ? 'Selesai' : 'Siap'}
            </span>
          </div>
        </div>

        {/* Mission CTA */}
        <button
          onClick={() => {
            soundEffects.playTap();
            if (!missions[1]?.completed) {
              onOpenQuiz(fotosintesisModule);
            } else {
              onGoToLatihan();
            }
          }}
          className="tactile-btn w-full min-h-[48px] py-2.5 px-4 bg-[#F59E0B] hover:brightness-105 active:brightness-95 text-white rounded-2xl font-bold text-[14px] flex items-center justify-center gap-2 shadow-[0_3px_0_0_#B45309]"
          type="button"
        >
          <span className="material-symbols-outlined text-[20px] fill-icon">bolt</span>
          <span>{missions[1]?.completed ? 'Misi Hari Ini Selesai! Buka Latihan' : 'Lanjutkan Misi Hari Ini'}</span>
        </button>
      </section>

      {/* Prominent AI Learning Studio Input Box (Tactile Level 1 Plinth) */}
      <section className="bg-white rounded-3xl p-4 sm:p-5 border-2 border-[#CBD5E1] shadow-[0_4px_0_0_#CBD5E1] space-y-4">
        {/* Textarea Input Area */}
        <div className="relative">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="w-full p-3.5 bg-[#f2f3ff] text-[#131b2e] placeholder:text-[#777587] text-[15px] font-medium rounded-2xl border-2 border-[#c7c4d8] focus:border-[#4f46e5] focus:bg-white focus:ring-4 focus:ring-[#eaedff] outline-none resize-none transition-all duration-150"
            placeholder="Tulis topik atau tanya apa saja, misal: Fotosintesis pada tumbuhan..."
            rows={3}
          />
        </div>

        {/* Attached Files Micro-List */}
        {attachedFiles.length > 0 && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[12px] text-[#464555] px-1 font-semibold">
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px] text-[#3525cd]">attach_file</span>
                Catatan Terlampir ({attachedFiles.length} File)
              </span>
              <span className="text-[#006c49] font-bold">Siap diolah</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {attachedFiles.map((file, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2.5 bg-[#eaedff] rounded-xl border border-[#c7c4d8]"
                >
                  <div className="flex items-center gap-2 overflow-hidden">
                    <span className="material-symbols-outlined text-[#3525cd] text-[20px] flex-shrink-0">
                      {file.endsWith('.pdf') ? 'description' : file.includes('diagram') ? 'draw' : 'image'}
                    </span>
                    <span className="text-[13px] font-bold text-[#131b2e] truncate">{file}</span>
                  </div>
                  <button
                    onClick={() => handleRemoveFile(file)}
                    aria-label={`Hapus ${file}`}
                    className="p-1 hover:bg-[#dae2fd] rounded-lg text-[#777587] hover:text-[#ba1a1a] transition-colors"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[18px]">close</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Attachment Row & Voice Input */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100">
          {/* Photo Button */}
          <button
            onClick={handleAddSamplePhoto}
            className="tactile-btn flex items-center gap-1.5 px-3 py-2 bg-[#eaedff] hover:bg-[#dae2fd] rounded-xl border-2 border-[#c7c4d8] text-[#131b2e] text-[13px] font-bold min-h-[44px] shadow-[0_3px_0_0_#CBD5E1]"
            type="button"
          >
            <span className="material-symbols-outlined text-[#3525cd] text-[18px]">photo_camera</span>
            <span>+ Foto Catatan</span>
          </button>

          {/* Document / PDF Button */}
          <button
            onClick={handleAddPdf}
            className="tactile-btn flex items-center gap-1.5 px-3 py-2 bg-[#eaedff] hover:bg-[#dae2fd] rounded-xl border-2 border-[#c7c4d8] text-[#131b2e] text-[13px] font-bold min-h-[44px] shadow-[0_3px_0_0_#CBD5E1]"
            type="button"
          >
            <span className="material-symbols-outlined text-[#006c49] text-[18px]">description</span>
            <span>+ File PDF</span>
          </button>

          {/* Mic / Voice Button */}
          <button
            onClick={handleVoiceInput}
            className={`tactile-btn ml-auto flex items-center gap-1 px-3 py-2 rounded-xl border-2 text-[13px] font-bold min-h-[44px] shadow-[0_3px_0_0_#DC2626] ${
              isListeningMic
                ? 'bg-[#FCA5A5] border-[#DC2626] text-[#7F1D1D] animate-pulse'
                : 'bg-[#FEE2E2] hover:bg-[#FECACA] border-[#EF4444] text-[#991B1B]'
            }`}
            type="button"
          >
            <span className="material-symbols-outlined text-[18px] text-[#DC2626] fill-icon">mic</span>
            <span className="hidden sm:inline">{isListeningMic ? 'Mendengarkan...' : 'Bicara'}</span>
          </button>
        </div>

        {/* Primary Action CTA Button */}
        <button
          onClick={handleOlahMateri}
          disabled={isGenerating}
          className="tactile-btn w-full min-h-[52px] py-3.5 px-4 bg-[#4f46e5] hover:brightness-105 active:brightness-95 text-white rounded-2xl font-bold text-[16px] flex items-center justify-center gap-2 shadow-[0_4px_0_0_#3525cd] transition-all cursor-pointer disabled:opacity-50"
          type="button"
        >
          <span className="material-symbols-outlined text-[22px] fill-icon">
            {isGenerating ? 'hourglass_top' : 'auto_awesome'}
          </span>
          <span>{isGenerating ? 'Teman AI Sedang Mengolah...' : 'Olah Materi dengan Teman AI'}</span>
        </button>

        {/* Friendly Human Helper Note */}
        <div className="flex items-start gap-2 p-2.5 rounded-xl bg-[#f2f3ff] text-[#464555] text-[13px] font-medium">
          <span className="material-symbols-outlined text-[#3525cd] text-[20px] flex-shrink-0 mt-0.5">
            sentiment_satisfied
          </span>
          <p className="leading-snug">
            Kirim foto atau catatan tanganmu, Teman AI akan menyusunkan ringkasan santai dan latihan seru!
          </p>
        </div>
      </section>

      {/* Quick Accessibility Shortcuts (Pintasan Aksesibilitas Cepat) */}
      <section className="bg-[#f2f3ff] rounded-2xl p-3.5 border-2 border-[#c7c4d8] space-y-2.5 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[13px] font-extrabold text-[#131b2e]">
            <span className="material-symbols-outlined text-[#3525cd] text-[20px]">tune</span>
            <span>Pintasan Aksesibilitas Cepat</span>
          </div>
          <span className="text-[11px] font-bold text-[#006c49] bg-[#E8F8F0] px-2 py-0.5 rounded-full">
            Ramah Disleksia &amp; ADHD
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {/* Text Size */}
          <button
            onClick={() => {
              soundEffects.playTap();
              onToggleFontSize();
            }}
            aria-label="Perbesar Huruf"
            className="tactile-btn flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-white border-2 border-[#c7c4d8] hover:border-[#4f46e5] text-[#131b2e] text-[13px] font-bold min-h-[44px] shadow-[0_2px_0_0_#CBD5E1]"
            type="button"
          >
            <span className="material-symbols-outlined text-[#3525cd] text-[18px]">format_size</span>
            <span>Ukuran Teks ({currentFontSize.toUpperCase()})</span>
          </button>

          {/* Reading Ruler */}
          <button
            onClick={() => {
              soundEffects.playTap();
              onToggleRuler();
            }}
            aria-label="Aktifkan Garis Pembimbing Baca"
            className={`tactile-btn flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl border-2 text-[13px] font-bold min-h-[44px] shadow-[0_2px_0_0_#CBD5E1] ${
              rulerActive
                ? 'bg-[#FEF3C7] border-[#F59E0B] text-[#92400E]'
                : 'bg-white border-[#c7c4d8] hover:border-[#4f46e5] text-[#131b2e]'
            }`}
            type="button"
          >
            <span className="material-symbols-outlined text-[#006c49] text-[18px]">straighten</span>
            <span>Garis Baca {rulerActive ? 'Aktif' : ''}</span>
          </button>

          {/* Friendly Voice */}
          <button
            onClick={handleSuaraRamah}
            aria-label="Nyalakan Suara Narasi"
            className="tactile-btn flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-white border-2 border-[#c7c4d8] hover:border-[#4f46e5] text-[#131b2e] text-[13px] font-bold min-h-[44px] shadow-[0_2px_0_0_#CBD5E1]"
            type="button"
          >
            <span className="material-symbols-outlined text-[#D97706] text-[18px]">volume_up</span>
            <span>Suara Ramah</span>
          </button>

          {/* Warm Color */}
          <button
            onClick={() => {
              soundEffects.playTap();
              onToggleWarm();
            }}
            aria-label="Filter Warna Hangat Mata Nyaman"
            className={`tactile-btn flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl border-2 text-[13px] font-bold min-h-[44px] shadow-[0_2px_0_0_#D97706] ${
              warmActive
                ? 'bg-[#FEF3C7] border-[#F59E0B] text-[#92400E]'
                : 'bg-[#FEF3C7]/60 border-[#F59E0B] text-[#92400E]'
            }`}
            type="button"
          >
            <span className="material-symbols-outlined text-[#D97706] text-[18px]">wb_incandescent</span>
            <span>Warna Hangat</span>
          </button>
        </div>
      </section>

      {/* Recent AI Generation Live Status Callout */}
      <section className="bg-[#F0FDF4] border-2 border-[#22C55E] rounded-2xl p-4 shadow-[0_4px_0_0_#16A34A] flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl bg-[#22C55E] text-white flex items-center justify-center flex-shrink-0 shadow-[0_2px_0_0_#15803D]">
          <span className="material-symbols-outlined text-[24px]">task_alt</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-[#16A34A] animate-pulse"></span>
            <span className="text-[12px] text-[#166534] uppercase tracking-wider font-extrabold">
              Baru Selesai
            </span>
          </div>
          <p className="text-[14px] text-[#14532D] font-bold truncate">
            Catatan Biologi Bab 3 berhasil diolah!
          </p>
          <p className="text-[12px] text-[#166534] truncate">
            Modul ramah baca &amp; 5 kuis santai siap dinikmati.
          </p>
        </div>
        <button
          onClick={() => onOpenReader(fotosintesisModule)}
          className="tactile-btn flex-shrink-0 px-3 py-2 bg-white text-[#166534] border-2 border-[#16A34A] rounded-xl text-[12px] font-bold shadow-[0_3px_0_0_#16A34A] hover:bg-[#DCFCE7]"
          type="button"
        >
          Buka Bacaan
        </button>
      </section>

      {/* Section: Lanjut Belajar Terakhir */}
      <section className="bg-white rounded-3xl p-4 sm:p-5 border-2 border-[#4f46e5] shadow-[0_4px_0_0_#3525cd] space-y-3.5">
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#4f46e5] text-white text-[12px] font-bold">
            <span className="material-symbols-outlined text-[14px]">history</span>
            Lanjut Belajar Terakhir
          </span>

          <span className="inline-flex items-center gap-1 text-[12px] font-bold text-[#464555] bg-[#eaedff] px-2.5 py-0.5 rounded-md">
            <span className="material-symbols-outlined text-[14px] text-[#3525cd]">timer</span>
            Sisa ~2 menit
          </span>
        </div>

        <div>
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-[18px] font-extrabold text-[#131b2e] leading-tight">
                Fotosintesis &amp; Tumbuhan Hijau
              </h3>
              <p className="text-[14px] text-[#3525cd] font-semibold mt-0.5">
                Sedang di Paragraf 4 • Bagian Klorofil &amp; Energi Sinar
              </p>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-[#E8F8F0] text-[#006c49] flex items-center justify-center flex-shrink-0 shadow-[0_2px_0_0_#005236]">
              <span className="material-symbols-outlined text-[24px]">local_florist</span>
            </div>
          </div>
        </div>

        <div className="space-y-1.5 bg-[#f2f3ff] p-3 rounded-2xl border border-[#c7c4d8]">
          <div className="flex justify-between items-center text-[12px]">
            <span className="text-[#464555] font-medium">Progres Bacaan Terakhir</span>
            <span className="text-[#3525cd] font-extrabold">65% Selesai</span>
          </div>
          <div className="w-full h-3 bg-[#eaedff] rounded-full overflow-hidden border border-[#c7c4d8] p-0.5">
            <div
              className="h-full bg-[#4f46e5] rounded-full shadow-[0_1px_0_0_#3525cd]"
              style={{ width: '65%' }}
            ></div>
          </div>
        </div>

        <div className="pt-0.5">
          <button
            onClick={() => onOpenReader(fotosintesisModule)}
            className="tactile-btn w-full min-h-[48px] py-3 px-4 bg-[#4f46e5] hover:brightness-105 active:brightness-95 text-white rounded-xl font-bold text-[14px] flex items-center justify-center gap-2 shadow-[0_3px_0_0_#3525cd] cursor-pointer"
            type="button"
          >
            <span className="material-symbols-outlined text-[20px] fill-icon">play_arrow</span>
            <span>Lanjut Baca Sekarang</span>
          </button>
        </div>
      </section>

      {/* Section: Koleksi Bacaan Kamu */}
      <section className="space-y-3 pt-2">
        {/* Header & Filter Row */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-[20px] text-[#131b2e] font-extrabold flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[#3525cd] text-[24px]">menu_book</span>
              Koleksi Bacaan Kamu
            </h2>
            <span className="text-[12px] font-bold text-[#464555]">{modules.length} Modul Aktif</span>
          </div>

          {/* Filter Chips (Horizontal Scroll) */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            {['Semua Materi', 'Sains Biologi', 'Matematika Santai', 'Bahasa'].map((f) => {
              const isSelected = selectedFilter === f;
              return (
                <button
                  key={f}
                  onClick={() => {
                    soundEffects.playTap();
                    setSelectedFilter(f);
                  }}
                  className={`px-3.5 py-1.5 rounded-full font-bold text-[12px] flex-shrink-0 transition-colors ${
                    isSelected
                      ? 'bg-[#4f46e5] text-white border-2 border-[#3525cd] shadow-[0_2px_0_0_#3525cd]'
                      : 'bg-white text-[#131b2e] hover:bg-[#eaedff] border-2 border-[#c7c4d8]'
                  }`}
                  type="button"
                >
                  {f}
                </button>
              );
            })}
          </div>
        </div>

        {/* Modules List */}
        <div className="space-y-4">
          {filteredModules.map((mod) => (
            <article
              key={mod.id}
              className="bg-white rounded-2xl p-4 sm:p-5 border-2 border-[#CBD5E1] shadow-[0_4px_0_0_#CBD5E1] hover:border-[#4f46e5] transition-colors"
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <span className="inline-flex items-center gap-1 text-[12px] font-bold bg-[#E8F8F0] text-[#006C49] px-2.5 py-0.5 rounded-md mb-1.5">
                    <span className="material-symbols-outlined text-[14px]">psychology</span>
                    {mod.sourceBadge}
                  </span>
                  <h3 className="text-[17px] sm:text-[18px] text-[#131b2e] font-extrabold">{mod.title}</h3>
                </div>
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: mod.iconBg, color: mod.iconColor }}
                >
                  <span className="material-symbols-outlined text-[24px]">{mod.iconName}</span>
                </div>
              </div>

              <p className="text-[14px] text-[#464555] line-clamp-2 mb-3 leading-relaxed">
                {mod.description}
              </p>

              {/* Accessibility & Format Badges */}
              <div className="flex flex-wrap gap-1.5 mb-4">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#f2f3ff] text-[#131b2e] rounded-lg text-[12px] font-bold border border-[#c7c4d8]">
                  <span className="material-symbols-outlined text-[14px] text-[#3525cd]">schedule</span>
                  {mod.readTime}
                </span>

                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#EEF2FF] text-[#3525cd] rounded-lg text-[12px] font-bold border border-[#c3c0ff]">
                  <span className="material-symbols-outlined text-[14px]">visibility</span>
                  Font Ramah Mata
                </span>

                {mod.hasAudio && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#FEF3C7] text-[#92400E] rounded-lg text-[12px] font-bold border border-[#F59E0B]">
                    <span className="material-symbols-outlined text-[14px]">volume_up</span>
                    Ada Audio
                  </span>
                )}
              </div>

              {/* Card Tactile Action Buttons */}
              <div className="grid grid-cols-2 gap-2.5 pt-1">
                <button
                  onClick={() => onOpenReader(mod)}
                  className="tactile-btn min-h-[48px] px-3 py-2.5 bg-white hover:bg-[#f2f3ff] text-[#131b2e] rounded-xl border-2 border-[#CBD5E1] font-bold text-[14px] flex items-center justify-center gap-1.5 shadow-[0_3px_0_0_#CBD5E1]"
                  type="button"
                >
                  <span className="material-symbols-outlined text-[20px] text-[#3525cd]">menu_book</span>
                  <span>Baca di Reader</span>
                </button>

                <button
                  onClick={() => onOpenQuiz(mod)}
                  className="tactile-btn min-h-[48px] px-3 py-2.5 bg-[#006c49] hover:brightness-110 active:brightness-95 text-white rounded-xl font-bold text-[14px] flex items-center justify-center gap-1.5 shadow-[0_3px_0_0_#005236]"
                  type="button"
                >
                  <span className="material-symbols-outlined text-[20px]">sports_esports</span>
                  <span>Latihan Seru</span>
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Inclusive Friendly Tip / Wellness Anchor */}
      <section className="bg-[#eaedff] rounded-2xl p-4 border border-[#c7c4d8] flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-[#3525cd] flex-shrink-0 shadow-[0_2px_0_0_#CBD5E1]">
          <span className="material-symbols-outlined text-[22px]">hearing</span>
        </div>
        <div className="flex-1 text-[13px] text-[#464555] leading-snug">
          <span className="font-bold text-[#131b2e]">Tips Belajar Nyaman:</span> Sedang lelah membaca?
          Klik tombol <strong className="text-[#3525cd] font-bold">Ada Audio</strong> pada tiap materi
          untuk mendengarkan narasi suara santai.
        </div>
      </section>
    </main>
  );
};
