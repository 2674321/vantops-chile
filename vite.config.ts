/// <reference types="vitest/config" />
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig(({ command }) => ({
  plugins: [react(), tailwindcss()],
  base: command === "serve" ? "/" : "/vantops-chile/",
  test: {
    environment: "node",
    include: ["src/**/*.test.{ts,tsx}"],
  },
}));
