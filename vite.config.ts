import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import fs from "node:fs";

// Each file in src/islands/ is its own mount point, built to a predictably
// named static bundle (dist/islands/<name>.js) that any plain HTML page can
// load directly with <script type="module" src="/dist/islands/<name>.js">.
const islandsDir = path.resolve(__dirname, "src/islands");
const islandEntries = Object.fromEntries(
  fs
    .readdirSync(islandsDir)
    .filter((file) => file.endsWith(".tsx"))
    .map((file) => [file.replace(/\.tsx$/, ""), path.join(islandsDir, file)])
);

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: "dist/islands",
    emptyOutDir: true,
    cssCodeSplit: false,
    rollupOptions: {
      input: islandEntries,
      output: {
        entryFileNames: "[name].js",
        chunkFileNames: "shared-[hash].js",
        assetFileNames: (assetInfo) =>
          assetInfo.name?.endsWith(".css") ? "islands.css" : "[name][extname]",
      },
    },
  },
});
