import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  dts: true,
  sourcemap: true,
  clean: true,
  target: "node18",
  outDir: "dist",
  external: [
    "@getworkbench/core",
    "@getworkbench/express",
    "@getworkbench/fastify",
    "@nestjs/common",
    "@nestjs/core",
    "bullmq",
  ],
});
