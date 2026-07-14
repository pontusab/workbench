import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Regression test for #32: the `./ui` export pointed at `./src/ui/index.ts`,
 * but only `dist` is published (see the `files` array), so the published
 * package could not resolve `@getworkbench/core/ui` at all.
 */

const pkg = JSON.parse(
  readFileSync(join(import.meta.dir, "../package.json"), "utf8"),
) as { files: string[]; exports: Record<string, unknown> };

function exportTargets(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (value && typeof value === "object") {
    return Object.values(value).flatMap(exportTargets);
  }
  return [];
}

describe("package.json exports", () => {
  test("dist is published", () => {
    expect(pkg.files).toContain("dist");
  });

  test("every export target points into dist/", () => {
    const targets = exportTargets(pkg.exports);
    expect(targets.length).toBeGreaterThan(0);
    for (const target of targets) {
      expect(target).toStartWith("./dist/");
    }
  });
});
