/// <reference types="@cloudflare/workers-types" />
/// <reference path="../cloudflare-env.d.ts" />
// For Cloudflare Workers, env is accessed via cloudflare:workers module
// Types are defined in env.d.ts based on your alchemy.run.ts bindings
import { env } from "cloudflare:workers";

/** Binding environment Cloudflare Worker (lihat alchemy.run.ts). */
export const ENV = env;

/**
 * Origin bawaan WebView Tauri (desktop & Android). Tauri v2 menyajikan aset
 * lokal dari `http://tauri.localhost` (skema http secara bawaan); varian
 * `https://tauri.localhost` dan `tauri://localhost` (macOS) juga didaftarkan
 * agar APK desktop/mobile tidak diblokir CORS saat memanggil Worker.
 */
export const desktopOrigins = [
  "tauri://localhost",
  "http://tauri.localhost",
  "https://tauri.localhost",
];

/**
 * Daftar origin yang diizinkan untuk CORS.
 *
 * `CORS_ORIGIN` boleh berisi **beberapa origin dipisah koma** (mis. dev + produksi),
 * karena web dan server di-deploy ke origin `*.workers.dev` yang berbeda.
 * Origin desktop (Tauri) selalu ditambahkan.
 *
 * Contoh: `CORS_ORIGIN=https://web.example.workers.dev,http://localhost:3001`
 */
export function corsOrigins(): string[] {
  const raw = typeof ENV.CORS_ORIGIN === "string" ? ENV.CORS_ORIGIN : "";
  const configured = raw
    .split(",")
    .map((origin: string) => origin.trim())
    .filter((origin: string) => origin.length > 0);
  return [...configured, ...desktopOrigins];
}
