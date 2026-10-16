/**
 * Pengingat: migrasi D1 **tidak** diterapkan dari sini.
 *
 * Alchemy memegang kepemilikan migrasi D1 (tabel `__alchemy_migrations`), dan
 * menerapkan migrasi yang tertunda otomatis setiap kali `bun run deploy`.
 * Menjalankannya lewat `drizzle-kit migrate` akan membuat dua alat berebut
 * tabel bookkeeping yang sama.
 *
 * Jalankan dari akar repo:
 *   bun run deploy
 */

console.error(`
✖ Migrasi D1 tidak dijalankan dari paket ini.

  Migrasi diterapkan otomatis oleh Alchemy saat deploy:

      bun run deploy          (dari akar repo)

  Alchemy membaca packages/db/src/migrations, mendeteksi migrasi yang belum
  diterapkan, lalu menjalankannya berurutan sebagai bagian dari update
  (bookkeeping: tabel __alchemy_migrations di D1).

  Lihat packages/infra/alchemy.run.ts → Cloudflare.D1.Database("database", {
    migrations: "../../packages/db/src/migrations",
  })
`);

process.exit(1);
