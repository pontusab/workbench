import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  dts: true,
  sourcemap: true,
  clean: true,
  target: "node18",
  outDir: "dist",
  external: ["@getworkbench/core", "bullmq", "next"],
});
