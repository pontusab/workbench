# Changelog

All notable changes to Workbench will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- **`@getworkbench/nestjs`** CJS output (`dist/index.cjs`) via tsup, with a `require` condition in `exports`. Projects using NestJS with `"module": "commonjs"` (the default) can now import `@getworkbench/nestjs` without `ERR_PACKAGE_PATH_NOT_EXPORTED`.

## [0.9.1] - 2026-06-01

### Added

- **`@getworkbench/core`** Discord as an official alert contact point: webhook URL validation (`discord.com` / `ptb.discord.com`), embed payload formatting with severity colors, and dashboard setup instructions alongside Slack and generic webhooks.

### Fixed

- **`@getworkbench/core@0.9.0`** Republished as `0.9.1` — the initial `0.9.0` tarball was missing `dist/` (published before build artifacts were present).

### Changed

- All 14 publishable adapter packages bump together to `0.9.1`.

## [0.9.0] - 2026-06-01

Withdrawn on npm (empty tarball). Use `0.9.1` instead.

## [0.8.0] - 2026-05-30

### Added

- **`@getworkbench/core`** Self-hosted alerting: BullMQ `QueueEvents` listeners, Slack/webhook presets, dashboard **Alerts** page, and Redis-backed persistence for contact points and rules (keys under `{prefix}:workbench:alerts:*`). Alerts are enabled by default; configure destinations and rules in the dashboard to start receiving notifications.
- **`@getworkbench/core`** Slack incoming webhook validation, Block Kit payload formatting (HTTPS dashboard buttons, HTTP dev links), and in-dialog Slack setup instructions.

### Changed

- All 14 publishable adapter packages (`@getworkbench/core`, `hono`, `elysia`, `express`, `fastify`, `nestjs`, `next`, `koa`, `astro`, `nuxt`, `bun`, `h3`, `adonis`, `tanstack-start`) bump together to `0.8.0`.

## [0.7.1] - 2026-05-28

### Changed

- **`@getworkbench/core`** README updated: full adapter list, Redis auto-discovery, `WorkbenchOptions` table, `createFetchHandler` example, and `ioredis` peer in install instructions.
- **npm discoverability** — all publishable packages now include `bull-board`, `bull-board-alternative`, and `@bull-board` keywords plus comparison-focused descriptions.
- **GitHub / npm READMEs** — migration section from `@bull-board/*` to `@getworkbench/*` on root README and every adapter README.
- **getworkbench.dev** — homepage comparison section with compact feature table, plus "vs Bull Board" in nav and footer.

## [0.7.0] - 2026-05-27

### Added

- **`@getworkbench/adonis`** — first-party AdonisJS 6/7 adapter with `mountWorkbench()` for catch-all routing on `router.any()`.
- **`@getworkbench/tanstack-start`** — TanStack Start server-route adapter; mount via `createFileRoute(...)({ server: { handlers: workbench(...) } })`.
- **`@getworkbench/cli`** detects AdonisJS and TanStack Start projects and scaffolds the Workbench mount (routes file or server routes).
- Smoke-tested example apps: `examples/with-adonis`, `examples/with-tanstack-start`.
- Marketing site logos, hero strip, blog posts, and `llms.txt` entries for both frameworks.

### Changed

- All 14 publishable adapter packages (`@getworkbench/core`, `hono`, `elysia`, `express`, `fastify`, `nestjs`, `next`, `koa`, `astro`, `nuxt`, `bun`, `h3`, `adonis`, `tanstack-start`) bump together to `0.7.0`. `@getworkbench/cli` bumps to `0.5.0`; `@getworkbench/mcp` stays at `0.5.1`.

## [0.6.0] - 2026-05-27

### Added

- **`@getworkbench/core`** Overview is now the default home (`/`): fleet KPI cards, 24h throughput chart, attention alerts (worker health, paused queues, failed backlog), and per-queue health cards with sparklines and worker counts.
- **`@getworkbench/core`** collapsible shadcn sidebar with icon rail mode, `SidebarTrigger`, and `⌘B` toggle; queue list stays inline when expanded and in a HoverCard when collapsed.
- **`@getworkbench/core`** targeted shadcn primitives — `Alert`, `AlertDialog`, and Sonner toasts — for attention blocks, destructive confirms, and op feedback.
- **`@getworkbench/core`** queue **Clean completed/failed** action (DropdownMenu → AlertDialog confirm with grace period → toast).
- **`@getworkbench/core`** Runs list shows truncated `failedReason` on failed rows; list API payload trimmed via `jobToInfo(..., "list")`.
- **`@getworkbench/core`** live cues: header sync timestamp with pulse when jobs are active; active job progress bar; **Live** badge on the Logs tab.

### Changed

- **`@getworkbench/core`** Runs moves to `/runs` (Overview replaces it at `/`). Command palette and sidebar nav updated accordingly.
- **`@getworkbench/core`** `QueueInfo` now includes optional `workerCount` from BullMQ `getWorkersCount()`.
- All 12 publishable adapter packages bump together to `0.6.0`. `@getworkbench/cli` stays at `0.4.0`; `@getworkbench/mcp` stays at `0.5.1`.

## [0.5.2] - 2026-05-27

### Added

- **`@getworkbench/core`** Job Details **Logs** tab for BullMQ `job.log()` output. New `GET /jobs/:queue/:id/logs` endpoint backed by `queue.getJobLogs()`, with a lazy-loaded tab that polls while a job is active. Closes [#15](https://github.com/pontusab/workbench/issues/15).

### Changed

- **`@getworkbench/core`** sidebar logo is now the Workbench app icon as an inline React SVG (`WorkbenchIcon`), with favicon links in the bundled dashboard. **`@getworkbench/express`** and **`@getworkbench/fastify`** serve `app-icon.svg` at the mount root for browser tabs.
- All 12 publishable adapter packages (`@getworkbench/core`, `hono`, `elysia`, `express`, `fastify`, `nestjs`, `next`, `koa`, `astro`, `nuxt`, `bun`, `h3`) bump together to `0.5.2`. `@getworkbench/cli` stays at `0.4.0`; `@getworkbench/mcp` stays at `0.5.1`.

### Fixed

- **`@getworkbench/core`** sidebar queue popover scrolls when there are many queues. The list now caps height with Radix's `--radix-hover-card-content-available-height` instead of growing off-screen.

## [0.5.1] - 2026-05-26

### Added

- **`@getworkbench/mcp`** — new optional [Model Context Protocol](https://modelcontextprotocol.io) server that lets Cursor, Claude Desktop, Zed, Continue.dev, and any other MCP-aware agent inspect, debug, and operate BullMQ queues through a running Workbench dashboard. Ships 18 tools across two intents: **inspect** (`workbench_get_overview`, `list_queues`, `get_quick_counts`, `get_metrics`, `get_activity`, `list_jobs`, `list_runs`, `get_job`, `search_jobs`, `list_schedulers`, `list_flows`, `get_flow`, `list_tag_values`) and **operate** (`workbench_retry_job`, `remove_job`, `promote_job`, `pause_queue`, `resume_queue`, `run_scheduler_now`, `enqueue_job`, `clean_jobs`, `bulk_retry`, `bulk_delete`). Every read tool sets `readOnlyHint: true` so clients can auto-approve them; every write tool sets `destructiveHint: true` so clients prompt the user first. Runs over stdio via `npx @getworkbench/mcp`, configured with three env vars (`WORKBENCH_URL` required; `WORKBENCH_USERNAME` + `WORKBENCH_PASSWORD` or `WORKBENCH_TOKEN` optional). The MCP is a thin HTTP proxy to the dashboard — it inherits the dashboard's auth and `readonly` flag rather than reintroducing its own permission model, so a `403` from `readonly: true` propagates back to the agent as an actionable error. Zero new dependencies on `@getworkbench/core`; deliberately lightweight so it adds nothing to existing installs that don't opt in.

## [0.5.0] - 2026-05-26

### Added

- **"Run now" for repeatable schedulers.** New per-row action on the Schedulers page that enqueues a one-off clone of a scheduler's job (same `name`, `data`, and `opts`) so it executes immediately, without touching the cron / `every` schedule. Modern schedulers (`upsertJobScheduler`) use the stored template; legacy repeatables (`queue.add(name, data, { repeat })`) fall back to cloning the next pending iteration so the real payload + options are preserved. Surfaces in the UI as a `Play` button → confirmation dialog → clickable "Triggered job `<id>`" link that opens the job detail view. Backed by new `QueueManager.runSchedulerNow(queue, key)` and `POST /schedulers/:queue/:key/run` (respects readonly mode). Integration-tested against Redis on BullMQ 5.77.3 for both scheduler styles. (Thanks [@emilnator](https://github.com/emilnator), [#10](https://github.com/pontusab/workbench/pull/10).)

### Fixed

- **`@getworkbench/core`** scheduler "Next Run" no longer renders as a malformed negative string. `formatRelativeTime` now detects future timestamps and formats them as `in Xs / Xm / Xh / Xd` (mirroring the existing `X ago` for past times), so a Next Run ~10h out shows `in 10h` instead of `-37022s ago`. Also rebalances the Delayed tab's 12-col grid (Job ID `2→3`, Executes `3→2`) so the time column lines up with the Repeatable tab's Next Run, and renames the column header from `Executes At` to `Executes` for the natural-reading "Executes in 10h". (Thanks [@emilnator](https://github.com/emilnator), [#12](https://github.com/pontusab/workbench/pull/12).)
- **`@getworkbench/core`** Schedulers page's Delayed tab no longer mirrors the Repeatable tab. `getSchedulers()` skips delayed jobs that carry a `repeatJobKey` — BullMQ tags a scheduler's pending next-run with that key, while ad-hoc `queue.add(name, data, { delay })` jobs have none. The Delayed tab now shows only genuine ad-hoc delayed jobs; the `Delayed (N)` badge updates automatically. (Thanks [@emilnator](https://github.com/emilnator), [#11](https://github.com/pontusab/workbench/pull/11).)

### Changed

- **`@getworkbench/core`** migrated off BullMQ's deprecated `Queue.getRepeatableJobs()` to `Queue.getJobSchedulers()`. The new method is the only one in BullMQ v6 (where the old method is removed) and is what gives `runSchedulerNow` access to the scheduler `key` and stored `template`. The `SchedulerInfo.every` field is now passed through as-is from BullMQ instead of being coerced through `Number()` (the underlying type widened — coercion was redundant and lossy for object-shaped values).
- All 12 publishable adapter packages (`@getworkbench/core`, `hono`, `elysia`, `express`, `fastify`, `nestjs`, `next`, `koa`, `astro`, `nuxt`, `bun`, `h3`) bump together to `0.5.0` to keep the lockstep `workspace:*` ranges valid. `@getworkbench/cli` stays at `0.4.0` — its public surface (command-line flags) hasn't changed.
- Marketing site (`apps/web`) is now optimised for citation by AI search engines (ChatGPT, Perplexity, Claude, Gemini, Google AI Overviews). `robots.txt` explicitly allows `GPTBot`, `ChatGPT-User`, `OAI-SearchBot`, `PerplexityBot`, `ClaudeBot`, `anthropic-ai`, `Google-Extended`, `Bingbot`, and `Applebot-Extended`, and blocks `CCBot` (training-only). A new site-wide JSON-LD graph emits `Organization`, `WebSite`, and per-page `SoftwareApplication` (with `Offer` + `ItemList` of every framework adapter), and the blog posts now emit `TechArticle` / `Article` with named author attribution, `BreadcrumbList`, `dateModified`, and `FAQPage` schema on the bull-board comparison post. A new `/llms.txt` at the site root gives AI systems and autonomous agents a machine-readable summary of the project, license, and per-framework adapter URLs.

## [0.4.0] - 2026-05-26

### Added

- `@getworkbench/h3` — [h3](https://h3.unjs.io) adapter. Works for standalone h3 on Node as well as anything built on h3 (Nitro, Nuxt 3, SolidStart, Analog). Returns an `EventHandler`; register at both `/<mount>` and `/<mount>/**` because h3's `**` matches one-or-more sub-segments only.
- `@getworkbench/nuxt` — Nuxt (Nitro / h3) adapter. Thin wrapper around `@getworkbench/h3` exposing a Nuxt-specific name and docs. CLI scaffolds the three-file pattern (`server/utils/workbench.ts` + `server/routes/<mount>.ts` + `server/routes/<mount>/[...].ts`) so both the bare prefix and the catch-all are covered.
- `@getworkbench/koa` — Koa adapter. Returns a Koa middleware that does its own prefix matching based on `basePath` and falls through to `next()` for non-dashboard requests.
- `@getworkbench/astro` — Astro adapter for `output: "server"` / `"hybrid"` apps. Place in a catch-all route file (`src/pages/<mount>/[...workbench].ts`) and re-export `{ GET, POST, PUT, PATCH, DELETE, prerender }`. Note: Astro 5's default `security.checkOrigin` CSRF protection blocks non-browser POST/PUT/DELETE on the dashboard route — disable it (or scope around the dashboard) in your `astro.config.*`.
- `@getworkbench/bun` — `Bun.serve`-native adapter. Returns a fetch handler that drops straight into `Bun.serve({ fetch })`, with an optional `next` fallback so you can compose Workbench with your own routes.
- CLI auto-detects Koa, Astro, Nuxt, Bun, and h3 projects. Koa entry files get a `app.use(workbench({...}))` injection; Astro and Nuxt scaffold catch-all route files; Bun rewrites the existing `Bun.serve({ fetch })` handler to consult the dashboard first; h3 wires `app.use("<mount>", handler)` + `app.use("<mount>/**", handler)` immediately before `createServer(...)`/`listen(...)`.
- `examples/with-koa`, `examples/with-astro`, `examples/with-nuxt`, `examples/with-bun`, `examples/with-h3` — fully runnable, each with an in-process or sibling worker so the dashboard is never empty.
- Smoke test entries for the five new examples (`bun run smoke koa astro nuxt bun h3`). The suite now also asserts `GET /config`, `POST /api/refresh` (write + CORS header), and an optional fall-through assertion (`spec.passthrough`) that catches adapter bugs where the dashboard accidentally swallows non-dashboard routes.
- Marketing site (`apps/web`) gained a continuously-rolling "works with" framework strip in the hero that now cycles through all 11 official adapters (Hono, Elysia, Express, Fastify, NestJS, Next.js, Koa, Astro, Nuxt, Bun, h3). Single-color SVG icons live under `apps/web/src/components/logos/` and adapt to both themes.
- New `/blog` section with 11 per-framework announcement posts (`/blog/bullmq-dashboard-for-<framework>`) and a dedicated `/blog/workbench-vs-bull-board` comparison. Every post is statically generated, ships a per-page Open Graph image rendered via `next/og` (Workbench × framework lockup), and emits JSON-LD `Article` schema for rich-result eligibility. `/sitemap.xml` and `/robots.txt` now expose the full URL set to search engines.
- `hero.png` added to every published package README via `raw.githubusercontent.com` so npm and GitHub render the same hero across all 13 packages.

### Changed

- All 13 publishable packages (`@getworkbench/core`, `cli`, `hono`, `elysia`, `express`, `fastify`, `nestjs`, `next`, `koa`, `astro`, `nuxt`, `bun`, `h3`) are now versioned together at `0.4.0`. The CLI moves from `0.2.1` → `0.4.0` to line up with the rest of the surface.
- `biome.json` excludes the Tauri build artefacts under `apps/desktop/src-tauri/{target,gen}` from linting. The directories are already gitignored; this stops `bun run lint` from picking them up when they exist locally.

## [0.3.2] - 2026-05-26

### Fixed

- **Critical: `@getworkbench/core@0.3.1` shipped without the dashboard UI bundle.** Flipping `tsup` to `clean: true` in 0.3.1 made the `tsup` lib build wipe `dist/` *after* `vite build` had populated `dist/ui/`, so the published tarball contained no `dist/ui/index.html` or `dist/ui/assets/*`. Adapters serving the dashboard from `UI_DIST_PATH` would 404 on every dashboard request. The core build script now does `rm -rf dist` once up-front (`bun run clean && bun run build:ui && bun run build:lib`) and `tsup` keeps `clean: false`, so vite's output survives. Verified `dist/ui/` ships in the 0.3.2 tarball. **Upgrade immediately from 0.3.1.**
- Sidebar queue list is scrollable when there are many queues. The HoverCard popover now caps at `min(70svh, 32rem)` with `overflow-y-auto` instead of growing past the viewport. Long queue names also truncate inside the popover (with a `title` tooltip) so the paused indicator no longer gets pushed out. Fixes [#7](https://github.com/pontusab/workbench/issues/7).
- Queue names on the overview cards truncate with `min-w-0` + `truncate` and a `title` tooltip when too long, and the "Paused" chip is now `shrink-0`. Long names no longer overlap the status chip. Fixes [#8](https://github.com/pontusab/workbench/issues/8).
- Sidebar nav icons (and every other `<button>`) show a pointer cursor on hover again. Tailwind v4's preflight dropped `cursor: pointer` from the default button reset — a global `button:not(:disabled), [role="button"]:not([aria-disabled="true"]) { cursor: pointer; }` rule restores v3 behavior. Part of [#7](https://github.com/pontusab/workbench/issues/7).

## [0.3.1] - 2026-05-26

### Fixed

- `@getworkbench/core` `QueueManager.getJobsByTimeRange` no longer crashes with `TypeError: undefined is not an object (evaluating 'job.finishedOn')` when BullMQ returns `null`/`undefined` entries from `queue.getJobs()`. This affected the two fallback paths (missing Redis client, and the `catch` after a failed `ZRANGEBYSCORE`) and showed up as a 500 on `{basePath}/api/metrics` under real queue churn with `removeOnComplete`/`removeOnFail`. Stale entries are now filtered out before the timestamp comparison. Fixes [#5](https://github.com/pontusab/workbench/issues/5). (Thanks [@Stormix](https://github.com/Stormix), [#6](https://github.com/pontusab/workbench/pull/6).)
- "Enqueue test job" from the dashboard no longer hits a 400 from the backend. The frontend payload now matches the API's `TestJobRequest` shape (`{ queueName, jobName, data, opts: { delay } }`) instead of sending `{ queueName, name, data, delay }`. (Thanks [@goyalshivansh2805](https://github.com/goyalshivansh2805), [#4](https://github.com/pontusab/workbench/pull/4).)
- Command palette (cmdk menu) now renders correctly in light mode. The Tailwind v4 `dark` variant is registered in `globals.css`, and the dialog surface, border, and selected-item state use light-mode-aware colors so highlighted items are visible. Previously the palette appeared the same as the dark mode sheet with no visible selection state when the app was in light mode. (Thanks [@NoahGdev](https://github.com/NoahGdev), [#1](https://github.com/pontusab/workbench/pull/1).)

### Added

- BullMQ `prioritized` and `waiting-children` job states are now supported in queue and run filters, job fetching, counts, sidebar summaries, badges, flow nodes, and command palette status indicators. (Thanks [@phibr0](https://github.com/phibr0), [#2](https://github.com/pontusab/workbench/pull/2).)

### Changed

- Job status UI ordering, alongside the `prioritized` / `waiting-children` additions above.
- Every adapter's `tsup.config.ts` now has `clean: true`, so stale hashed chunk artifacts no longer linger in `dist/` between rebuilds. The `@getworkbench/core@0.3.0` tarball shipped one such unreferenced 19 KB `.d.ts` chunk; 0.3.1 ships a clean dist.

## [0.3.0] - 2026-05-26

### Fixed

- `@getworkbench/core` no longer leaks `hono` into the public TypeScript surface of the non-Hono adapters. Previously, importing anything from `@getworkbench/express`, `@getworkbench/fastify`, `@getworkbench/nestjs`, `@getworkbench/next`, or `@getworkbench/elysia` caused `tsc` to load `node_modules/hono/dist/types/types.d.ts`, which uses `const` type parameters introduced in TypeScript 5.0. On TS 4.x this produced dozens of `TS1128: Declaration or statement expected` parse errors that `skipLibCheck` could not suppress, breaking the consumer's build even though their own code never imported Hono.

### Changed

- The Hono-typed core helpers — `buildWorkbenchApp`, `buildWorkbenchApiApp`, and `createApiRoutes` — moved from the main `@getworkbench/core` entry to a new `@getworkbench/core/hono` subpath. Only `@getworkbench/hono` and the desktop sidecar (the two places that actually need a `Hono` instance) import from the new subpath; all other adapters now type-check cleanly on TypeScript 4.x.
- `@getworkbench/hono` continues to require TypeScript 5.0+ because its own public types reference `Hono`. Documented in its README.

### Added

- `engines: { node: ">=18" }` on `@getworkbench/core` and every adapter package so the existing Node 18+ requirement is surfaced by package managers at install time. (`@getworkbench/cli` already declared this.)

## [0.2.1] - 2026-05-24

### Fixed

- `@getworkbench/core` now declares `hono` as a runtime `dependency` instead of a `peerDependency`. Non-Hono adapters (`express`, `fastify`, `nestjs`, `elysia`, `next`) previously failed at import time with `ERR_MODULE_NOT_FOUND: Cannot find package 'hono'` in environments where the package manager did not auto-install peer deps (strict pnpm, certain Docker images, hoisting-disabled monorepos). Hono is a private implementation detail of core's API engine and is now always installed transitively.
- All adapters and the CLI bumped to `0.2.1` so users picking up `@getworkbench/<adapter>@latest` get the corrected `core@0.2.1`.

## [0.2.0] - 2026-05-24

### Added

- `@getworkbench/elysia` — Elysia adapter. Mounts via `.mount(path, workbench({ basePath, queues, auth }))`.
- `@getworkbench/express` — Express adapter. Returns an `express.Router` for `app.use(path, …)`.
- `@getworkbench/fastify` — Fastify v5 plugin. Registers via `app.register(workbench({…}), { prefix })`.
- `@getworkbench/next` — Next.js App Router adapter. Catch-all route exports `{ GET, POST, PUT, PATCH, DELETE }`.
- `@getworkbench/nestjs` — NestJS adapter. Single `await workbench(app, path, options)` call. Detects Express vs Fastify platform and wires the right adapter automatically.
- `buildRouteTable`, `createFetchHandler`, `buildWorkbenchApp`, `resolveBasePath`, `checkBasicAuth`, `serveStaticAsset`, and `renderIndexHtml` exports on `@getworkbench/core` so framework adapters can compose Workbench without re-implementing routing.
- `examples/with-elysia`, `examples/with-express`, `examples/with-fastify`, `examples/with-next`, `examples/with-nestjs` — each fully runnable with a single command, including an in-process worker that produces and consumes jobs so the dashboard is never empty.
- Root `docker-compose.yml` for a shared Redis instance.
- `scripts/smoke.ts` end-to-end smoke tests, wired up as `bun run smoke`. Boots every example, asserts `/api/overview`, `/api/queues`, and `<base href>` on `/` and a deep client route.
- CLI auto-detects Hono, Elysia, Express, Fastify, NestJS, and Next.js projects. For Next.js the CLI scaffolds the catch-all route file; for the others it edits the entry file in place.

### Changed

- `@getworkbench/hono` is now a thin wrapper around the framework-agnostic core (`buildWorkbenchApp`). No behavior change for existing consumers.
- Removed the "planned for 0.2" placeholder from the README; the new adapters are first-class.

## [0.1.0] - 2026-05-24

Initial public release.

### Added

- `@getworkbench/core` — `WorkbenchCore`, `QueueManager`, API router and bundled React UI.
- `@getworkbench/hono` — Hono adapter with basic-auth support.
- `@getworkbench/cli` — `npx @getworkbench/cli init` scaffolds Workbench into an existing Hono project.
- Flows & DAG view, 24h metrics, 7-day activity timeline, schedulers, search with `field:value` syntax.
- Bulk actions (retry, delete, promote).
