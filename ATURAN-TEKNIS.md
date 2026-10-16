# Aturan Teknis — Mudahin (Monorepo Turborepo + Bun)

> Dokumen ini adalah **aturan main teknis** yang mengikat selama sprint 3 hari. Tujuannya: satu developer, satu sumber kebenaran, tidak ada keputusan arsitektur yang diambil ulang di tengah sprint.
>
> **Revisi:** Dokumen ini sudah disesuaikan dengan arsitektur repository **terbaru** (Turborepo + Bun workspaces, `apps/frontend` + `apps/server`, `packages/*`, Cloudflare Workers via Alchemy, Drizzle + D1, Tauri v2). Frontend utama berada di **`apps/frontend/`** (React + Vite, satu layar 4 tab, PWA, dibungkus Tauri). Versi lama yang memakai `pnpm`, `apps/api`, dan `apps/web` (TanStack Router) sudah tidak berlaku.
>
> **Revisi fitur terbaru:** materi tidak lagi berupa seed contoh — pustaka dibaca dari tabel `materials` di D1 (`materials.list/byId/create`). AI kini memakai **dua provider**: **DeepSeek** untuk seluruh fitur **teks**, **Gemini** untuk **OCR tulisan tangan** (`ai.ocrToFlashcards`) dan **audio TTS/STT server-side** (`speech.synthesize`/`speech.transcribe`). Materi dapat dibuat dari teks/ucapan/**foto**/**PDF**, dan satu materi dapat dilatih dengan **5 mode latihan**.

---

## 1. Stack Resmi

| Lapisan | Teknologi | Lokasi | Catatan |
|---|---|---|---|
| Monorepo | **Bun workspaces + Turborepo** | root | Jangan pakai npm/yarn/pnpm — konflik lockfile. Lockfile resmi: `bun.lock` |
| Package manager | **Bun 1.3+** | root | Perintah harian lewat `bun run`, dijalankan dari root |
| UI Framework | **React 19 + TypeScript + Vite** | `apps/frontend` | Bahasa utama: TypeScript, bukan JS |
| Data fetching | **TanStack Query + tRPC client** | `apps/frontend/src/lib/trpc.ts` | End-to-end type-safe, tanpa REST manual |
| State klien | **Zustand** + **`usePersistentState`** (localStorage) | `apps/frontend/src/lib/stores`, `lib/hooks/use-persistent-state.ts` | Preferensi aksesibilitas & progres. Preferensi aktif di `app.tsx` memakai `usePersistentState`; store Zustand tersedia untuk slice domain. Jangan Redux |
| Animasi | **GSAP** | `apps/frontend/src/lib/motion.ts` | Satu library animasi; dilarang menambah Framer Motion |
| Mobile/Desktop | **Tauri v2** | `apps/frontend/src-tauri` | Pembungkus UI yang sama (desktop + Android); dibangun dari `apps/frontend` (dev port 3002) |
| Backend runtime | **Cloudflare Workers** | `apps/server` | Deploy via Alchemy; Types `@cloudflare/workers-types` |
| API framework | **Hono** | `apps/server/src/index.ts` | Router HTTP utama |
| API kontrak | **tRPC** + **Zod** | `packages/api` | Skema dipakai bersama client & server |
| AI teks | **DeepSeek** (`deepseek-chat`) | `packages/api/src/ai.ts` | simplify, quiz, explain, mindmap, flashcards |
| AI gambar/audio | **Google Gemini** (`gemini-2.5-flash`) | `packages/api/src/ai.ts`, `packages/api/src/audio.ts` | OCR tulisan tangan + TTS/STT server-side |
| Autentikasi | **Better-Auth** (email+password, Drizzle adapter) | `packages/auth` | Secret hanya di server |
| Database | **Cloudflare D1** (SQLite) + **Drizzle ORM** | `packages/db` | Binding `DB` dari Alchemy |
| Logging | **evlog** | `apps/server/src/index.ts` | Terintegrasi Better-Auth (`identifyUser`) |
| Konfigurasi env | **Varlock** (`*.env.schema` → `src/env.ts`) | tiap app/package | Jangan commit file `.env`; hanya commit `.env.schema` |

### Pin Versi
- Semua dependency memakai versi stabil terbaru saat mulai, lalu **di-freeze** di `bun.lock`.
- **Dilarang** menjalankan upgrade dependency di tengah sprint.
- Versi lintas-package yang dipakai bersama dikelola lewat **catalog** di `package.json` root (contoh `"react": "catalog:"`).

---

## 2. Struktur Folder Baku

Struktur mengikuti **Better-T-Stack** dengan pemisahan tegas antara *apps* (deployable) dan *packages* (library internal).

```
mudahin/
├── apps/
│   ├── frontend/                # Frontend utama (React + Vite + Tailwind + PWA)
│   │   ├── public/              # Aset statis (logo, ikon PWA)
│   │   ├── src-tauri/           # Pembungkus Tauri v2 (desktop + Android)
│   │   ├── src/
│   │   │   ├── app.tsx          # Shell + state global + komposisi 4 tab
│   │   │   ├── main.tsx         # Bootstrap React (QueryClientProvider)
│   │   │   ├── index.css        # Tailwind v4 + token warna
│   │   │   ├── components/      # UI per tab & modal (Belajar, Latihan, Akses, Profil)
│   │   │   ├── lib/             # Fitur non-UI lintas-tab
│   │   │   │   ├── api/         # Adaptor kontrak backend → tipe UI
│   │   │   │   ├── hooks/       # Hook bersama (materials, ai, progress, dst.)
│   │   │   │   ├── materials/   # Cache materi luring (tanpa seed)
│   │   │   │   ├── offline/     # IndexedDB (mode luring)
│   │   │   │   ├── stores/      # Slice Zustand
│   │   │   │   ├── trpc.ts      # Klien tRPC + QueryClient
│   │   │   │   ├── env.ts       # Env publik klien
│   │   │   │   ├── pdf.ts       # Ekstraksi teks PDF (pdfjs-dist, worker lokal)
│   │   │   │   ├── haptics.ts   # Getar (haptic)
│   │   │   │   ├── motion.ts    # Animasi GSAP (reduced-motion aware)
│   │   │   │   ├── speech.ts    # TTS: Web Speech + fallback server (Gemini)
│   │   │   │   ├── speech-stt.ts # STT: Web Speech + MediaRecorder → server
│   │   │   │   ├── speech-support.ts   # Deteksi dukungan TTS/STT platform
│   │   │   │   ├── speech-diagnostics.ts # Ringkasan diagnostik suara (UI)
│   │   │   │   └── speech-recognition.ts  # Inti Web Speech API + pencocokan opsi
│   │   │   └── utils/           # Util UI (sound effects, dst.)
│   │   └── vite.config.ts       # Vite + Tailwind + PWA
│   └── server/                  # Backend API (Hono + tRPC) — Cloudflare Worker
│       ├── src/
│       │   ├── index.ts         # Entry: Hono app, middleware, mount tRPC + auth
│       │   ├── context.ts       # createContext (session + db) untuk tRPC
│       │   ├── services.ts      # getDb(), createAuth()
│       │   ├── env.server.ts    # Binding Cloudflare (env dari Alchemy)
│       │   ├── env.ts           # Autogenerated Varlock (JANGAN edit)
│       │   └── cloudflare-env.d.ts
│       └── tsdown.config.ts     # Bundling ke dist/
├── packages/
│   ├── api/                     # Router tRPC + prosedur (kontrak API) — packages/api/src/routers
│   │   │                        #   routers/ai.ts      = simplify, quiz, explain, mindMap, flashcards, ocrToFlashcards
│   │   │                        #   routers/speech.ts  = TTS & STT server-side (Gemini)
│   │   │                        #   routers/materials.ts = list/byId/create (materi dari DB)
│   │   │                        #   routers/progress.ts  = record/summary
│   │   │                        #   routers/profile.ts   = save/load (cadangan lintas perangkat)
│   │   │                        #   src/ai.ts     = klien DeepSeek + Gemini (vision)
│   │   │                        #   src/audio.ts  = klien audio Gemini (TTS/STT) + PCM→WAV
│   ├── auth/                    # Konfigurasi Better-Auth (dipakai server)
│   ├── db/                      # Skema Drizzle + koneksi D1 (packages/db/src/schema)
│   ├── ui/                      # Komponen & style shadcn lintas-app (tersedia untuk penggunaan mendatang)
│   ├── config/                  # tsconfig & preset lint bersama
│   └── infra/                   # Infrastruktur Alchemy (Worker + D1 + Website → apps/frontend)
├── turbo.json
├── package.json                 # Bun workspaces + catalog
└── bun.lock
```

**Aturan package:**
- Setiap workspace **wajib** punya `package.json` dengan `name` ber-namespace: `@mudahin/api`, `@mudahin/db`, `@mudahin/ui`, dst. (`apps/frontend` dan `apps/server` memakai nama `apps/frontend` dan `server` dari scaffold.)
- Import antar-package selalu lewat **nama package**, bukan path relatif melintasi folder: `import { Button } from "@mudahin/ui/components/button"`.
- `packages/db/src/env.ts` dan `apps/*/src/env.ts` adalah **file autogenerated Varlock** — jangan diedit manual.
- Konfigurasi rahasia/nilai asli ada di `.env` (gitignored). Yang di-commit hanya `.env.schema`.

### 2.1 Backend: bukan `apps/api`, tapi `apps/server` + `packages/api`
- **`apps/server`** = layer *transport/runtime*: Hono app, CORS, logging, mount tRPC & Better-Auth, `createContext`. **Tidak berisi logika domain.**
- **`packages/api`** = layer *kontrak/bisnis*: definisi router tRPC & prosedur (`publicProcedure`, `protectedProcedure`). Logika endpoint AI (`simplify`, `quiz`, `materials`) ditambahkan **di sini** sebagai router tRPC baru.

### 2.2 Frontend (`apps/frontend/`) — satu layar, empat tab

`apps/frontend/` adalah **UI utama**: satu layar mobile-first dengan empat tab (Belajar, Latihan, Akses, Profil). Struktur:

- **`src/app.tsx`** = shell aplikasi: state global, komposisi tab, dan orkestrasi modal. Bukan fitur domain.
- **`src/components/`** = komponen per tab & modal (UI).
- **`src/lib/`** = **fitur non-UI** yang dipakai lintas-tab: klien tRPC (`trpc.ts`), adaptor kontrak (`api/`), hook bersama (`hooks/`), penyimpanan luring (`offline/`, `materials/`), ekstraksi PDF (`pdf.ts`), store Zustand (`stores/`), haptik/animasi/TTS/STT (`haptics.ts`, `motion.ts`, `speech*.ts`).
- **`src/utils/`** = util UI murni (mis. efek suara).

Aturan penempatan: kode non-UI yang dipakai lintas-tab → `src/lib/`; komponen UI → `src/components/`; DTO/tipe bersama client–server → `packages/api`.

---

## 3. Arsitektur Frontend — Fitur Non-UI di `lib/`

Frontend memisahkan **UI** (`src/components/`) dari **fitur/logika** (`src/lib/`). TUjuan: UI tetap tipis dan mudah diganti, sementara logika (luring, state, aksesibilitas, suara) dapat dipakai ulang oleh tab mana pun.

### 3.1 Prinsip
1. **UI tipis** — komponen di `src/components/` hanya soal tampilan & interaksi; logika berat ada di `src/lib/`.
2. **Fitur non-UI terkolokasi di `lib/`** — penyimpanan luring, store, hook, dan util domain berada di `src/lib/<domain>/`.
3. **Satu arah ketergantungan** — komponen boleh import dari `lib`; **`lib` tidak boleh import dari `components`**.
4. **DTO lewat packages** — tipe/skema yang dipakai client & server ditaruh di `packages/api`, bukan diduplikasi.

### 3.2 Anatomi `apps/frontend/src/lib/`

```
apps/frontend/src/lib/
├── trpc.ts                 # Klien tRPC + QueryClient
├── env.ts                  # Env publik (`VITE_SERVER_URL`)
├── api/                    # Adaptor kontrak backend → tipe UI
│   ├── materials.ts
│   └── ai.ts
├── hooks/                  # Hook bersama lintas-tab
│   ├── use-materials.ts         # Server → luring → kosong
│   ├── use-create-material.ts   # materials.create
│   ├── use-ai.ts
│   ├── use-progress.ts
│   ├── use-device-backup.ts     # backup.save/load + data.export/import
│   ├── use-online-status.ts
│   ├── use-persistent-state.ts
│   ├── use-press-feedback.ts
│   └── use-reduced-motion.ts
├── materials/cache.ts      # Cache materi luring (tanpa seed)
├── offline/
│   ├── idb.ts                  # IndexedDB (mode luring)
│   └── device-identity.ts      # Identitas perangkat (tanpa akun, sinkron & anti-throw)
├── stores/                 # Slice Zustand
│   └── (focus-profile, progress, quiz, device-identity)
├── haptics.ts              # Getar (haptic)
├── motion.ts               # Animasi GSAP (reduced-motion aware)
├── pdf.ts                  # Ekstraksi teks PDF (pdfjs-dist, worker dibundel lokal)
├── tts.ts                  # Tokenizer Text-to-Speech (boundary → kata)
├── speech.ts               # TTS: Web Speech + fallback server (Gemini)
├── speech-stt.ts           # STT: Web Speech + MediaRecorder → server
├── speech-support.ts       # Deteksi dukungan platform TTS/STT
├── speech-diagnostics.ts   # Ringkasan diagnostik suara untuk UI
└── speech-recognition.ts   # Inti Web Speech API + pencocokan opsi
```

Ketentuan:
- **Nama file**: `kebab-case` (mis. `use-text-to-speech.ts`).
- **Hook** diekspor sebagai `camelCase` ber-prefix `use`.
- Modul murni (tanpa DOM) dipisah agar mudah diuji lewat `scripts/verify-*.ts`.

### 3.3 Level penempatan (decision table)

| Kode dipakai oleh | Tempatkan di |
|---|---|
| 1 tab/komponen saja | di samping komponennya di `src/components/` |
| ≥ 2 tab, logika non-UI | `apps/frontend/src/lib/` |
| ≥ 2 app (frontend + server) / primitif UI | `packages/ui/src/...` |
| Kontrak API / DTO client–server | `packages/api` (Zod + tRPC) |
| Generate tipe dari DB | `packages/db` (Drizzle) |

---

## 4. Aturan Kode

### 4.1 TypeScript
- **Strict mode wajib aktif.** Tidak ada `any` implisit.
- `any` eksplisit hanya diizinkan di boundary library eksternal, dan wajib disertai komentar alasan.
- Semua tipe & skema yang dipakai lebih dari satu app **wajib** ditaruh di `packages/api` (atau package terkait), bukan diduplikasi.
- Konfigurasi dasar: `packages/config/tsconfig.base.json` (`noUncheckedIndexedAccess`, `noUnusedLocals`, `verbatimModuleSyntax` aktif).

### 4.2 Konvensi Penamaan
| Jenis | Konvensi | Contoh |
|---|---|---|
| File komponen | kebab-case | `reading-ruler.tsx` |
| File hook | kebab-case (`use-*.ts`) | `use-text-to-speech.ts` |
| File util | kebab-case | `format-date.ts` |
| Folder | kebab-case | `focus-reader/` |
| Komponen (fungsi) | PascalCase | `ReadingRuler` |
| Hook (fungsi) | camelCase `use*` | `useTextToSpeech()` |
| Konstanta | SCREAMING_SNAKE_CASE | `DEFAULT_TTS_RATE` |
| Tipe/Interface | PascalCase | `FocusProfile` |

### 4.3 Batas Tanggung Jawab
- **Komponen UI tidak boleh memanggil DeepSeek langsung.** Selalu lewat tRPC client (`apps/frontend/src/lib/trpc.ts`) → Hono → `packages/api`.
- **Prosedur tRPC tidak boleh berisi prompt panjang.** Prompt disimpan di modul terpisah di dalam `packages/api` (mis. `packages/api/src/prompts.ts`).
- **Jangan duplikasi tipe.** Import dari package kontrak (`@mudahin/api`, `@mudahin/db`).
- **Komponen tidak boleh tahu detail transport.** Akses DB hanya dari konteks tRPC (server), bukan dari `apps/frontend`.

### 4.4 Formatting & Lint
- Formatter + linter: **Ultracite** (di atas Biome). Konfigurasi: `biome.jsonc` (extends `ultracite/biome/{core,react,tanstack}`).
- Perintah: `bun run check` (cek) dan `bun run fix` (perbaiki) dari root.
- File `env.ts` autogenerated (Varlock) dikecualikan dari lint/format.

---

## 5. Aturan Keamanan (Non-Negotiable)

1. API key AI (`DEEPSEEK_API_KEY`, `GEMINI_API_KEY`) **hanya** boleh ada sebagai secret server (Cloudflare Worker secret / `apps/server/.env` lokal).
2. File `.env` **wajib** gitignored. Yang di-commit hanya `.env.schema` (tanpa nilai rahasia). Sediakan `.env.example` bila perlu.
3. **Dilarang** memakai prefix `VITE_` untuk key rahasia apa pun — variabel `VITE_*` ter-bundle ke client.
4. Semua input tRPC **wajib divalidasi Zod** (skema di `packages/api/src/schemas.ts`). Rate limit belum dipasang di MVP — pengaman biaya mengandalkan batas panjang input + `PREWARM_TOKEN` pada job pra-panas.
5. Batasi panjang input (mis. teks maks 8.000 karakter) untuk mencegah penyalahgunaan biaya.
6. Secret server (mis. `BETTER_AUTH_SECRET`) diakses via binding Worker (`apps/server/src/env.server.ts`), bukan `import.meta.env`.

---

## 6. Aturan AI & Prompt

1. **DeepSeek `deepseek-chat`** untuk seluruh fitur **teks**. Dilarang `deepseek-reasoner` untuk request UI realtime.
2. **Google Gemini** **hanya** untuk dua hal di luar teks: **OCR tulisan tangan** (`ai.ocrToFlashcards`) dan **audio TTS/STT** (`speech.synthesize`/`speech.transcribe`). Jangan memindahkan fitur teks ke Gemini atau sebaliknya.
3. Parameter baku DeepSeek: `temperature: 0.3`, `max_tokens: 1200`; Gemini sedikit lebih longgar waktunya (10 detik untuk OCR).
4. **Timeout 8 detik** per request DeepSeek, maksimal **1 kali retry** (retry untuk timeout/jaringan/5xx/429/JSON rusak).
5. Setiap respons AI **wajib divalidasi Zod** sebelum dikirim ke client. LLM bisa mengembalikan JSON rusak — jangan percaya mentah-mentah.
6. Gunakan **JSON mode** untuk endpoint yang mengembalikan struktur (simplify, quiz, explain, mindMap, flashcards, OCR).
7. Semua prompt memakai Bahasa Indonesia dan menyatakan format output secara eksplisit (`packages/api/src/prompts.ts`).
8. **Cache key** = hash `(endpoint + PROMPT_VERSION + input)`. Bump `PROMPT_VERSION` setiap prompt berubah. TTS di-cache per kalimat.
9. Panggilan AI dilakukan **di dalam prosedur tRPC** (`packages/api`) atau layanan server; kunci API tetap di Worker.

---

## 7. Aturan Aksesibilitas (Sesuai Target WCAG 2.1 AA)

1. Rasio kontras teks minimum **4.5:1**. Verifikasi setiap pasangan warna baru.
2. Target sentuh minimum **44×44 px**.
3. Setiap elemen interaktif wajib punya **ARIA label** dan dapat diakses keyboard.
4. Ukuran teks dasar **minimum 16px**, dapat diperbesar hingga 200% tanpa merusak layout.
5. **Tidak boleh** menyampaikan informasi hanya lewat warna.
6. Animasi wajib menghormati `prefers-reduced-motion`.
7. Ikon aksi utama (TTS, ruler, simplifier) wajib disertai label teks, bukan ikon saja.
8. **Focus Profile tidak boleh** menimpa preferensi OS `prefers-reduced-motion` pengguna.
9. Token tema warna (termasuk **mode Filter Warna Hangat / anti silau**) & skala huruf global (`--a11y-font-scale`, berbasis `rem`) diatur di `apps/frontend/src/index.css`.
10. Nyala/matikan fitur suara (TTS/STT) harus punya **fallback jujur**: bila perangkat tidak mendukung, alihkan ke server; bila server tidak tersedia, tampilkan pesan ramah — bukan tombol yang diam.

---

## 8. Aturan Git & Kolaborasi

### 8.1 Branch
- `main` — selalu dapat dijalankan.
- `feat/<nama>` — untuk fitur, contoh `feat/focus-reader`.
- Tidak ada `develop`; terlalu berat untuk tim 1 orang.

### 8.2 Commit (Conventional Commits)
```
feat(reader): tambah reading ruler
fix(server): tangani timeout deepseek
chore(repo): setup turbo pipeline
docs(readme): cara menjalankan
```

### 8.3 Aturan Pengerjaan
- Commit **kecil dan sering**. Jangan menumpuk satu commit raksasa di akhir.
- Commit history yang rapi adalah **bukti orisinalitas** karya (Rules Lomba poin 6).
- **Push ke `main` setiap selesai satu sub-fitur P0 yang berjalan.**
- **Jangan commit** `bun.lock` yang tidak sengaja terhapus/berubah hanya karena install ulang; commit perubahan dependency secara sengaja.

---

## 9. Perintah Baku (Turborepo + Bun)

Semua perintah dijalankan dari root. **Jangan** `cd` ke dalam app untuk tugas harian.

```bash
bun install                    # pasang semua dependency
bun run dev                    # jalankan web + server bersamaan (turbo)
bun run dev:web                # jalankan frontend utama saja (vite dev, port 3002)
bun run dev:stack              # jalankan web + server lokal dengan binding & secret (Alchemy)
bun run build                  # build semua app
bun run check                  # lint/format check (Ultracite)
bun run fix                    # perbaiki lint/format otomatis
bun run check-types            # cek tipe seluruh workspace
bun run verify                 # verifikasi util kritis (reading ruler, parser LLM, STT, cache, skema DB)
bun run prewarm                # panaskan cache AI untuk materi demo
bun run db:generate            # generate migrasi Drizzle (packages/db) — tanpa snapshot
bun run db:generate:direct     # generate via drizzle-kit langsung (bila perlu --hints)
bun run db:migrate:deploy      # pengingat: migrasi D1 diterapkan oleh `bun run deploy`
bun run env:generate           # regenerate src/env.ts dari skema Varlock
bun run deploy                 # deploy ke Cloudflare via Alchemy
bun run destroy                # hapus resource Alchemy
```

### Task Turbo
Task didefinisikan di `turbo.json`: `build` (outputs `dist/**`), `dev` (persistent, no cache), `lint`, `check-types`, `db:generate`, `db:migrate:deploy`, `deploy`, `destroy`. Task `deploy`/`destroy` **tidak** `interactive` (bisa jalan tanpa TTY, mis. di CI/agent). `globalEnv` mencakup secret Cloudflare/Better-Auth, `DEEPSEEK_*`, `GEMINI_*`, & `VITE_SERVER_URL`.

### Migrasi D1 — siapa yang menerapkan?

**Alchemy**, bukan `drizzle-kit migrate`. Di `packages/infra/alchemy.run.ts`, resource D1 dibuat dengan direktori migrasi:

```ts
export const db = Cloudflare.D1.Database("database", {
  migrations: "../../packages/db/src/migrations",
});
```

Konsekuensinya:

- Saat `bun run deploy`, Alchemy mendeteksi migrasi yang belum diterapkan lalu menjalankannya berurutan (bookkeeping: tabel `__alchemy_migrations`).
- Database yang pernah dimigrasi dengan `drizzle-kit migrate` **diadopsi satu arah** pada deploy pertama — tidak perlu baselining, dan tabel lama dibiarkan beku.
- Karena itu `packages/db/drizzle.config.ts` sengaja **tidak** memuat kredensial D1 HTTP: `drizzle-kit migrate` akan gagal cepat dengan arahan ke `bun run deploy`, daripada menulis diam-diam ke database lain.
- `bun run db:migrate:deploy` kini hanya **pengingat** (bukan perintah aplikasi). Jangan memakai dua mekanisme migrasi sekaligus untuk tabel bookkeeping yang sama.

---

## 10. Environment Variables (Varlock)

Skema env hidup di file `.env.schema` dan di-generate menjadi `src/env.ts` oleh Varlock (`bun run env:generate`, juga dijalankan otomatis via `postinstall`).

| File skema | Variabel | Sensitivitas |
|---|---|---|
| `apps/server/.env.schema` | `NODE_ENV`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `CORS_ORIGIN`, `DEEPSEEK_*`, `GEMINI_*`, `PREWARM_TOKEN` | rahasia default (`@defaultSensitive=true`) |
| `packages/db/.env.schema` | impor `NODE_ENV` | — |
| `packages/infra/.env.schema` | impor server + `DEEPSEEK_*`, `GEMINI_*`, `PREWARM_TOKEN`, `ALCHEMY_PASSWORD` | rahasia |

> **Catatan:** `apps/frontend/` tidak memakai Varlock; env publik (`VITE_SERVER_URL`) dibaca lewat `apps/frontend/src/lib/env.ts` dari `import.meta.env`, diisi oleh Alchemy saat deploy.

- **Klien frontend** mengakses env publik lewat `apps/frontend/src/lib/env.ts` (`VITE_SERVER_URL`), bukan `import.meta.env` langsung di komponen.
- **Server Worker** mengakses env lewat `apps/server/src/env.server.ts` (re-export `env` dari `cloudflare:workers`).
- Nilai binding (`DB`, `CORS_ORIGIN`, `BETTER_AUTH_URL`, dll.) disuplai Alchemy di `packages/infra/alchemy.run.ts`.
- **Jangan edit** `src/env.ts` (autogenerated). Ubah `.env.schema`, lalu `bun run env:generate`.

---

## 11. Definition of Done (per Fitur)

Sebuah fitur dianggap **selesai** hanya jika:
1. Berjalan di **perangkat fisik** (bukan hanya di emulator browser).
2. Tidak ada error di console.
3. Dapat diakses keyboard dan terbaca screen reader.
4. Responsivitas terjaga pada lebar 360px dan 768px.
5. Lolos `bun run check-types` dan `bun run build` dari root.
6. Sudah di-commit dan di-push ke `main`.
7. **Dapat didemokan dalam < 5 detik tanpa penjelasan teknis.**

---

## 12. Larangan Tegas (Scope Discipline)

Selama sprint 3 hari, dilarang:
1. Menambah fitur dari daftar **Future Work** (lihat `SRS` Bagian 8) — **kecuali** P0 & Should sudah selesai dan item itu disetujui eksplisit (mis. OCR via Gemini, build Tauri Android — keduanya **sudah** dikerjakan).
2. Melakukan refactor besar pada kode yang sudah berjalan.
3. Menambahkan state management / library baru tanpa alasan yang memblokir P0.
4. Membangun autentikasi atau database multi-pengguna di luar Better-Auth yang sudah ada.
5. Menulis test suite lengkap — cukup test manual + 1–2 unit test untuk util kritis (mis. reading ruler, parser JSON LLM).
6. Menyentuh konfigurasi Tauri sampai seluruh P0 selesai (kini sudah selesai → build Android diizinkan).
7. Menambah endpoint REST paralel di luar tRPC tanpa alasan kuat.

> **Catatan penyimpangan yang diizinkan:** **OCR tulisan tangan** (`ai.ocrToFlashcards`) dan
> **build Tauri Android** dikerjakan setelah P0/Should beres (keduanya kini **selesai**). Keduanya
> **tidak boleh** mengubah provider AI fitur teks: seluruh fitur teks tetap **DeepSeek**,
> dan **Gemini hanya** untuk OCR vision.
>
> **Pengecualian suara (TTS/STT):** `speech.synthesize` & `speech.transcribe` memakai Gemini
> karena DeepSeek tidak menyediakan endpoint audio. Ini tetap konsisten dengan pemisahan di atas —
> DeepSeek memegang seluruh **teks**, Gemini memegang **audio & gambar**. Jalur ini dipakai
> sebagai *fallback* saat WebView Android/APK Tauri tidak punya mesin suara perangkat.

---

## 13. Rencana Fallback (Jika Waktu Habis)

| Kondisi | Tindakan |
|---|---|
| Hanya 60% Core selesai | Prioritaskan: Akses → Focus Reader → Simplify → Kuis. Pustaka diisi beberapa materi dibuat lewat Teman AI. |
| DeepSeek bermasalah saat demo | Gunakan respons cache yang sudah dipanaskan; tampilkan banner status. |
| Deploy Cloudflare bermasalah | Jalankan `bun run dev` lokal; siapkan URL demo cadangan. |
| Tauri tidak selesai | Demo PWA. Tidak ada penalti besar; Tauri tetap ada di repo (`apps/frontend/src-tauri`). |
| Animasi belum selesai | Hilangkan animasi, fokus fungsi. Animasi tidak pernah mengalahkan fitur yang jalan. |
| Jaringan ruangan mati total | Gunakan mode luring: materi + kuis dari IndexedDB, TTS tetap berjalan (Web Speech lokal). |
