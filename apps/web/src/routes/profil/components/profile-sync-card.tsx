import { Button } from "@mudahin/ui/components/button";
import { Card } from "@mudahin/ui/components/card";
import { Input } from "@mudahin/ui/components/input";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Check, CloudDownload, CloudUpload, Copy } from "lucide-react";
import { useCallback, useState } from "react";
import { toast } from "sonner";

import {
  applyProfileSnapshot,
  formatSyncCode,
  readProfileSnapshot,
  useProfileSyncStore,
} from "@/lib/hooks/use-profile-sync";
import { trpc } from "@/utils/trpc";

/**
 * Cadangan & pemulihan profil aksesibilitas (sinkronisasi lintas perangkat).
 *
 * Preferensi tetap lokal; bagian ini menyalin/memulihkan snapshot lewat
 * "kode cadangan" (`syncId`). Mobile-first: target sentuh besar, masukan
 * teks font ≥16px, dan status jelas lewat teks (bukan warna saja).
 */
export function ProfileSyncCard() {
  const syncId = useProfileSyncStore((s) => s.syncId);
  const ensureSyncId = useProfileSyncStore((s) => s.ensureSyncId);
  const setSyncId = useProfileSyncStore((s) => s.setSyncId);
  const markSynced = useProfileSyncStore((s) => s.markSynced);
  const lastSyncedAt = useProfileSyncStore((s) => s.lastSyncedAt);

  const [code, setCode] = useState("");
  const [copied, setCopied] = useState(false);

  const saveMutation = useMutation(trpc.profile.save.mutationOptions());

  // Kode yang benar-benar diminta (di-set saat tombol "Pulihkan" ditekan).
  const [submittedCode, setSubmittedCode] = useState<string | null>(null);
  const loadQuery = useQuery(
    trpc.profile.load.queryOptions(
      { syncId: submittedCode ?? "" },
      { enabled: submittedCode !== null }
    )
  );

  const codeToShow = syncId ? formatSyncCode(syncId) : null;

  const handleBackup = useCallback(() => {
    const id = ensureSyncId();
    saveMutation.mutate(
      { snapshot: readProfileSnapshot(), syncId: id },
      {
        onError: () =>
          toast.error("Gagal mencadangkan. Coba lagi saat daring."),
        onSuccess: () => {
          markSynced();
          toast.success("Profil dicadangkan ke server.");
        },
      }
    );
  }, [ensureSyncId, markSynced, saveMutation]);

  const handleCopy = useCallback(async () => {
    if (!codeToShow) {
      return;
    }
    try {
      await navigator.clipboard.writeText(codeToShow);
      setCopied(true);
      toast.success("Kode cadangan disalin.");
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Tidak bisa menyalin otomatis. Salin manual ya.");
    }
  }, [codeToShow]);

  // Setelah permintaan selesai, terapkan snapshot bila ditemukan.
  const handleRestore = useCallback(async () => {
    const trimmed = code.trim();
    if (trimmed.length < 4) {
      toast.error("Masukkan kode cadangan yang benar.");
      return;
    }
    setSubmittedCode(null);
    try {
      const result = await loadQuery.refetch();
      if (!(result.data?.found && result.data.snapshot)) {
        toast.error("Kode cadangan tidak ditemukan.");
        return;
      }
      applyProfileSnapshot(result.data.snapshot);
      setSyncId(trimmed.toLowerCase());
      toast.success("Profil dipulihkan ke perangkat ini.");
    } catch {
      toast.error("Gagal memulihkan. Periksa koneksi lalu coba lagi.");
    }
  }, [code, loadQuery, setSyncId]);

  const handleCodeChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => setCode(event.target.value),
    []
  );

  return (
    <Card className="flex flex-col gap-4 p-5">
      <div className="flex flex-col gap-1">
        <h2 className="flex items-center gap-2 font-semibold text-lg">
          <CloudUpload aria-hidden="true" className="size-5 text-primary" />
          Cadangan Profil
        </h2>
        <p className="text-muted-foreground text-sm">
          Simpan pengaturanmu ke server agar bisa dipulihkan di perangkat lain
          lewat kode cadangan. Tanpa akun.
        </p>
      </div>

      <Button
        className="min-h-11"
        disabled={saveMutation.isPending}
        onClick={handleBackup}
      >
        <CloudUpload aria-hidden="true" />
        {saveMutation.isPending ? "Mencadangkan…" : "Cadangkan sekarang"}
      </Button>

      {codeToShow ? (
        <div className="flex flex-col gap-2 rounded-lg border bg-muted/40 p-3">
          <span className="text-muted-foreground text-xs">
            Kode cadangan perangkat ini
          </span>
          <div className="flex items-center gap-2">
            <code className="flex-1 select-all break-all font-mono font-semibold text-base">
              {codeToShow}
            </code>
            <Button
              aria-label="Salin kode cadangan"
              className="min-h-11"
              onClick={handleCopy}
              size="sm"
              variant="outline"
            >
              {copied ? (
                <Check aria-hidden="true" />
              ) : (
                <Copy aria-hidden="true" />
              )}
              {copied ? "Tersalin" : "Salin"}
            </Button>
          </div>
          {lastSyncedAt ? (
            <span className="text-muted-foreground text-xs">
              Terakhir dicadangkan:{" "}
              {new Date(lastSyncedAt).toLocaleString("id-ID")}
            </span>
          ) : null}
        </div>
      ) : null}

      <div className="flex flex-col gap-2 border-t pt-4">
        <label className="font-medium text-sm" htmlFor="profile-restore-code">
          Pulihkan dari kode
        </label>
        <Input
          autoCapitalize="off"
          autoComplete="off"
          id="profile-restore-code"
          onChange={handleCodeChange}
          placeholder="Contoh: MK3F9A2C1B"
          value={code}
        />
        <Button
          className="min-h-11"
          disabled={loadQuery.isFetching || code.trim().length < 4}
          onClick={handleRestore}
          variant="outline"
        >
          <CloudDownload aria-hidden="true" />
          {loadQuery.isFetching ? "Memuat…" : "Pulihkan profil"}
        </Button>
      </div>
    </Card>
  );
}
