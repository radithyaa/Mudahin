import { Button } from "@mudahin/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@mudahin/ui/components/dropdown-menu";
import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useCallback } from "react";

/** Kontrol tema global (Terang / Gelap / Sistem). Bagian dari shell aplikasi. */
export function ModeToggle() {
  const { setTheme } = useTheme();

  const setLight = useCallback(() => setTheme("light"), [setTheme]);
  const setDark = useCallback(() => setTheme("dark"), [setTheme]);
  const setSystem = useCallback(() => setTheme("system"), [setTheme]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button aria-label="Ubah tema" size="icon" variant="outline" />}
      >
        <Sun
          aria-hidden="true"
          className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0"
        />
        <Moon
          aria-hidden="true"
          className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100"
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={setLight}>
          <Sun aria-hidden="true" /> Terang
        </DropdownMenuItem>
        <DropdownMenuItem onClick={setDark}>
          <Moon aria-hidden="true" /> Gelap
        </DropdownMenuItem>
        <DropdownMenuItem onClick={setSystem}>
          <Monitor aria-hidden="true" /> Ikuti Sistem
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
