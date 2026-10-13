import { Button } from "@mudahin/ui/components/button";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@mudahin/ui/components/drawer";
import { Type } from "lucide-react";

import { QuickSettingsControls } from "@/components/accessibility/quick-settings-controls";

/** Bottom sheet pengaturan tipografi saat membaca — pola mobile dengan swipe handle. */
export function ReaderSettingsSheet() {
  return (
    <Drawer showSwipeHandle swipeDirection="down">
      <DrawerTrigger
        render={
          <Button
            aria-label="Pengaturan tampilan baca"
            size="sm"
            variant="outline"
          />
        }
      >
        <Type aria-hidden="true" /> Tampilan
      </DrawerTrigger>
      <DrawerContent className="mx-auto max-w-lg rounded-t-2xl border shadow-xl">
        <DrawerHeader>
          <DrawerTitle className="text-base">Pengaturan Tampilan</DrawerTitle>
        </DrawerHeader>
        <div className="overflow-y-auto p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <QuickSettingsControls />
        </div>
      </DrawerContent>
    </Drawer>
  );
}
