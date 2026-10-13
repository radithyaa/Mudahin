import { Link, useRouterState } from "@tanstack/react-router";
import { BookOpen, Home, Settings, UserRound } from "lucide-react";

const TABS = [
  { to: "/", label: "Beranda", icon: Home },
  { to: "/pustaka", label: "Pustaka", icon: BookOpen },
  { to: "/profil", label: "Profil", icon: UserRound },
  { to: "/pengaturan", label: "Atur", icon: Settings },
] as const;

/** Route yang tampil layar-penuh tanpa tab bar (onboarding & auth). */
const FULLSCREEN_PREFIXES = ["/onboarding", "/login"];

/**
 * Bottom tab bar — khusus mobile (tersembunyi di >= md).
 * Hanya menampilkan ikon dengan label aksesibel (sr-only) + indikator aktif.
 */
export function MobileTabBar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  if (FULLSCREEN_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return null;
  }

  return (
    <nav
      aria-label="Navigasi utama"
      className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur supports-[backdrop-filter]:bg-background/80 md:hidden"
    >
      <ul className="grid grid-cols-4">
        {TABS.map(({ to, label, icon: Icon }) => {
          const isActive =
            to === "/" ? pathname === "/" : pathname.startsWith(to);
          return (
            <li key={to}>
              <Link
                aria-current={isActive ? "page" : undefined}
                aria-label={label}
                className={`flex min-h-14 flex-col items-center justify-center gap-0.5 py-2 font-medium text-[0.65rem] transition-colors ${
                  isActive ? "text-primary" : "text-muted-foreground"
                }`}
                to={to}
              >
                <span className="relative flex items-center justify-center">
                  <Icon aria-hidden="true" className="size-6" />
                  {isActive ? (
                    <span className="absolute -bottom-1 h-0.5 w-6 rounded-full bg-primary" />
                  ) : null}
                </span>
                <span className="sr-only">{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
