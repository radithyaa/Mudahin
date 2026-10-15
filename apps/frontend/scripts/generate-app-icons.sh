#!/usr/bin/env bash
#
# Regenerasi seluruh ikon aplikasi Mudahin dari sumber SVG.
#
# Sumber ikon (meniru logo pojok kiri navbar: api ungu rounded + bayangan):
#   - scripts/app-icon.svg            → ikon utama (web/PWA & desktop/native)
#   - scripts/app-icon-android-fg.svg → foreground adaptif Android (api putih)
#   - scripts/app-icon-android-bg.svg → background adaptif Android (ungu penuh)
#
# Prasyarat: `rsvg-convert` (librsvg), Bun, dan dependency workspace terpasang.
# Dipakai untuk web (favicon + PWA) maupun aplikasi native (Tauri + Android).
#
# Jalankan dari apps/frontend: `bun run icons:generate`
set -euo pipefail

cd "$(dirname "$0")/.."

command -v rsvg-convert >/dev/null 2>&1 || {
  echo "rsvg-convert tidak ditemukan (pasang paket 'librsvg2-bin')." >&2
  exit 1
}

echo "→ Merender master PNG (1024) dari SVG…"
rsvg-convert -w 1024 -h 1024 scripts/app-icon.svg -o scripts/app-icon.png
rsvg-convert -w 1024 -h 1024 scripts/app-icon-android-fg.svg -o scripts/app-icon-android-fg.png
rsvg-convert -w 1024 -h 1024 scripts/app-icon-android-bg.svg -o scripts/app-icon-android-bg.png

echo "→ Menyiapkan sumber ikon web/PWA…"
rsvg-convert -w 512 -h 512 scripts/app-icon.svg -o public/logo.png

echo "→ Membuat aset PWA + favicon…"
bunx --bun @vite-pwa/assets-generator --preset minimal-2023

echo "→ Membuat ikon native (Tauri desktop/iOS + Android adaptif)…"
bunx --bun @tauri-apps/cli icon scripts/app-icon.manifest.json

echo "✓ Selesai. Aset ada di public/ dan src-tauri/icons (serta mipmap Android)."
