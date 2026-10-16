# TODO — progres implementasi (SELESAI)

- [x] Fase 1: Tabel `materials` + migrasi SQL (`20261016120000_materials`)
- [x] Fase 1: `materials.list` / `byId` / `create` dari DB (kepemilikan per `userId`)
- [x] Fase 2: Hapus dummy (seed fallback, banner "Baru Selesai", filter palsu, pratinjau hardcoded, `isFeatured`, misi `fotosintesis`)
- [x] Fase 3: Navbar & tabbar konsisten (hapus judul "Mudahin" + subjudul/lencana khusus Latihan)
- [x] Fase 4: Halaman Belajar → klik materi → dialog pilih jenis latihan → modal latihan
- [x] Fase 5: Halaman utama → input PDF & gambar nyata (`pdfjs-dist` untuk ekstraksi teks PDF)
- [x] Fase 6: Verifikasi (ultracite biome check bersih, `tsc --noEmit` 4 paket lolos, build frontend lolos, `bun run verify` 104 check lolos)

## Iterasi 2 — Navbar full width, mic sejajar, suara server-side

- [x] Navbar atas & tab bar bawah selalu **selebar layar** (batas `max-w-xl` di dalam bilah dihapus; ruang aman notch dipindah ke padding, bukan margin)
- [x] Baris aksi input AI memakai grid 3 kolom tetap → tombol **mic sejajar** dengan "+ Foto Catatan" & "+ File PDF" termasuk di mobile (label tidak lagi disembunyikan)
- [x] **TTS server-side**: `speech.synthesize` (Gemini TTS) → WAV, diputar lewat `<audio>` bila perangkat tidak punya mesin suara
- [x] **STT server-side**: `speech.transcribe` (Gemini) dari rekaman `MediaRecorder` → teks, saat `SpeechRecognition` tidak ada
- [x] Pemilihan jalur otomatis (`lib/speech.ts`, `lib/speech-stt.ts`): Web Speech API dulu, fallback server bila tidak didukung
- [x] Verifikasi: `bun run verify` **134 check** lolos (termasuk suite baru `scripts/verify-speech.ts`), `check-types` & build frontend lolos, ultracite bersih

## Iterasi 3 — XP & progres harian persisten, riwayat latihan, penilaian suara

- [x] **XP & progres harian tersimpan**: tabel `gamification_state` + store `mudahin-gamification`; XP tidak lagi hilang saat reload, dan `progress.reward` menghitung rentetan harian (tanggal `YYYY-MM-DD`)
- [x] XP & rentetan **ikut cadangan** (`gamification` di `backupSnapshotSchema` v2, `data.export`/`data.import`, `use-device-backup`); snapshot lama (v1) tetap aman saat dipulihkan
- [x] **Navbar atas & bawah layar penuh** namun tidak pernah melebihi layar (`w-full max-w-full` + `overflow-x-hidden` pada `html/body`/root) — berlaku di mobile & web
- [x] **Latihan "Jawab dengan Suara" otomatis dikirim & dinilai**: hening sejenak → transkrip dikirim ke `progress.recordVoiceAttempt`, dinilai deterministik (kata kunci), jawaban benar → +XP layaknya latihan lain
- [x] **Riwayat latihan** (`progress.voiceHistory` + tab "Riwayat Latihan") menampilkan pertanyaan, ucapan, putusan, & umpan balik — dan dapat **diulang** tanpa memberi XP (mode ulangan)
- [x] **Fallback TTS/STT server-side dipilih otomatis** di mobile/desktop yang tidak mendukung Web Speech (`shouldPreferServerStt`), tombol lisan tidak lagi mati karena `speechSynthesis` tidak ada (`canRecordSpeech`)
- [x] Verifikasi: `bun run verify` **242 check** lolos (termasuk `scripts/verify-voice.ts` baru), `check-types` 3 paket lolos, build frontend lolos, ultracite bersih pada berkas yang disentuh
