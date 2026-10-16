import type React from "react";
import { useState } from "react";

import { useVoiceHistory } from "../lib/hooks/use-progress";
import { useVoiceAttemptsStore } from "../lib/stores/voice-history-store";
import type { LearningModule } from "../types";
import { soundEffects } from "../utils/audio";

interface LatihanHistoryViewProps {
  modules: LearningModule[];
  onOpenAiStudioPrompt: () => void;
  /** Membuka modal latihan lisan dalam mode ulangan (tanpa XP). */
  onReplayVoice: (module: LearningModule) => void;
}

/** Format waktu ISO menjadi tanggal & jam yang mudah dibaca. */
function formatWhen(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  return date.toLocaleString("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

/**
 * Riwayat Latihan.
 *
 * Menampilkan percobaan latihan lisan yang pernah dilakukan pengguna — beserta
 * pertanyaan, ucapan yang terdengar, dan putusan AI — lalu memungkinkan untuk
 * **mengulanginya**. Ulangan tetap dicatat sebagai riwayat, tetapi tidak memberi
 * XP (sesuai permintaan: melihat apa yang dilakukan di materi tersebut).
 */
export const LatihanHistoryView: React.FC<LatihanHistoryViewProps> = ({
  modules,
  onReplayVoice,
  onOpenAiStudioPrompt,
}) => {
  const { data, status } = useVoiceHistory();
  const attemptedIds = useVoiceAttemptsStore(
    (state) => state.attemptedMaterialIds
  );
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const moduleById = new Map(modules.map((mod) => [mod.id, mod]));
  const items = data?.items ?? [];
  const correctCount = data?.correctCount ?? 0;
  const totalCount = data?.totalCount ?? 0;
  const isPending = status === "pending";
  const hasError = status === "error";
  const isEmpty = status === "success" && items.length === 0;

  /** Materi yang pernah dicoba (dari riwayat server atau catatan lokal). */
  const attemptedModules = modules.filter(
    (mod) => moduleById.has(mod.id) && attemptedIds.includes(mod.id)
  );

  const handleReplay = (materialId: string) => {
    soundEffects.playTap();
    const mod = moduleById.get(materialId);
    if (mod) {
      onReplayVoice(mod);
    }
  };

  return (
    <div className="space-y-5 pt-1">
      <section className="space-y-1">
        <h2 className="font-extrabold text-[#131b2e] text-[24px] tracking-tight">
          Riwayat Latihan Materimu
        </h2>
        <p className="font-medium text-[#464555] text-[14px] leading-relaxed">
          Lihat lagi jawaban yang pernah kamu berikan, lalu ulangi latihannya
          kapan saja. Mengulang tidak mengurangi skormu dan tidak memberi XP
          tambahan.
        </p>
      </section>

      {/* Ringkasan cepat */}
      <section className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border-2 border-[#c7c4d8] bg-white p-4 shadow-[0_3px_0_0_#cbd5e1]">
          <span className="font-bold text-[#464555] text-[12px]">
            Total Percobaan
          </span>
          <p className="font-extrabold text-[#3525cd] text-[26px] leading-tight">
            {totalCount}
          </p>
        </div>
        <div className="rounded-2xl border-2 border-[#c7c4d8] bg-white p-4 shadow-[0_3px_0_0_#cbd5e1]">
          <span className="font-bold text-[#464555] text-[12px]">
            Jawaban Benar
          </span>
          <p className="font-extrabold text-[#006c49] text-[26px] leading-tight">
            {correctCount}
          </p>
        </div>
      </section>

      {isPending ? (
        <p className="rounded-2xl border-2 border-[#c7c4d8] border-dashed bg-white p-4 text-center font-semibold text-[#464555] text-[13px]">
          Memuat riwayat latihanmu…
        </p>
      ) : null}

      {hasError ? (
        <p className="rounded-2xl border-2 border-[#F59E0B] bg-[#FEF3C7] p-4 text-center font-semibold text-[#92400E] text-[13px]">
          Tidak bisa memuat riwayat dari server. Periksa koneksi lalu coba lagi.
        </p>
      ) : null}

      {/* Materi yang bisa diulang */}
      {attemptedModules.length > 0 ? (
        <section className="space-y-3">
          <h3 className="font-extrabold text-[#131b2e] text-[16px]">
            Ulangi Latihan Ini
          </h3>
          <div className="space-y-2">
            {attemptedModules.map((mod) => (
              <button
                className="tactile-btn flex w-full items-center justify-between gap-3 rounded-2xl border-2 border-[#c7c4d8] bg-white p-3.5 text-left shadow-[0_3px_0_0_#cbd5e1] hover:border-[#4f46e5]"
                key={mod.id}
                onClick={() => handleReplay(mod.id)}
                type="button"
              >
                <span className="min-w-0">
                  <span className="block truncate font-extrabold text-[#131b2e] text-[14px]">
                    {mod.title}
                  </span>
                  <span className="block font-medium text-[#464555] text-[12px]">
                    {mod.subjectBadge}
                  </span>
                </span>
                <span className="flex shrink-0 items-center gap-1 font-bold text-[#3525cd] text-[13px]">
                  <span className="material-symbols-outlined text-[18px]">
                    replay
                  </span>
                  Ulangi
                </span>
              </button>
            ))}
          </div>
        </section>
      ) : null}

      {/* Daftar percobaan */}
      <section className="space-y-3">
        <h3 className="font-extrabold text-[#131b2e] text-[16px]">
          Percobaan Terakhir
        </h3>

        {isEmpty ? (
          <div className="space-y-3 rounded-2xl border-2 border-[#c7c4d8] border-dashed bg-white p-5 text-center">
            <span className="material-symbols-outlined text-[#3525cd] text-[36px]">
              history
            </span>
            <p className="font-extrabold text-[#131b2e] text-[15px]">
              Belum ada riwayat latihan
            </p>
            <p className="font-medium text-[#464555] text-[13px] leading-relaxed">
              Coba latihan “Jawab dengan Suara” pada salah satu materimu.
              Hasilnya akan muncul di sini beserta penilaian Teman AI.
            </p>
            <button
              className="tactile-btn min-h-[44px] rounded-xl border-2 border-[#4f46e5] bg-white px-4 py-2.5 font-bold text-[#3525cd] text-[13px] shadow-[0_3px_0_0_#cbd5e1]"
              onClick={() => {
                soundEffects.playTap();
                onOpenAiStudioPrompt();
              }}
              type="button"
            >
              Buat Materi Baru
            </button>
          </div>
        ) : null}

        {items.map((item) => {
          const isExpanded = expandedId === item.id;
          const canReplay = moduleById.has(item.materialId);
          return (
            <article
              className={`rounded-2xl border-2 bg-white p-4 shadow-[0_3px_0_0_#cbd5e1] ${
                item.correct ? "border-[#10B981]" : "border-[#F59E0B]"
              }`}
              key={item.id}
            >
              <div className="mb-2 flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <span className="block truncate font-extrabold text-[#131b2e] text-[14px]">
                    {item.materialTitle}
                  </span>
                  <span className="font-medium text-[#777587] text-[11px]">
                    {formatWhen(item.createdAt)}
                  </span>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-0.5 font-extrabold text-[11px] ${
                    item.correct
                      ? "bg-[#ECFDF5] text-[#065F46]"
                      : "bg-[#FEF3C7] text-[#92400E]"
                  }`}
                >
                  {item.correct ? "Benar" : "Belum Tepat"}
                </span>
              </div>

              <p className="mb-1 font-bold text-[#464555] text-[12px]">
                Pertanyaan:
              </p>
              <p className="mb-3 font-semibold text-[#131b2e] text-[13px] leading-relaxed">
                {item.question}
              </p>

              {item.transcript ? (
                <>
                  <p className="mb-1 font-bold text-[#464555] text-[12px]">
                    Jawabanmu (suara):
                  </p>
                  <p className="mb-3 font-medium text-[#131b2e] text-[13px] italic leading-relaxed">
                    "{item.transcript}"
                  </p>
                </>
              ) : null}

              {isExpanded ? (
                <p className="mb-3 rounded-xl border border-[#c7c4d8] bg-[#f2f3ff] p-3 font-medium text-[#464555] text-[12px] leading-relaxed">
                  {item.feedback}
                </p>
              ) : null}

              <div className="flex items-center gap-2">
                <button
                  className="tactile-btn flex min-h-[40px] flex-1 items-center justify-center gap-1.5 rounded-xl border-2 border-[#c7c4d8] bg-[#faf8ff] px-3 py-2 font-bold text-[#131b2e] text-[13px] shadow-[0_2px_0_0_#cbd5e1]"
                  onClick={() => {
                    soundEffects.playTap();
                    setExpandedId(isExpanded ? null : item.id);
                  }}
                  type="button"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {isExpanded ? "expand_less" : "expand_more"}
                  </span>
                  {isExpanded ? "Sembunyikan Umpan Balik" : "Lihat Umpan Balik"}
                </button>

                {canReplay ? (
                  <button
                    className="tactile-btn flex min-h-[40px] items-center justify-center gap-1.5 rounded-xl bg-[#4f46e5] px-3 py-2 font-bold text-[13px] text-white shadow-[0_2px_0_0_#3525cd]"
                    onClick={() => handleReplay(item.materialId)}
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      replay
                    </span>
                    Ulangi
                  </button>
                ) : null}
              </div>
            </article>
          );
        })}
      </section>
    </div>
  );
};
