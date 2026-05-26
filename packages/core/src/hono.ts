/**
 * `@getworkbench/core/hono` — Hono-typed adapter helpers.
 *
 * These exports live in a dedicated entry so the main `@getworkbench/core`
 * surface doesn't leak `hono` types into consumers that don't use Hono.
 * Hono 4 ships type declarations that use `const` type parameters (a
 * TypeScript 5.0 feature), and pulling them transitively through the
 * default entry broke `tsc` builds on TypeScript 4.x — including for
 * users of the Express, Fastify, NestJS, Next.js, and Elysia adapters
 * who never import Hono themselves.
 *
 * Used by:
 *   - `@getworkbench/hono` — needs `buildWorkbenchApp` to return a `Hono`
 *   - `apps/desktop/sidecar` — needs `buildWorkbenchApiApp`
 *
 * If you're writing a new adapter that doesn't return a `Hono` instance,
 * prefer `buildRouteTable` + `createFetchHandler` from `@getworkbench/core`
 * instead — those don't reference `hono` in their public types.
 */

export { createApiRoutes } from "./api/router";
export { buildWorkbenchApiApp } from "./server/hono-api-app";
export { buildWorkbenchApp } from "./server/hono-app";
