// Env publik klien (hanya variabel `VITE_*` non-rahasia, Aturan Teknis §5.3).
//
// `VITE_SERVER_URL` menunjuk ke Worker Hono + tRPC. Saat dev tanpa `.env`,
// kita jatuh ke `http://localhost:3000` (port `dev:stack`).

const FALLBACK_SERVER_URL = "http://localhost:3000";

export const ENV = {
  VITE_SERVER_URL: (
    import.meta.env.VITE_SERVER_URL || FALLBACK_SERVER_URL
  ).replace(/\/$/, ""),
} as const;

/** URL dasar endpoint tRPC (`/trpc`). */
export const TRPC_URL = `${ENV.VITE_SERVER_URL}/trpc`;
