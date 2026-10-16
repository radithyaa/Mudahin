import type React from "react";
import { useState } from "react";
import { canSpeakText } from "../lib/speech-support";
import type { LearningModule } from "../types";
import { soundEffects, speakText } from "../utils/audio";
import { LatihanHistoryView } from "./latihan-history-view";

interface LatihanViewProps {
  /** Perangkat/pengguna baru: pustaka kosong → tawarkan pemulihan data. */
  isFreshDevice?: boolean;
  modules: LearningModule[];
  onOpenAiStudioPrompt: () => void;
  onOpenPractice: (module: LearningModule) => void;
  /** Membuka kartu pemulihan data di halaman Profil (perangkat baru). */
  onOpenRestore?: () => void;
  /** Mengulang latihan lisan sebuah materi (mode tanpa XP). */
  onReplayVoice: (module: LearningModule) => void;
}

/**
 * Pusat Latihan.
 *
 * Menampilkan seluruh materi milik pengguna (dari database) agar dapat dipilih
 * lalu dilatih. Mengetuk materi membuka dialog **Pilih Jenis Latihan** yang sama
 * dengan halaman Belajar, sehingga semua jenis latihan (flashcard, jawab suara,
 * dengarkan bacaan, kuis santai, focus reader) tersedia dengan alur seragam.
 *
 * Dua sub-tab: daftar materi (untuk mulai latihan baru) dan **Riwayat Latihan**
 * (melihat & mengulangi percobaan sebelumnya).
 */
/** Daftar materi siap dilatih + keadaan kosong yang memandu pengguna. */
const PracticeModuleList: React.FC<{
  isFreshDevice?: boolean;
  modules: LearningModule[];
  onOpenPractice: (module: LearningModule) => void;
  onOpenRestore?: () => void;
  visibleModules: LearningModule[];
}> = ({
  modules,
  visibleModules,
  onOpenPractice,
  onOpenRestore,
  isFreshDevice,
}) => {
  const hasNoModules = modules.length === 0;
  const hasNoMatches = !hasNoModules && visibleModules.length === 0;

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-extrabold text-[#131b2e] text-[16px]">
          Modul Siap Latihan ({visibleModules.length})
        </h3>
        <span className="font-extrabold text-[#006c49] text-[12px]">
          ✨ Materi Pustakamu
        </span>
      </div>

      {hasNoModules ? (
        <div className="space-y-3 rounded-2xl border-2 border-[#c7c4d8] border-dashed bg-white p-5 text-center">
          <span className="material-symbols-outlined text-[#3525cd] text-[36px]">
            fitness_center
          </span>
          <p className="font-extrabold text-[#131b2e] text-[15px]">
            {isFreshDevice
              ? "Perangkat ini masih baru"
              : "Belum ada materi untuk dilatih"}
          </p>
          <p className="font-medium text-[#464555] text-[13px] leading-relaxed">
            {isFreshDevice
              ? "Kalau kamu pernah memakai Mudahin di perangkat lain, pulihkan datamu dengan kode cadangan. Kalau belum, buat materi pertamamu lewat Teman AI di halaman Belajar."
              : "Buat materi dulu lewat Teman AI di halaman Belajar, atau pulihkan data lama kalau kamu baru ganti perangkat."}
          </p>
          {onOpenRestore ? (
            <button
              className="tactile-btn min-h-[44px] rounded-xl border-2 border-[#4f46e5] bg-white px-4 py-2.5 font-bold text-[#3525cd] text-[13px] shadow-[0_3px_0_0_#cbd5e1]"
              onClick={() => {
                soundEffects.playTap();
                onOpenRestore();
              }}
              type="button"
            >
              Pulihkan Data dari Kode
            </button>
          ) : null}
        </div>
      ) : null}

      {hasNoMatches ? (
        <p className="rounded-2xl border-2 border-[#c7c4d8] border-dashed bg-white p-4 text-center font-semibold text-[#464555] text-[13px]">
          Tidak ada materi yang cocok dengan pencarianmu.
        </p>
      ) : null}

      {visibleModules.map((mod) => (
        <article
          className="rounded-2xl border-2 border-[#c7c4d8] bg-white p-4 shadow-[0_4px_0_0_#cbd5e1] transition-colors hover:border-[#4f46e5]"
          key={mod.id}
        >
          <div className="mb-2 flex items-center justify-between">
            <span className="rounded-md bg-[#eaedff] px-2.5 py-1 font-bold text-[#464555] text-[12px]">
              {mod.subjectBadge}
            </span>
            <div className="flex items-center gap-1.5 font-extrabold text-[#006c49] text-[12px]">
              <span className="material-symbols-outlined fill-icon text-[16px]">
                schedule
              </span>
              {mod.readTime}
            </div>
          </div>

          <h4 className="font-extrabold text-[#131b2e] text-[18px]">
            {mod.title}
          </h4>
          <p className="mt-1 mb-4 line-clamp-2 font-medium text-[#464555] text-[13px]">
            {mod.description}
          </p>

          <button
            className="tactile-btn flex h-12 w-full items-center justify-center gap-2 rounded-xl border-2 border-[#c7c4d8] bg-[#faf8ff] font-bold text-[#131b2e] text-[14px] shadow-[0_3px_0_0_#cbd5e1] hover:bg-[#eaedff]"
            onClick={() => {
              soundEffects.playTap();
              onOpenPractice(mod);
            }}
            type="button"
          >
            <span>Buka Menu Latihan</span>
            <span className="material-symbols-outlined text-[18px]">
              arrow_forward
            </span>
          </button>
        </article>
      ))}
    </section>
  );
};

export const LatihanView: React.FC<LatihanViewProps> = ({
  modules,
  onOpenPractice,
  onOpenAiStudioPrompt,
  onOpenRestore,
  onReplayVoice,
  isFreshDevice,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState("Semua");
  const [mode, setMode] = useState<"materi" | "riwayat">("materi");

  const speechSupported = canSpeakText();

  const handleAudioGuide = () => {
    soundEffects.playTap();
    speakText(
      "Halo! Ini Pusat Latihan Asyik Mudahin. Di sini kamu bisa melatih pemahaman materi lewat mode santai: kartu flashcard, latihan jawab dengan suara, bacaan nyaring, kuis adaptif, atau focus reader. Pilih materi lalu pilih mode yang paling nyaman buatmu hari ini!"
    );
  };

  // Tag subjek diambil dari materi nyata milik pengguna.
  const subjectTags = [
    "Semua",
    ...Array.from(new Set(modules.map((m) => m.subjectBadge.split(" • ")[0]))),
  ];

  const filteredModules = modules.filter((m) => {
    const query = searchQuery.toLowerCase();
    const matchSearch =
      m.title.toLowerCase().includes(query) ||
      m.description.toLowerCase().includes(query);
    const matchTag =
      selectedTag === "Semua" || m.subjectBadge.startsWith(selectedTag);
    return matchSearch && matchTag;
  });

  return (
    <main className="mx-auto w-full max-w-xl space-y-5 px-4 pt-3 pb-8">
      {/* Sub-tab: Materi (latihan baru) ⇆ Riwayat (lihat & ulangi). */}
      <div
        aria-label="Pilih tampilan latihan"
        className="flex gap-1 rounded-2xl border-2 border-[#c7c4d8] bg-white p-1 shadow-[0_3px_0_0_#cbd5e1]"
        role="tablist"
      >
        {(
          [
            { id: "materi", icon: "sports_esports", label: "Latihan Baru" },
            { id: "riwayat", icon: "history", label: "Riwayat Latihan" },
          ] as const
        ).map((tab) => {
          const isActive = mode === tab.id;
          return (
            <button
              aria-selected={isActive}
              className={`tactile-btn flex h-11 flex-1 items-center justify-center gap-1.5 rounded-xl font-bold text-[13px] transition-colors ${
                isActive
                  ? "bg-[#4f46e5] text-white shadow-[0_2px_0_0_#3525cd]"
                  : "text-[#464555] hover:bg-[#eaedff]"
              }`}
              key={tab.id}
              onClick={() => {
                soundEffects.playTap();
                setMode(tab.id);
              }}
              role="tab"
              type="button"
            >
              <span
                className={`material-symbols-outlined text-[18px] ${isActive ? "fill-icon" : ""}`}
              >
                {tab.icon}
              </span>
              {tab.label}
            </button>
          );
        })}
      </div>

      {mode === "riwayat" ? (
        <LatihanHistoryView
          modules={modules}
          onOpenAiStudioPrompt={onOpenAiStudioPrompt}
          onReplayVoice={onReplayVoice}
        />
      ) : null}

      {mode === "materi" ? (
        <>
          {/* Audio Assist Action Banner */}
          <div>
            <button
              className="tactile-btn group flex w-full items-center justify-between rounded-xl border-2 border-[#c7c4d8] bg-white p-3 text-left shadow-[0_3px_0_0_#c7c4d8] hover:bg-[#eaedff] disabled:opacity-50"
              disabled={!speechSupported}
              onClick={handleAudioGuide}
              title={
                speechSupported
                  ? "Dengarkan panduan belajar"
                  : "Pembacaan suara belum tersedia di perangkat ini"
              }
              type="button"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#dae2fd] text-[#3525cd]">
                  <span className="material-symbols-outlined text-[22px]">
                    volume_up
                  </span>
                </div>
                <div>
                  <span className="block font-extrabold text-[#131b2e] text-[14px]">
                    🔊 Dengarkan Panduan Belajar
                  </span>
                  <span className="font-medium text-[#464555] text-[13px]">
                    Panduan suara tenang dan ramah ADHD
                  </span>
                </div>
              </div>
              <span className="material-symbols-outlined text-[#464555] text-[24px] transition-transform group-hover:translate-x-0.5">
                play_circle
              </span>
            </button>
          </div>

          {/* Friendly Selector & Intro Section */}
          <section className="space-y-3">
            <div>
              <h2 className="font-extrabold text-[#131b2e] text-[24px] tracking-tight">
                Pilih Materi yang Ingin Dilatih
              </h2>
              <p className="mt-1 font-medium text-[#464555] text-[14px] leading-relaxed">
                Ketuk salah satu materi milikmu untuk memilih jenis latihan.
                Soal latihan dibuat otomatis dari isi materi tersebut.
              </p>
            </div>

            {/* Search Box and Tag Filters */}
            {modules.length > 0 ? (
              <div className="space-y-3 pt-1">
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined absolute left-3.5 text-[#777587]">
                    search
                  </span>
                  <input
                    className="min-h-[52px] w-full rounded-xl border-2 border-[#c7c4d8] bg-white pr-4 pl-11 text-[#131b2e] text-[15px] placeholder:text-[#777587] focus:border-[#4f46e5] focus:outline-none focus:ring-4 focus:ring-[#dad7ff]"
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari judul materi..."
                    type="text"
                    value={searchQuery}
                  />
                </div>

                {/* Filter Pills — muncul hanya bila ada beragam subjek nyata. */}
                {subjectTags.length > 2 ? (
                  <div className="scrollbar-none flex gap-2 overflow-x-auto pb-1">
                    {subjectTags.map((tag) => {
                      const isActive = selectedTag === tag;
                      return (
                        <button
                          className={`tactile-chip flex shrink-0 items-center gap-1.5 rounded-full px-4 py-1.5 font-bold text-[13px] transition-colors ${
                            isActive
                              ? "bg-[#4f46e5] text-white shadow-[0_2px_0_0_#3525cd]"
                              : "border-2 border-[#c7c4d8] bg-white text-[#464555] shadow-[0_2px_0_0_#c7c4d8]"
                          }`}
                          key={tag}
                          onClick={() => {
                            soundEffects.playTap();
                            setSelectedTag(tag);
                          }}
                          type="button"
                        >
                          {isActive ? (
                            <span className="material-symbols-outlined text-[16px]">
                              check
                            </span>
                          ) : null}
                          <span>{tag}</span>
                        </button>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            ) : null}
          </section>

          {/* Daftar Modul Materi Siap Latihan */}
          <PracticeModuleList
            isFreshDevice={isFreshDevice}
            modules={modules}
            onOpenPractice={onOpenPractice}
            onOpenRestore={onOpenRestore}
            visibleModules={filteredModules}
          />

          {/* Quick Chat AI Assistance Callout Banner */}
          <section className="flex items-center gap-3 rounded-2xl border-2 border-[#c7c4d8] bg-gradient-to-r from-[#eaedff] to-[#dae2fd] p-4 shadow-[0_4px_0_0_#cbd5e1]">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#4f46e5] text-white shadow-[0_3px_0_0_#3525cd]">
              <span className="material-symbols-outlined fill-icon text-[26px]">
                smart_toy
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <h5 className="font-extrabold text-[#131b2e] text-[14px]">
                Teman AI Selalu Siap Membantu
              </h5>
              <p className="mt-0.5 font-medium text-[#464555] text-[13px] leading-snug">
                Bingung saat latihan? Buat materi baru dari catatan atau fotomu
                di halaman Belajar, lalu kembali ke sini!
              </p>
            </div>
            <button
              className="tactile-btn shrink-0 rounded-xl border border-[#c7c4d8] bg-white px-3 py-2 font-extrabold text-[#3525cd] text-[12px] shadow-sm hover:bg-[#faf8ff]"
              onClick={() => {
                soundEffects.playTap();
                onOpenAiStudioPrompt();
              }}
              type="button"
            >
              Tanya AI
            </button>
          </section>
        </>
      ) : null}
    </main>
  );
};
