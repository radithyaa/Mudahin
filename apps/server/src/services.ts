import { createAuth as createConfiguredAuth } from "@mudahin/auth";
import { createDb, type Database } from "@mudahin/db";

import { desktopOrigins, ENV } from "./env.server";

export function getDb(): Database {
  return createDb(ENV);
}
export async function createAuth(database?: Database) {
  return createConfiguredAuth(ENV, database ?? (await getDb()), desktopOrigins);
}
