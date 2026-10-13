import { WifiOff } from "lucide-react";

import { useOnlineStatus } from "@/lib/hooks/use-online-status";

/**
 * Banner mode luring — muncul saat perangkat tidak terhubung internet.
 * Memberi tahu bahwa materi & kuis terakhir tetap tersedia dari penyimpanan lokal
 * (SRS §4.5 butir 4, FR-PRF-06).
 */
export function OfflineBanner() {
  const isOnline = useOnlineStatus();

  if (isOnline) {
    return null;
  }

  return (
    <div
      className="flex items-center justify-center gap-2 border-primary/30 border-b bg-primary/10 px-4 py-2 text-primary text-xs"
      role="status"
    >
      <WifiOff aria-hidden="true" className="size-3.5 shrink-0" />
      <span>
        Mode luring — materi & kuis terakhir tetap dapat dibuka dari perangkat.
      </span>
    </div>
  );
}
