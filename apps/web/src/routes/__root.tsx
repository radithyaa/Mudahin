import { Toaster } from "@mudahin/ui/components/sonner";
import type { QueryClient } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import {
  createRootRouteWithContext,
  HeadContent,
  Outlet,
  useRouterState,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";

import { AppHeader } from "@/app/layout/app-header";
import { MobileTabBar } from "@/app/layout/mobile-tab-bar";
import { PageTransition } from "@/app/layout/page-transition";
import { AccessibilityApplier } from "@/app/providers/accessibility-applier";
import { ThemeProvider } from "@/app/providers/theme-provider";
import { OfflineBanner } from "@/components/offline-banner";
import type { trpc } from "@/utils/trpc";

import "../index.css";

export interface RouterAppContext {
  queryClient: QueryClient;
  trpc: typeof trpc;
}

const FULLSCREEN_PREFIXES = ["/onboarding", "/login"];

export const Route = createRootRouteWithContext<RouterAppContext>()({
  component: RootComponent,
  head: () => ({
    meta: [
      {
        title: "mudahin",
      },
      {
        name: "description",
        content: "mudahin is a web application",
      },
    ],
    links: [
      {
        rel: "icon",
        href: "/favicon.ico",
      },
    ],
  }),
});

function RootComponent() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isFullscreen = FULLSCREEN_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix)
  );

  return (
    <>
      <HeadContent />
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        disableTransitionOnChange
        enableSystem
        storageKey="mudahin-theme"
      >
        <AccessibilityApplier />
        <div className="flex min-h-svh flex-col">
          <AppHeader />
          <OfflineBanner />
          <div
            className={
              isFullscreen
                ? "flex-1 overflow-y-auto"
                : "flex-1 overflow-y-auto pb-[calc(3.5rem+env(safe-area-inset-bottom))] md:pb-0"
            }
          >
            <PageTransition routeKey={pathname}>
              <Outlet />
            </PageTransition>
          </div>
        </div>
        <MobileTabBar />
        <Toaster position="top-center" richColors />
      </ThemeProvider>
      <TanStackRouterDevtools position="bottom-left" />
      <ReactQueryDevtools buttonPosition="bottom-right" position="bottom" />
    </>
  );
}
