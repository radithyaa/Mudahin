import { Button } from "@mudahin/ui/components/button";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@mudahin/ui/components/drawer";
import { SlidersHorizontal } from "lucide-react";
import { useCallback } from "react";
import { QuickSettingsControls } from "@/components/accessibility/quick-settings-controls";
import { useFocusProfile } from "@/lib/stores/focus-profile-store";

/**
 * Bottom sheet pengaturan cepat — pola mobile (swipe down untuk menutup).
 * Muncul dari bawah pada layar kecil; di desktop tetap dapat dipakai.
 */
export function QuickSettingsSheet() {
  const resetPreferences = useFocusProfile((s) => s.resetPreferences);

  const handleReset = useCallback(() => resetPreferences(), [resetPreferences]);

  return (
    <Drawer showSwipeHandle swipeDirection="down">
      <DrawerTrigger
        render={
          <Button aria-label="Pengaturan cepat" size="icon" variant="outline" />
        }
      >
        <SlidersHorizontal aria-hidden="true" />
      </DrawerTrigger>
      <DrawerContent className="mx-auto max-w-lg rounded-t-2xl border shadow-xl">
        <DrawerHeader>
          <DrawerTitle className="text-base">Pengaturan Cepat</DrawerTitle>
        </DrawerHeader>
        <div className="flex flex-col gap-4 overflow-y-auto p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <QuickSettingsControls />
          <Button onClick={handleReset} variant="outline">
            Kembalikan ke awal
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
