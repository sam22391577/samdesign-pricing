import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  root: "github-pages",
  base: "/samdesign-pricing/",
  publicDir: false,
  plugins: [react()],
  build: {
    outDir: "../gh-pages-app",
    emptyOutDir: true,
    assetsDir: "_calculator",
  },
});
