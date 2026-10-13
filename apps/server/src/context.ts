import type { Context as ApiContext } from "@mudahin/api/context";
import type { Context as HonoContext } from "hono";
import { ENV } from "./env.server";
import { createAuth, getDb } from "./services";

export type CreateContextOptions = {
  context: HonoContext;
};

export async function createContext({
  context,
}: CreateContextOptions): Promise<ApiContext> {
  const db = await getDb();
  const session = await (await createAuth(db)).api.getSession({
    headers: context.req.raw.headers,
  });
  return {
    db,
    session,
    env: {
      DEEPSEEK_API_KEY: ENV.DEEPSEEK_API_KEY,
      DEEPSEEK_BASE_URL: ENV.DEEPSEEK_BASE_URL,
      DEEPSEEK_MODEL: ENV.DEEPSEEK_MODEL,
    },
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
