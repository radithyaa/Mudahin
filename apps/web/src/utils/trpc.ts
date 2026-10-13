import type { AppRouter } from "@mudahin/api/routers/index";
import { QueryCache, QueryClient } from "@tanstack/react-query";
import { createTRPCClient, httpBatchLink } from "@trpc/client";
import { createTRPCOptionsProxy } from "@trpc/tanstack-react-query";
import { toast } from "sonner";

import { ENV } from "../env.public";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Query materi jarang berubah; hindari spam saat jaringan buruk.
      retry: 1,
    },
    mutations: {
      // Panggilan AI sudah punya retry internal (1×) + cache; jangan ulangi lagi.
      retry: 0,
    },
  },
  queryCache: new QueryCache({
    onError: (error, query) => {
      toast.error(error.message, {
        action: {
          label: "retry",
          onClick: () => {
            query.invalidate();
          },
        },
      });
    },
  }),
});

export const trpcClient = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: `${ENV.VITE_SERVER_URL.replace(/\/$/, "")}/trpc`,
      fetch: (url, options) =>
        globalThis.fetch(url, { ...options, credentials: "include" }),
    }),
  ],
});

export const trpc = createTRPCOptionsProxy<AppRouter>({
  client: trpcClient,
  queryClient,
});
