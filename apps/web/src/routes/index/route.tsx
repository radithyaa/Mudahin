import { Button } from "@mudahin/ui/components/button";
import { Card } from "@mudahin/ui/components/card";
import { createFileRoute, Link } from "@tanstack/react-router";

import { useFocusProfile } from "@/lib/stores/focus-profile-store";

import {
  PrimaryAction,
  QuickAccessibilityToggle,
} from "./components/home-widgets";

export const Route = createFileRoute("/")({
  component: HomeComponent,
  head: () => ({
    meta: [{ title: "Beranda — Mudahin" }],
  }),
});

function HomeComponent() {
  const needs = useFocusProfile((s) => s.needs);
  const onboardingComplete = useFocusProfile((s) => s.onboardingComplete);

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-6">
      <header className="flex flex-col gap-1">
        <h1 className="font-bold text-2xl">Halo! 👋</h1>
        <p className="text-muted-foreground">
          Siap belajar hari ini? Pilih materi atau atur tampilan sesuai
          kenyamananmu.
        </p>
      </header>

      {onboardingComplete ? null : (
        <Card className="flex flex-col gap-3 border-primary bg-primary/5 p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm">
            Selesaikan pengaturan awal agar tampilan sesuai kebutuhanmu.
          </p>
          <Link to="/onboarding">
            <Button>Atur sekarang</Button>
          </Link>
        </Card>
      )}

      <PrimaryAction />

      <QuickAccessibilityToggle />

      <Card className="flex flex-col gap-3 p-4">
        <h2 className="font-medium text-muted-foreground text-sm">
          Profil aksesibilitas
        </h2>
        {needs.length > 0 ? (
          <ul className="flex flex-wrap gap-2">
            {needs.map((need) => (
              <li
                className="rounded-full border bg-secondary px-3 py-1 text-secondary-foreground text-xs capitalize"
                key={need}
              >
                {need.replace("-", " ")}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted-foreground text-sm">
            Belum ada profil dipilih. Buka Pengaturan untuk memilih.
          </p>
        )}
        <div>
          <Link to="/pengaturan">
            <Button size="sm" variant="outline">
              Ubah pengaturan
            </Button>
          </Link>
        </div>
      </Card>
    </main>
  );
}
