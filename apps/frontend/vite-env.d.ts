/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** URL server (Worker Hono + tRPC) — diisi lewat `.env` lokal / Alchemy saat deploy. */
  readonly VITE_SERVER_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
