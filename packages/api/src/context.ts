import type { Session } from "@mudahin/auth";
import type { Database } from "@mudahin/db";

export type Context = {
  session: Session | null;
  db: Database;
};
