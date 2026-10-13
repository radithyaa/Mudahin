import { Link } from "@tanstack/react-router";
import { BookOpen, Home, Settings } from "lucide-react";

import { ModeToggle } from "./mode-toggle";
import { QuickSettingsSheet } from "./quick-settings-sheet";
import { UserMenu } from "./user-menu";

const NAV_LINKS = [
  { to: "/", label: "Beranda", icon: Home },
  { to: "/pustaka", label: "Pustaka", icon: BookOpen },
  { to: "/pengaturan", label: "Pengaturan", icon: Settings },
] as const;

/**
 * Top app bar.
 * - Mobile: bar ringkas (logo + tema + akun). Navigasi utama ada di bottom tab bar.
 * - Desktop (>= md): menampilkan tautan navigasi lengkap.
 */
export function AppHeader() {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 pt-[env(safe-area-inset-top)] backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 max-w-4xl items-center justify-between gap-2 px-3">
        <div className="flex items-center gap-1">
          <Link
            className="flex min-h-11 items-center px-1 font-bold text-lg tracking-tight"
            to="/"
          >
            mudahin
          </Link>

          <nav
            aria-label="Navigasi utama"
            className="hidden items-center gap-1 md:flex"
          >
            {NAV_LINKS.map(({ to, label, icon: Icon }) => (
              <Link
                activeOptions={{ exact: to === "/" }}
                className="flex min-h-11 items-center gap-2 rounded-md px-3 font-medium text-muted-foreground text-sm transition-colors hover:bg-muted hover:text-foreground data-[status=active]:bg-muted data-[status=active]:text-foreground"
                key={to}
                to={to}
              >
                <Icon aria-hidden="true" className="size-4" />
                <span>{label}</span>
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-1.5">
          <QuickSettingsSheet />
          <ModeToggle />
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
