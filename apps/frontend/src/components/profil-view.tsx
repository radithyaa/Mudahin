import confetti from "canvas-confetti";
import type React from "react";
import { useState } from "react";
import { useDeviceBackup } from "../lib/hooks/use-device-backup";
import { soundEffects } from "../utils/audio";

/** Setelan aksesibilitas yang ikut dicadangkan & dipulihkan. */
export interface BackupSettings {
  dyslexiaFont: boolean;
  fontSize: "sm" | "md" | "lg" | "xl";
  readingRuler: boolean;
  speechSpeed: number;
  warmTheme: boolean;
}

interface ProfilViewProps {
  canClaimBonus: boolean;
  completedMissions: number;
  onClaimDailyBonus: () => void;
  /**
   * Dipanggil setelah data berhasil dipulihkan dari kode cadangan.
   *
   * Komponen ini tidak menulis ke store langsung (batas UI ⇆ `lib/`), jadi
   * pemilik state di `app.tsx` yang menyamakan setelan & mengambil ulang data.
   */
  onRestored: (info: {
    gamification: {
      xp: number;
      lastActiveDate: string | null;
      streakDays: number;
    };
    materials: number;
    progress: number;
    settings: BackupSettings;
  }) => void;
  /** Ringkasan progres dari server (`progress.summary`), bila tersedia. */
  progress?: {
    quizzedCount: number;
    averageScore: number;
  };
  /** Setelan aksesibilitas aktif untuk dicadangkan ke server. */
  settings: BackupSettings;
  streakDays: number;
  xp: number;
}

/**
 * Profil & Progres.
 *
 * Menampilkan gamifikasi (XP/level/lencana) plus ringkasan progres dari server,
 * dan menyediakan **cadangan data lintas perangkat** lewat kode cadangan
 * (`backup.save` / `backup.load`) — tanpa akun.
 *
 * Tanpa pemulihan, perangkat baru selalu mulai dari nol; kartu di bawah inilah
 * satu-satunya pintu untuk membawa kembali setelan, pustaka materi, dan skor.
 */
export const ProfilView: React.FC<ProfilViewProps> = ({
  xp,
  streakDays,
  completedMissions,
  onClaimDailyBonus,
  canClaimBonus,
  settings,
  onRestored,
  progress,
}) => {
  const { createBackup, restoreBackup, isSaving } = useDeviceBackup();
  const [syncCode, setSyncCode] = useState("");
  const [backupStatus, setBackupStatus] = useState<string | null>(null);
  const [backupFailed, setBackupFailed] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  const currentLevel = Math.floor(xp / 50) + 1;
  const currentLevelProgress = xp % 50;
  const levelProgressPct = Math.round((currentLevelProgress / 50) * 100);

  const averageScore = progress?.averageScore ?? 0;
  const quizzedCount = progress?.quizzedCount ?? 0;

  const badges = [
    {
      id: "b1",
      title: "Kutu Buku Santai",
      desc: "Membaca materi dengan tempo fokus",
      icon: "auto_stories",
      color: "#4f46e5",
      bg: "#EDE9FE",
      unlocked: xp >= 20,
    },
    {
      id: "b2",
      title: "Penjelajah Suara",
      desc: "Berani menjawab soal secara lisan",
      icon: "mic",
      color: "#D97706",
      bg: "#FEF3C7",
      unlocked: xp >= 40,
    },
    {
      id: "b3",
      title: "Master Kuis Adaptif",
      desc: "Menuntaskan kuis dari materi",
      icon: "military_tech",
      color: "#006c49",
      bg: "#E8F8F0",
      unlocked: quizzedCount > 0,
    },
    {
      id: "b4",
      title: "Pemberani Catatan AI",
      desc: "Mengolah catatan dengan Teman AI",
      icon: "auto_awesome",
      color: "#7E22CE",
      bg: "#F3E8FF",
      unlocked: completedMissions > 0,
    },
  ];

  /** Menyimpan snapshot seluruh data perangkat dengan kode pilihan pengguna. */
  const handleSave = async () => {
    const code = syncCode.trim();
    soundEffects.playTap();
    if (code.length < 4) {
      setBackupFailed(true);
      setBackupStatus("Kode cadangan minimal 4 karakter.");
      return;
    }
    try {
      const result = await createBackup(code, settings);
      setBackupFailed(false);
      setBackupStatus(
        `Data tersimpan: ${result.materials} materi & ${result.progress} skor. Simpan kode ini: ${code}`
      );
    } catch {
      setBackupFailed(true);
      setBackupStatus(
        "Gagal menyimpan cadangan. Periksa koneksi lalu coba lagi."
      );
    }
  };

  /** Memulihkan seluruh data (setelan, pustaka materi, skor) dari kode. */
  const handleLoad = async () => {
    const code = syncCode.trim();
    soundEffects.playTap();
    if (code.length < 4) {
      setBackupFailed(true);
      setBackupStatus("Kode cadangan minimal 4 karakter.");
      return;
    }
    try {
      setIsRestoring(true);
      const restored = await restoreBackup(code);
      if (!restored) {
        setBackupFailed(true);
        setBackupStatus("Kode tidak ditemukan. Periksa kembali kodenya.");
        return;
      }
      onRestored({
        gamification: restored.gamification,
        materials: restored.materials,
        progress: restored.progress,
        settings: restored.settings,
      });
      setBackupFailed(false);
      setBackupStatus(
        `Berhasil dipulihkan: ${restored.materials} materi & ${restored.progress} skor. Progres dan setelan aksesibilitasmu sudah kembali!`
      );
    } catch {
      setBackupFailed(true);
      setBackupStatus("Gagal memulihkan data. Periksa koneksi lalu coba lagi.");
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <main className="mx-auto w-full max-w-xl space-y-5 px-4 pt-4 pb-8">
      {/* Profile Card Header */}
      <section className="space-y-4 rounded-3xl border-2 border-[#4f46e5] bg-white p-5 shadow-[0_4px_0_0_#3525cd]">
        <div className="flex items-center gap-3.5">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border-4 border-[#faf8ff] bg-[#4f46e5] font-extrabold text-[26px] text-white shadow-[0_3px_0_0_#3525cd]">
            M
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h2 className="truncate font-extrabold text-[#131b2e] text-[20px] leading-tight">
                Pelajar Mudahin
              </h2>
              <span className="rounded-md bg-[#eaedff] px-2 py-0.5 font-extrabold text-[#3525cd] text-[11px]">
                Level {currentLevel}
              </span>
            </div>
            <p className="mt-0.5 font-medium text-[#464555] text-[13px]">
              Pelajar Aktif • Ramah Belajar Santai
            </p>
          </div>
        </div>

        <div className="space-y-1.5 rounded-2xl border border-[#c7c4d8] bg-[#f2f3ff] p-3">
          <div className="flex items-center justify-between font-bold text-[12px]">
            <span className="text-[#464555]">
              Progres ke Level {currentLevel + 1}
            </span>
            <span className="font-extrabold text-[#3525cd]">
              {currentLevelProgress} / 50 XP ({levelProgressPct}%)
            </span>
          </div>
          <div className="h-3 w-full overflow-hidden rounded-full border border-[#c7c4d8] bg-[#eaedff] p-0.5">
            <div
              className="h-full rounded-full bg-[#4f46e5] shadow-[0_1px_0_0_#3525cd] transition-all duration-300"
              style={{ width: `${levelProgressPct}%` }}
            />
          </div>
        </div>
      </section>

      {/* Progress Summary from Backend */}
      <section className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border-2 border-[#c7c4d8] bg-white p-4 shadow-[0_3px_0_0_#cbd5e1]">
          <span className="font-bold text-[#464555] text-[12px]">
            Materi Dikerjakan
          </span>
          <p className="font-extrabold text-[#3525cd] text-[26px] leading-tight">
            {quizzedCount}
          </p>
        </div>
        <div className="rounded-2xl border-2 border-[#c7c4d8] bg-white p-4 shadow-[0_3px_0_0_#cbd5e1]">
          <span className="font-bold text-[#464555] text-[12px]">
            Rata-rata Skor
          </span>
          <p className="font-extrabold text-[#006c49] text-[26px] leading-tight">
            {averageScore}%
          </p>
        </div>
      </section>

      {/* Streak Calendar Card */}
      <section className="space-y-3 rounded-3xl border-2 border-[#F59E0B] bg-gradient-to-r from-[#FEF3C7] to-[#FFFBEB] p-4 shadow-[0_4px_0_0_#D97706] sm:p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F59E0B] text-white shadow-[0_2px_0_0_#D97706]">
              <span className="material-symbols-outlined fill-icon text-[20px]">
                local_fire_department
              </span>
            </div>
            <div>
              <h3 className="font-extrabold text-[#78350F] text-[16px]">
                {streakDays > 0
                  ? `Rentetan ${streakDays} Materi!`
                  : "Mulai Rentetan Belajarmu!"}
              </h3>
              <span className="font-semibold text-[#92400E] text-[12px]">
                {completedMissions} dari 2 misi harian selesai
              </span>
            </div>
          </div>

          <span className="rounded-xl border border-[#F59E0B] bg-white px-2.5 py-1 font-extrabold text-[#D97706] text-[12px]">
            Hebat! 🔥
          </span>
        </div>

        <div className="grid grid-cols-7 gap-1.5 pt-1">
          {["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"].map(
            (day, index) => {
              const active = index < Math.min(streakDays, 7);
              return (
                <div
                  className={`rounded-xl border p-2 text-center transition-all ${
                    active
                      ? "border-[#F59E0B] bg-white text-[#92400E] shadow-[0_2px_0_0_#D97706]"
                      : "border-[#F59E0B]/30 bg-white/50 text-slate-400"
                  }`}
                  key={day}
                >
                  <span className="block font-bold text-[11px]">{day}</span>
                  <span
                    className={`material-symbols-outlined mt-0.5 text-[16px] ${
                      active ? "fill-icon text-[#D97706]" : "text-slate-300"
                    }`}
                  >
                    {active
                      ? "local_fire_department"
                      : "radio_button_unchecked"}
                  </span>
                </div>
              );
            }
          )}
        </div>
      </section>

      {/* Badges Collection */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="flex items-center gap-2 font-extrabold text-[#131b2e] text-[18px]">
            <span className="material-symbols-outlined text-[#3525cd]">
              workspace_premium
            </span>
            Lencana Prestasi Kamu
          </h3>
          <span className="font-bold text-[#464555] text-[12px]">
            {badges.filter((b) => b.unlocked).length} Terbuka
          </span>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {badges.map((badge) => (
            <div
              className={`flex items-center gap-3 rounded-2xl border-2 bg-white p-3.5 shadow-[0_3px_0_0_#cbd5e1] ${
                badge.unlocked
                  ? "border-[#c7c4d8]"
                  : "border-[#c7c4d8] border-dashed opacity-60"
              }`}
              key={badge.id}
            >
              <div
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border"
                style={{
                  backgroundColor: badge.unlocked ? badge.bg : "#f1f5f9",
                  color: badge.unlocked ? badge.color : "#94a3b8",
                  borderColor: badge.unlocked ? badge.color : "#cbd5e1",
                }}
              >
                <span className="material-symbols-outlined fill-icon text-[24px]">
                  {badge.unlocked ? badge.icon : "lock"}
                </span>
              </div>
              <div className="min-w-0">
                <h4 className="truncate font-extrabold text-[#131b2e] text-[14px]">
                  {badge.title}
                </h4>
                <p className="font-medium text-[#464555] text-[12px] leading-snug">
                  {badge.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Backup data (cross-device via sync code) */}
      <section
        className="space-y-3 rounded-2xl border-2 border-[#c7c4d8] bg-white p-4 shadow-[0_4px_0_0_#cbd5e1] sm:p-5"
        id="cadangan-data"
      >
        <div className="flex items-center gap-2 font-extrabold text-[#131b2e] text-[16px]">
          <span className="material-symbols-outlined text-[#3525cd]">
            cloud_sync
          </span>
          <span>Cadangan &amp; Pulihkan Data (Lintas Perangkat)</span>
        </div>
        <p className="font-medium text-[#464555] text-[13px] leading-relaxed">
          Progres dan setelanmu tersimpan di perangkat ini. Simpan semuanya
          dengan satu kode, lalu masukkan kode yang sama di perangkat lain untuk
          melanjutkan belajar dari titik yang sama. Tanpa perlu akun.
        </p>

        <label
          className="block font-bold text-[#464555] text-[12px]"
          htmlFor="sync-code"
        >
          Kode cadangan
        </label>
        <input
          className="min-h-[48px] w-full rounded-xl border-2 border-[#c7c4d8] bg-[#f2f3ff] px-3.5 text-[#131b2e] text-[14px] placeholder:text-[#777587] focus:border-[#4f46e5] focus:outline-none focus:ring-4 focus:ring-[#dad7ff]"
          id="sync-code"
          onChange={(event) => setSyncCode(event.target.value)}
          placeholder="misal: kode-belajarku-2026"
          type="text"
          value={syncCode}
        />

        <div className="grid grid-cols-2 gap-3">
          <button
            className="tactile-btn min-h-[48px] rounded-xl bg-[#4f46e5] px-4 py-3 font-bold text-[14px] text-white shadow-[0_3px_0_0_#3525cd] disabled:opacity-50"
            disabled={isSaving}
            onClick={handleSave}
            type="button"
          >
            {isSaving ? "Menyimpan…" : "Simpan Data Saya"}
          </button>
          <button
            className="tactile-btn min-h-[48px] rounded-xl border-2 border-[#4f46e5] bg-white px-4 py-3 font-bold text-[#3525cd] text-[14px] shadow-[0_3px_0_0_#cbd5e1] disabled:opacity-50"
            disabled={isRestoring}
            onClick={handleLoad}
            type="button"
          >
            {isRestoring ? "Memuat…" : "Pulihkan Data"}
          </button>
        </div>

        {backupStatus ? (
          <div
            className={`rounded-xl border p-3 font-semibold text-[12px] ${
              backupFailed
                ? "border-[#DC2626] bg-[#FEF2F2] text-[#991B1B]"
                : "border-[#c7c4d8] bg-[#eaedff] text-[#131b2e]"
            }`}
            role={backupFailed ? "alert" : "status"}
          >
            {backupStatus}
          </div>
        ) : null}
      </section>

      {/* Daily Bonus Claim Button if available */}
      {canClaimBonus ? (
        <section className="space-y-2 rounded-2xl border-2 border-[#4f46e5] bg-[#EDE9FE] p-4 text-center shadow-[0_4px_0_0_#3525cd]">
          <h4 className="font-extrabold text-[#3525cd] text-[16px]">
            🎉 Misi Harianmu Sudah Lengkap!
          </h4>
          <p className="font-medium text-[#131b2e] text-[13px]">
            Klaim bonus tambahan +50 XP harian sebagai hadiah ketekunanmu.
          </p>
          <button
            className="tactile-btn w-full rounded-xl bg-[#F59E0B] px-4 py-3 font-bold text-[14px] text-white shadow-[0_3px_0_0_#B45309] hover:brightness-105 active:brightness-95"
            onClick={() => {
              soundEffects.playSuccess();
              confetti({ particleCount: 100, spread: 90, origin: { y: 0.6 } });
              onClaimDailyBonus();
            }}
            type="button"
          >
            Klaim Bonus +50 XP
          </button>
        </section>
      ) : null}
    </main>
  );
};
