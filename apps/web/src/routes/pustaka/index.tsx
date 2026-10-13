import { Card } from "@mudahin/ui/components/card";
import { createFileRoute } from "@tanstack/react-router";
import { SearchX } from "lucide-react";
import { useCallback, useMemo, useState } from "react";

import { useMaterials } from "@/lib/materials/use-materials";

import { MaterialCard } from "./components/material-card";
import { SubjectFilterSheet } from "./components/subject-filter-sheet";

export const Route = createFileRoute("/pustaka/")({
  component: PustakaComponent,
  head: () => ({
    meta: [{ title: "Pustaka Materi — Mudahin" }],
  }),
});

function PustakaComponent() {
  // Server → salinan luring (IndexedDB) → seed: pustaka selalu bisa dibuka.
  const { materials, source } = useMaterials();

  const subjects = useMemo(
    () => [...new Set(materials.map((m) => m.subject))].sort(),
    [materials]
  );

  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);

  const toggleSubject = useCallback((subject: string) => {
    setSelectedSubjects((current) =>
      current.includes(subject)
        ? current.filter((s) => s !== subject)
        : [...current, subject]
    );
  }, []);

  const visibleMaterials = useMemo(
    () =>
      selectedSubjects.length === 0
        ? materials
        : materials.filter((m) => selectedSubjects.includes(m.subject)),
    [materials, selectedSubjects]
  );

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-5 px-4 py-6">
      <header className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="font-bold text-2xl">Pustaka Materi</h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Pilih materi untuk dibaca. Semua materi sudah disiapkan untuk demo.
          </p>
        </div>
        <SubjectFilterSheet
          onToggle={toggleSubject}
          selected={selectedSubjects}
          subjects={subjects}
        />
      </header>

      {source === "offline" ? (
        <p className="text-muted-foreground text-xs" role="status">
          Ditampilkan dari salinan luring di perangkat.
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        {visibleMaterials.map((material) => (
          <MaterialCard key={material.id} material={material} />
        ))}
      </div>

      {visibleMaterials.length === 0 ? (
        <Card className="flex flex-col items-center gap-2 p-8 text-center text-muted-foreground">
          <SearchX aria-hidden="true" className="size-8" />
          <p>Tidak ada materi untuk filter ini.</p>
        </Card>
      ) : null}
    </main>
  );
}
