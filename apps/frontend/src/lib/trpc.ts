import type { AppRouter } from "@mudahin/api/routers/index";
import { QueryClient } from "@tanstack/react-query";
import { createTRPCClient, httpBatchLink } from "@trpc/client";
import { createTRPCOptionsProxy } from "@trpc/tanstack-react-query";

import { TRPC_URL } from "./env";

/**
 * Klien tRPC end-to-end type-safe ke Worker Hono (`apps/server`).
 *
 * Semua fitur (materi, AI, progres, cadangan profil) lewat sini sehingga tipe
 * kontrak `packages/api` dipakai bersama tanpa duplikasi DTO.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Daftar materi jarang berubah; cukup 1 retry agar tidak spam saat offline.
      retry: 1,
      staleTime: 60_000,
    },
    mutations: {
      // Panggilan AI sudah punya retry internal + cache D1 di server.
      retry: 0,
    },
  },
});

export const trpcClient = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: TRPC_URL,
      fetch: (url, options) =>
        globalThis.fetch(url, { ...options, credentials: "include" }),
    }),
  ],
});

export const trpc = createTRPCOptionsProxy<AppRouter>({
  client: trpcClient,
  queryClient,
});
