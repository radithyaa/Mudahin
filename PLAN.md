# PLAN — Konsistensi Navbar, Hapus Data Dummy, Materi dari DB

Status: **SELESAI** ✅

## Tujuan (dari permintaan user) — semua terpenuhi

1. **Tabbar + navbar halaman Latihan sama** dengan halaman lain.
2. **Judul "Mudahin" dihapus** di seluruh navbar.
3. **Semua data dummy dihapus** → data asli dari DB.
4. **Halaman Belajar "Materi Pustaka"** = daftar materi milik user dari DB; klik → dialog pilih jenis latihan → langsung membuat soal latihan dari materi terpilih.
5. **Halaman utama** → dummy PDF dihapus; bisa membaca PDF & gambar sungguhan.

## Yang dikerjakan

### Backend — materi dari database
- Tabel baru `materials` (`packages/db/src/schema/materials.ts`) + migrasi `20261016120000_materials`.
- `packages/api/src/routers/materials.ts`: `list`, `byId`, `create` membaca/menulis DB dengan kepemilikan per `userId` (`session.user.id` bila login, selain itu `"anon"`).
- `packages/api/src/materials.ts`: `SEED_MATERIALS` & `getSeedMaterialById` dihapus; ditambah `materialInputSchema`.
- `apps/server/src/jobs/prewarm.ts`: membaca materi dari DB, bukan seed.

### Frontend — hapus dummy
- `lib/materials/seed.ts` (fallback seed) & `mergeMaterial`/`upsertCachedMaterial`/`readCachedMaterialById` dihapus.
- `useMaterials` tidak lagi jatuh ke seed: server → cache luring → kosong (dengan keadaan kosong jujur).
- Dihapus: banner "Baru Selesai — Catatan Biologi Bab 3", filter chip palsu, `isFeatured`, pratinjau teks hardcoded, nama dummy "Rian", misi bertarget `fotosintesis`, `targetModuleId` mati.
- Progres nyata: skor kuis terbaik dari `progress.summary` ditampilkan per materi (`withProgressScores`).

### Navbar & tabbar konsisten
- `TopAppBar`: `<h1>Mudahin</h1>`, subjudul "Pusat Latihan Asyik", dan lencana target "2/3" khusus Latihan dihapus → tampilan identik di semua tab.
- `BottomNavBar`: sudah seragam, tidak diubah.

### Halaman Belajar — dialog jenis latihan
- Komponen baru `practice-picker-sheet.tsx` berisi 5 jenis latihan (flashcard, jawab suara, dengarkan bacaan, kuis santai, focus reader).
- Mengetuk materi / tombol "Pilih Latihan" membuka dialog → jenis terpilih langsung membuka modal latihan yang relevan (`handleSelectPractice` di `app.tsx`).
- `LatihanView` diubah memakai dialog yang sama (satu alur untuk kedua halaman).

### Halaman utama — PDF & gambar nyata
- `lib/pdf.ts` baru: ekstraksi teks PDF klien memakai `pdfjs-dist` v6 (worker dibundel lokal, tanpa CDN).
- Tombol "+ Foto Catatan" (`accept="image/*"`) dan "+ File PDF" (`accept="application/pdf"`) membuka pemilih berkas nyata; PDF tanpa lapisan teks memberi pesan jujur.

## Verifikasi
- `bunx tsc --noEmit` lolos di 4 paket (frontend, api, db, server).
- `bunx biome check` bersih untuk semua file yang ditulis/diubah (sisa isu hanya pre-existing di file lain).
- `bun run build` (frontend) lolos; worker pdf.js ter-bundle sebagai aset lokal.
- `bun run verify` → 103 check lolos, termasuk suite baru `scripts/verify-materials-db.ts` (23 check: migrasi, kolom, indeks, isolasi kepemilikan, round-trip JSON, skema input).

## Catatan / follow-up
- **Kepemilikan data tanpa akun**: materi & progres diikat ke identitas perangkat acak (`packages`-side: `deviceIdSchema`; klien: `apps/frontend/src/lib/offline/device-identity.ts`) — bukan `"anon"` global. Semua orang mulai dari nol di perangkat baru kecuali memulihkan kode cadangan di halaman Profil (`backup.load` + `data.import`).
- **Identitas perangkat tidak boleh kembali ke Zustand `persist`**: middleware itu mengakses `window.localStorage` saat store dibuat dan mematikan persistensi permanen bila aksesnya melempar — pernah membuat kueri materi menggantung di "Memuat pustaka materi…" pada perangkat baru. Sekarang nilainya dibaca sinkron, tidak pernah melempar, dan selalu valid sehingga kueri boleh langsung jalan tanpa `enabled`.
- **Deteksi perangkat baru**: `useMaterials().isFreshDevice` (server menjawab, pustaka kosong, tanpa salinan luring) memunculkan kartu "Perangkat Ini Masih Baru" + tombol Pulihkan Data di halaman Belajar, dan mengganti kalimat keadaan kosong di Latihan.
- **Cadangan kini penuh** (`device_backup`, `packages/api/src/backup.ts`): snapshot berisi setelan aksesibilitas + pustaka materi + skor. Tabel `profile_backup` & `profile.save/load` dihapus (migrasi `20261016150000_device_backup`); `use-profile-sync.ts` dan `lib/api/profile.ts` dihapus. Saat autentikasi diaktifkan, `deviceId` dapat digantikan `session.user.id`.
- **Migrasi D1 diterapkan otomatis oleh `bun run deploy`** (Alchemy membaca `packages/db/src/migrations`, bookkeeping `__alchemy_migrations`). Jangan menjalankan `drizzle-kit migrate` — `db:migrate:deploy` sengaja hanya memuat pengingat. Perlu deploy agar `materials` + `device_backup` ada di D1.
- `pdfjs-dist@6.4.299` ditambahkan ke `apps/frontend/package.json`.
