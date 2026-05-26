import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts", "src/hono.ts"],
  format: ["esm"],
  dts: true,
  sourcemap: true,
  clean: false,
  target: "node18",
  outDir: "dist",
  external: ["bullmq", "hono", "ioredis", "lru-cache"],
});
