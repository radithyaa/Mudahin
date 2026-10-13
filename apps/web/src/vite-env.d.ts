/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** URL server (Worker) — disuntikkan Alchemy saat build/dev. */
  readonly VITE_SERVER_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
