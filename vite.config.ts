/// <reference types="vitest/config" />
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig(({ command }) => ({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["icon-192.png", "icon-512.png"],
      manifest: {
        name: "VantOPS Chile",
        short_name: "VantOPS",
        id: "/vantops-chile/",
        description: "Planificación de vuelo RPAS con datos reales",
        theme_color: "#020617",
        background_color: "#020617",
        display: "standalone",
        scope: "/vantops-chile/",
        start_url: ".",
        lang: "es-CL",
        dir: "ltr",
        categories: ["weather", "utilities"],
        icons: [
          { src: "icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icon-512.png", sizes: "512x512", type: "image/png" },
          {
            src: "icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
        shortcuts: [
          {
            name: "Registrar vuelo",
            short_name: "Vuelo",
            url: "/vantops-chile/#/bitacora/nuevo",
            icons: [{ src: "icon-192.png", sizes: "192x192" }],
          },
          {
            name: "Consultar condiciones",
            short_name: "Clima",
            url: "/vantops-chile/",
            icons: [{ src: "icon-192.png", sizes: "192x192" }],
          },
          {
            name: "Bitácora",
            short_name: "Bitácora",
            url: "/vantops-chile/#/bitacora",
            icons: [{ src: "icon-192.png", sizes: "192x192" }],
          },
        ],
      },
      workbox: {
        navigateFallback: "index.html",
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\.open-meteo\.com\/.*/i,
            handler: "NetworkFirst",
            options: {
              cacheName: "open-meteo",
              expiration: { maxEntries: 50, maxAgeSeconds: 600 },
            },
          },
          {
            urlPattern: /^https:\/\/metar\.vatsim\.net\/.*/i,
            handler: "NetworkFirst",
            options: {
              cacheName: "vatsim-metar",
              expiration: { maxEntries: 20, maxAgeSeconds: 600 },
            },
          },
        ],
      },
    }),
  ],
  base: command === "serve" ? "/" : "/vantops-chile/",
  test: {
    environment: "node",
    include: ["src/**/*.test.{ts,tsx}"],
  },
}));
