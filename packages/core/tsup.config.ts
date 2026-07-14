import { defineConfig } from "tsup";

export default defineConfig([
  {
    entry: ["src/index.ts", "src/hono.ts"],
    format: ["esm"],
    dts: true,
    sourcemap: true,
    clean: false,
    target: "node18",
    outDir: "dist",
    external: ["bullmq", "hono", "ioredis", "lru-cache"],
  },
  // Type declarations for the `./ui` entrypoint. The JS + CSS for it are
  // built by vite.lib.config.ts into dist/ui-lib; tsup only bundles the
  // d.ts here (it resolves the `@/*` path aliases from tsconfig).
  {
    entry: { index: "src/ui/index.ts" },
    format: ["esm"],
    dts: { only: true },
    outDir: "dist/ui-lib",
  },
]);
