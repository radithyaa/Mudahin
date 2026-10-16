import { defineConfig } from "drizzle-kit";
import "varlock/auto-load";

/**
 * Konfigurasi Drizzle Kit untuk `db:generate` (menghasilkan file migrasi).
 *
 * **Penerapan migrasi ke D1 bukan lewat `drizzle-kit migrate`**, melainkan
 * otomatis oleh Alchemy saat `bun run deploy` — lihat
 * `packages/infra/alchemy.run.ts` (`Cloudflare.D1.Database(..., { migrations })`).
 * Karena itu konfigurasi ini sengaja tidak memuat kredensial D1 HTTP
 * (`accountId`/`databaseId`/`token`): tanpa kredensial, `drizzle-kit migrate`
 * gagal cepat dengan pesan yang mengarahkan ke `bun run deploy`, alih-alih
 * diam-diam menulis ke database yang salah.
 *
 * Jika suatu saat memang perlu menerapkan migrasi langsung dari laptop, isi
 * `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_DATABASE_ID`, dan
 * `CLOUDFLARE_D1_TOKEN` di `packages/db/.env`, lalu tambahkan `dbCredentials`.
 */
export default defineConfig({
  schema: "./src/schema/index.ts",
  out: "./src/migrations",
  // DOCS: https://orm.drizzle.team/docs/guides/d1-http-with-drizzle-kit
  dialect: "sqlite",
  driver: "d1-http",
});
