import { trpcServer } from "@hono/trpc-server";
import { appRouter } from "@mudahin/api/routers/index";
import { initLogger } from "evlog";
import {
  type BetterAuthInstance,
  createAuthMiddleware,
} from "evlog/better-auth";
import { type EvlogVariables, evlog } from "evlog/hono";
import { Hono } from "hono";
import { cors } from "hono/cors";

import { createContext } from "./context";
import { corsOrigins } from "./env.server";
import { handlePrewarm } from "./jobs/prewarm";
import { createAuth } from "./services";

initLogger({
  env: { service: "mudahin-server" },
});

const identifyUser = createAuthMiddleware(
  (await createAuth()) as BetterAuthInstance,
  {
    exclude: ["/api/auth/**"],
    maskEmail: true,
  }
);

const app = new Hono<EvlogVariables>();

app.use(evlog());
app.use("*", async (c, next) => {
  await identifyUser(c.get("log"), c.req.raw.headers, c.req.path);
  await next();
});

app.use(
  "/*",
  cors({
    origin: corsOrigins(),
    allowMethods: ["GET", "POST", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

app.on(["POST", "GET"], "/api/auth/*", async (c) =>
  (await createAuth()).handler(c.req.raw)
);

app.use(
  "/trpc/*",
  trpcServer({
    endpoint: "/trpc",
    router: appRouter,
    createContext: (_opts, context) => createContext({ context }),
  })
);

app.get("/", (c) => c.text("OK"));

// Pra-panaskan cache AI untuk demo (dilindungi token).
app.post("/jobs/prewarm", (c) => handlePrewarm(c.req.raw));

export default app;
