import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig(() => {
  return {
    resolve: {
      alias: {
        "@": path.resolve(import.meta.dirname, "src"),
      },
    },
    // Beberapa dependency merujuk `process.env`. Runtime Cloudflare/workerd
    // tidak menyediakan `node:process`, jadi referensi ini di-inline agar tidak
    // ada permintaan modul `node:process` (Aturan Teknis §1 — target Workers).
    define: {
      "process.env": JSON.stringify({}),
      "process.env.NODE_ENV": JSON.stringify(
        process.env.NODE_ENV ?? "development"
      ),
      "process.env.TSS_INLINE_CSS_ENABLED": JSON.stringify("false"),
      "process.env.NEXTAUTH_URL": JSON.stringify(""),
      "process.env.NEXT_PUBLIC_AUTH_URL": JSON.stringify(""),
      "process.env.VERCEL_URL": JSON.stringify(""),
    },
    // Kecualikan dari bundel klien agar tidak menarik `node:process`.
    optimizeDeps: {
      exclude: ["varlock", "varlock/env"],
    },
    server: {
      port: 3002,
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== "true",
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === "true" ? null : {},
    },
    plugins: [
      react(),
      tailwindcss(),
      // PWA: agar aplikasi dapat dipasang di layar utama & berjalan luring
      // (strategi ketahanan demo SRS §4.5). Mobile-first.
      VitePWA({
        registerType: "autoUpdate",
        workbox: { globPatterns: ["**/*.{js,css,html,png,svg,ico}"] },
        manifest: {
          name: "mudahin",
          short_name: "mudahin",
          description: "mudahin - PWA Application",
          theme_color: "#0c0c0c",
        },
        pwaAssets: { disabled: false, config: true },
        devOptions: { enabled: true },
      }),
    ],
  };
});
