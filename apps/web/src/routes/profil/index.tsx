import { Card } from "@mudahin/ui/components/card";
import { createFileRoute, Link } from "@tanstack/react-router";
import { BookOpen, ListChecks, Ruler, Sparkles, Type } from "lucide-react";

import { FALLBACK_MATERIALS } from "@/lib/materials/seed";
import { FOCUS_NEED_LABELS, type FocusNeed } from "@/lib/stores/focus-profile";
import { useFocusProfile } from "@/lib/stores/focus-profile-store";
import { useProgressStore } from "@/lib/stores/progress-store";

import { ProfileSyncCard } from "./components/profile-sync-card";

export const Route = createFileRoute("/profil/")({
  component: ProfilComponent,
  head: () => ({
    meta: [{ title: "Profil & Progres — Mudahin" }],
  }),
});

function ProfilComponent() {
  const needs = useFocusProfile((s) => s.needs) as FocusNeed[];
  const fontSize = useFocusProfile((s) => s.fontSize);
  const highContrast = useFocusProfile((s) => s.highContrast);
  const readingRuler = useFocusProfile((s) => s.readingRuler);
  const readMaterials = useProgressStore((s) => s.readMaterials);
  const materialProgress = useProgressStore((s) => s.materials);

  const activeAdjustments = [
    { label: `Ukuran teks ${fontSize}%`, icon: Type, active: fontSize > 100 },
    { label: "Kontras tinggi", icon: Sparkles, active: highContrast },
    { label: "Pemandu baris", icon: Ruler, active: readingRuler },
  ];

  const totalMaterials = FALLBACK_MATERIALS.length;
  const readCount = readMaterials.length;
  const readPercent =
    totalMaterials === 0 ? 0 : Math.round((readCount / totalMaterials) * 100);
  const quizzedCount = Object.keys(materialProgress).length;
  const averageScore =
    quizzedCount === 0
      ? 0
      : Math.round(
          Object.values(materialProgress).reduce(
            (sum, item) => sum + item.bestScore,
            0
          ) / quizzedCount
        );

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-5 px-4 py-5 sm:gap-6 sm:py-6">
      <header className="flex flex-col gap-1">
        <h1 className="font-bold text-2xl">Profil &amp; Progres</h1>
        <p className="text-muted-foreground">
          Ringkasan kebutuhan aksesibilitas dan aktivitasmu.
        </p>
      </header>

      <Card className="flex flex-col gap-3 p-5">
        <h2 className="font-semibold text-lg">Kebutuhan aksesibilitas</h2>
        {needs.length > 0 ? (
          <ul className="flex flex-col gap-2">
            {needs.map((need) => (
              <li className="flex flex-col" key={need}>
                <span className="font-medium">
                  {FOCUS_NEED_LABELS[need].title}
                </span>
                <span className="text-muted-foreground text-sm">
                  {FOCUS_NEED_LABELS[need].description}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted-foreground text-sm">
            Belum ada kebutuhan dipilih.{" "}
            <Link className="text-primary underline" to="/onboarding">
              Atur sekarang
            </Link>
            .
          </p>
        )}
      </Card>

      <Card className="flex flex-col gap-4 p-5">
        <h2 className="font-semibold text-lg">Progres belajar</h2>
        <dl className="grid grid-cols-3 gap-2 text-center">
          <Stat
            icon={BookOpen}
            label="Materi dibaca"
            value={`${readCount}/${totalMaterials}`}
          />
          <Stat
            icon={ListChecks}
            label="Kuis dikerjakan"
            value={String(quizzedCount)}
          />
          <Stat
            icon={Sparkles}
            label="Rata-rata skor"
            value={`${averageScore}`}
          />
        </dl>

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Ketuntasan pustaka</span>
            <span className="font-medium">{readPercent}%</span>
          </div>
          <div
            aria-label={`Ketuntasan pustaka ${readPercent}%`}
            aria-valuemax={100}
            aria-valuemin={0}
            aria-valuenow={readPercent}
            className="h-2 w-full overflow-hidden rounded-full bg-muted"
            role="progressbar"
          >
            <div
              className="h-full rounded-full bg-primary transition-[width] duration-500"
              style={{ width: `${readPercent}%` }}
            />
          </div>
        </div>

        {readCount === 0 ? (
          <p className="text-muted-foreground text-sm">
            Buka materi pertamamu di{" "}
            <Link className="text-primary underline" to="/pustaka">
              Pustaka
            </Link>{" "}
            untuk mulai mencatat progres.
          </p>
        ) : null}
      </Card>

      <Card className="flex flex-col gap-3 p-5">
        <h2 className="font-semibold text-lg">Penyesuaian aktif</h2>
        <ul className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {activeAdjustments.map(({ label, icon: Icon, active }) => (
            <li
              className={`flex items-center gap-2 rounded-lg border p-3 text-sm ${
                active ? "border-primary bg-primary/5" : "text-muted-foreground"
              }`}
              key={label}
            >
              <Icon aria-hidden="true" className="size-4 shrink-0" />
              {label}
            </li>
          ))}
        </ul>
      </Card>

      <ProfileSyncCard />

      <div>
        <Link
          className="inline-flex min-h-11 items-center text-primary text-sm underline"
          to="/pengaturan"
        >
          Ubah pengaturan aksesibilitas
        </Link>
      </div>
    </main>
  );
}

interface StatProps {
  icon: typeof BookOpen;
  label: string;
  value: string;
}

function Stat({ icon: Icon, label, value }: StatProps) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-lg border p-3">
      <Icon aria-hidden="true" className="size-5 text-primary" />
      <dd className="font-bold text-lg">{value}</dd>
      <dt className="text-muted-foreground text-xs">{label}</dt>
    </div>
  );
}
