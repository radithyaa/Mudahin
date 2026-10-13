import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  server: {
    port: 3001,
  },
  // Beberapa dependency (mis. `better-auth`, devtools TanStack) merujuk
  // `process.env`. Runtime Cloudflare/workerd tidak menyediakan `node:process`,
  // jadi referensi ini di-inline agar tidak ada permintaan modul `node:process`
  // (Aturan Teknis §1 — target runtime adalah Workers).
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
  resolve: {
    tsconfigPaths: true,
  },
  // Varlock hanya dipakai untuk typegen; runtime web membaca `import.meta.env`.
  // Kecualikan dari bundel klien agar tidak menarik `node:process`.
  optimizeDeps: {
    exclude: ["varlock", "varlock/env"],
  },
  plugins: [
    tailwindcss(),
    tanstackRouter({
      target: "react",
      autoCodeSplitting: true,
    }),
    react(),
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
});
