import { Button } from "@mudahin/ui/components/button";
import { Card } from "@mudahin/ui/components/card";
import { createFileRoute } from "@tanstack/react-router";
import { RotateCcw } from "lucide-react";
import { useCallback } from "react";

import { QuickSettingsControls } from "@/components/accessibility/quick-settings-controls";
import { useFocusProfile } from "@/lib/stores/focus-profile-store";

export const Route = createFileRoute("/pengaturan/")({
  component: PengaturanComponent,
  head: () => ({
    meta: [{ title: "Pengaturan Aksesibilitas — Mudahin" }],
  }),
});

function PengaturanComponent() {
  const resetPreferences = useFocusProfile((s) => s.resetPreferences);

  const handleReset = useCallback(() => resetPreferences(), [resetPreferences]);

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-6">
      <header className="flex flex-col gap-1">
        <h1 className="font-bold text-2xl">Pengaturan Aksesibilitas</h1>
        <p className="text-muted-foreground">
          Sesuaikan tampilan agar nyaman dibaca. Perubahan langsung terlihat.
        </p>
      </header>

      <Card className="flex flex-col gap-6 p-5">
        <h2 className="font-semibold text-lg">Tipografi & Bantuan Fokus</h2>
        <QuickSettingsControls />
      </Card>

      <div>
        <Button onClick={handleReset} variant="outline">
          <RotateCcw aria-hidden="true" /> Kembalikan ke awal
        </Button>
      </div>
    </main>
  );
}
