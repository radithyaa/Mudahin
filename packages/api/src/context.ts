import type { Session } from "@mudahin/auth";
import type { Database } from "@mudahin/db";

/** Binding environment yang dibutuhkan prosedur tRPC di server. */
export interface ApiEnv {
  DEEPSEEK_API_KEY?: string;
  DEEPSEEK_BASE_URL?: string;
  DEEPSEEK_MODEL?: string;
}

export interface Context {
  db: Database;
  env: ApiEnv;
  session: Session | null;
  [key: string]: unknown;
}
