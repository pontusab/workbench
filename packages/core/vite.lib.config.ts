import { resolve } from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

/**
 * Library build for the `@getworkbench/core/ui` entrypoint.
 *
 * The main `vite.config.ts` builds the self-hosted SPA that adapters serve
 * from `dist/ui`. This config builds the same source as an embeddable React
 * library instead: `dist/ui-lib/index.js` plus `dist/ui-lib/styles.css`
 * (the Tailwind-generated stylesheet). Only react/react-dom are external —
 * the Dashboard brings its own router and query client, so everything else
 * is bundled and consumers just need React.
 *
 * Type declarations for this entry are emitted by tsup (see tsup.config.ts).
 */
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: resolve(__dirname, "dist/ui-lib"),
    emptyOutDir: true,
    lib: {
      entry: resolve(__dirname, "src/ui/index.ts"),
      formats: ["es"],
      fileName: () => "index.js",
      cssFileName: "styles",
    },
    rollupOptions: {
      external: ["react", "react-dom", "react/jsx-runtime", "react-dom/client"],
    },
  },
  resolve: {
    alias: [
      { find: "@/core", replacement: resolve(__dirname, "src/core") },
      { find: "@", replacement: resolve(__dirname, "src/ui") },
    ],
  },
});
