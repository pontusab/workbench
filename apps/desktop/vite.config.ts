import { resolve } from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

/**
 * Vite config for the desktop app.
 *
 * The dashboard UI is imported from `@getworkbench/core/ui`. The package's
 * published export points at the built `dist/ui-lib` bundle, so we alias it
 * to the source entry (`packages/core/src/ui`) here — the desktop always
 * builds the dashboard from source and gets HMR into it during dev. Those
 * source files use `@/...` and `@/core/...` imports internally, so we also
 * replicate the core package's alias setup. The desktop's own source files
 * use **relative imports** (no `@/` prefix) so the alias map stays
 * unambiguous.
 */
export default defineConfig({
  plugins: [react()],
  clearScreen: false,
  server: {
    port: 5173,
    strictPort: true,
    host: "127.0.0.1",
    hmr: {
      protocol: "ws",
      host: "127.0.0.1",
      port: 5173,
    },
    watch: {
      ignored: ["**/src-tauri/**", "**/sidecar/**"],
    },
  },
  envPrefix: ["VITE_", "TAURI_"],
  resolve: {
    alias: [
      {
        find: "@getworkbench/core/ui",
        replacement: resolve(__dirname, "../../packages/core/src/ui/index.ts"),
      },
      // Note: order matters. The more-specific `@/core` alias must come
      // before the generic `@/` to win for paths like `@/core/types`.
      {
        find: /^@\/core\/(.*)$/,
        replacement: resolve(__dirname, "../../packages/core/src/core/$1"),
      },
      {
        find: /^@\/(.*)$/,
        replacement: resolve(__dirname, "../../packages/core/src/ui/$1"),
      },
    ],
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
    target: "esnext",
    chunkSizeWarningLimit: 1500,
  },
});
