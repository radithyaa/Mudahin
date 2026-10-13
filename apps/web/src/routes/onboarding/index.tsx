import { Button } from "@mudahin/ui/components/button";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Sparkles } from "lucide-react";
import { useCallback, useState } from "react";

import { type FocusNeed, presetForNeeds } from "@/lib/stores/focus-profile";
import { useFocusProfile } from "@/lib/stores/focus-profile-store";

import { NeedPicker } from "./components/need-picker";

export const Route = createFileRoute("/onboarding/")({
  component: OnboardingComponent,
});

const STEPS = ["selamat-datang", "pilih-profil", "siap"] as const;
type Step = (typeof STEPS)[number];

function OnboardingComponent() {
  const navigate = useNavigate();
  const needs = useFocusProfile((s) => s.needs);
  const toggleNeed = useFocusProfile((s) => s.toggleNeed);
  const applyPresetForNeeds = useFocusProfile((s) => s.applyPresetForNeeds);
  const completeOnboarding = useFocusProfile((s) => s.completeOnboarding);

  const [step, setStep] = useState<Step>("selamat-datang");

  const goToNeeds = useCallback(() => setStep("pilih-profil"), []);
  const goToWelcome = useCallback(() => setStep("selamat-datang"), []);
  const goToReady = useCallback(() => setStep("siap"), []);

  const finish = useCallback(() => {
    applyPresetForNeeds(needs as FocusNeed[]);
    completeOnboarding();
    navigate({ to: "/" });
  }, [applyPresetForNeeds, needs, completeOnboarding, navigate]);

  return (
    <main className="mx-auto flex w-full max-w-xl flex-col gap-6 px-4 py-6 sm:py-10">
      {step === "selamat-datang" ? (
        <section className="flex flex-col gap-6">
          <div className="flex flex-col gap-3">
            <h1 className="font-bold text-3xl">
              Belajar dengan caramu sendiri
            </h1>
            <p className="text-muted-foreground">
              Banyak siswa kesulitan membaca teks yang rapat dan panjang.
              Mudahin menyesuaikan tampilan, suara, dan cara belajar agar cocok
              untukmu.
            </p>
          </div>
          <ul className="grid gap-3 text-sm">
            <li className="rounded-lg border p-4">
              <strong className="block">Teks yang lebih mudah dibaca</strong>
              <span className="text-muted-foreground">
                Ukuran, jarak, dan jenis huruf dapat diatur.
              </span>
            </li>
            <li className="rounded-lg border p-4">
              <strong className="block">Dibacakan dengan penanda kata</strong>
              <span className="text-muted-foreground">
                Materi dibacakan sambil menandai kata yang sedang dibaca.
              </span>
            </li>
            <li className="rounded-lg border p-4">
              <strong className="block">Ringkasan bahasa sederhana</strong>
              <span className="text-muted-foreground">
                Materi yang rumit disederhanakan menjadi poin-poin.
              </span>
            </li>
          </ul>
          <Button onClick={goToNeeds} size="lg">
            Mulai <ArrowRight aria-hidden="true" />
          </Button>
        </section>
      ) : null}

      {step === "pilih-profil" ? (
        <section className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <h1 className="font-bold text-2xl">Apa yang kamu butuhkan?</h1>
            <p className="text-muted-foreground">
              Kami akan menyiapkan tampilan yang paling nyaman untukmu.
            </p>
          </div>
          <NeedPicker onToggle={toggleNeed} selected={needs as FocusNeed[]} />
          <div className="flex justify-between gap-3">
            <Button onClick={goToWelcome} variant="ghost">
              <ArrowLeft aria-hidden="true" /> Kembali
            </Button>
            <Button disabled={needs.length === 0} onClick={goToReady} size="lg">
              Lanjut <ArrowRight aria-hidden="true" />
            </Button>
          </div>
        </section>
      ) : null}

      {step === "siap" ? (
        <section className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <Sparkles aria-hidden="true" className="size-8 text-primary" />
            <h1 className="font-bold text-2xl">Semua siap!</h1>
            <p className="text-muted-foreground">
              Tampilanmu sudah disesuaikan. Kamu dapat mengubah pengaturan ini
              kapan saja di halaman Pengaturan.
            </p>
          </div>
          <PreviewCard />
          <div className="flex justify-between gap-3">
            <Button onClick={goToNeeds} variant="ghost">
              <ArrowLeft aria-hidden="true" /> Ubah pilihan
            </Button>
            <Button onClick={finish} size="lg">
              Masuk ke Beranda <ArrowRight aria-hidden="true" />
            </Button>
          </div>
        </section>
      ) : null}
    </main>
  );
}

function PreviewCard() {
  const needs = useFocusProfile((s) => s.needs) as FocusNeed[];
  const preset = presetForNeeds(needs);

  const labels = [
    preset.fontFamily === "dyslexic" ? "Font ramah disleksia" : null,
    preset.highContrast ? "Kontras tinggi" : null,
    preset.readingRuler ? "Pemandu baris" : null,
    preset.fontSize > 100 ? `Teks ${preset.fontSize}%` : null,
  ].filter(Boolean);

  return (
    <div className="rounded-lg border bg-muted/40 p-4">
      <p className="font-medium text-sm">Penyesuaian aktif:</p>
      <ul className="mt-2 flex flex-wrap gap-2">
        {labels.length > 0 ? (
          labels.map((label) => (
            <li
              className="rounded-full border bg-background px-3 py-1 text-muted-foreground text-xs"
              key={label}
            >
              {label}
            </li>
          ))
        ) : (
          <li className="text-muted-foreground text-xs">
            Tampilan standar (netral).
          </li>
        )}
      </ul>
    </div>
  );
}
