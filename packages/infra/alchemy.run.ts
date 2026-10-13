import * as Alchemy from "alchemy";
import * as Cloudflare from "alchemy/Cloudflare";
import * as Config from "effect/Config";
import * as Effect from "effect/Effect";
import "varlock/auto-load";

/**
 * Secret opsional: ambil dari env bila ada, jika tidak pakai string kosong.
 *
 * Kenapa tidak wajib: stack harus tetap bisa dijalankan untuk pengembangan UI
 * tanpa kunci AI. Bila `DEEPSEEK_API_KEY` kosong, prosedur tRPC AI akan gagal
 * dengan pesan yang ramah dan UI menampilkan banner fallback (SRS §4.5).
 */
const optionalString = (name: string, fallback = "") =>
  Config.String(name).pipe(Config.withDefault(fallback));

export const db = Cloudflare.D1.Database("database", {
  migrations: "../../packages/db/src/migrations",
});

export const server = Cloudflare.Worker("server", {
  main: "../../apps/server/src/index.ts",
  compatibility: {
    flags: ["nodejs_compat"],
  },
  env: {
    DB: db,
    CORS_ORIGIN: Config.String("CORS_ORIGIN"),
    BETTER_AUTH_SECRET: Config.Redacted("BETTER_AUTH_SECRET"),
    BETTER_AUTH_URL: Cloudflare.Worker.URL,
    DEEPSEEK_API_KEY: optionalString("DEEPSEEK_API_KEY"),
    DEEPSEEK_BASE_URL: optionalString(
      "DEEPSEEK_BASE_URL",
      "https://api.deepseek.com"
    ),
    DEEPSEEK_MODEL: optionalString("DEEPSEEK_MODEL", "deepseek-chat"),
    PREWARM_TOKEN: optionalString("PREWARM_TOKEN"),
  },
  dev: {
    port: 3000,
  },
});

export type ServerEnv = Cloudflare.InferEnv<typeof server>;

export default Alchemy.Stack(
  "mudahin",
  {
    providers: Cloudflare.providers(),
    state: Cloudflare.state(),
  },
  Effect.gen(function* () {
    const serverWorker = yield* server;
    const webWorker = yield* Cloudflare.Website.Vite("web", {
      rootDir: "../../apps/web",
      assets: {
        htmlHandling: "auto-trailing-slash",
        notFoundHandling: "single-page-application",
      },
      env: {
        VITE_SERVER_URL: serverWorker.url.as<string>(),
      },
      dev: {
        port: 3001,
      },
    });

    return {
      web: webWorker.url,
      server: serverWorker.url,
    };
  })
);
