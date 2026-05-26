# @getworkbench/core

Core of [Workbench](https://getworkbench.dev) — `QueueManager`, API router, and bundled React UI.

This package is framework-agnostic. You typically don't depend on it directly — use a framework adapter instead:

- [`@getworkbench/hono`](https://npm.im/@getworkbench/hono)

## What's inside

- `WorkbenchCore` — orchestrates queues, flows, schedulers, metrics, and search.
- `QueueManager` — wraps your BullMQ `Queue` instances and powers list / detail / mutation endpoints.
- HTTP-agnostic API router — handles `/api/*` requests for the dashboard.
- Bundled UI — pre-built React app served as a single HTML entrypoint.

## Install

```bash
npm i @getworkbench/core bullmq
```

## Direct usage (advanced)

Most users should reach for an adapter. If you need to wire Workbench into an unsupported framework, see the source for the request/response contract.

## Entry points

| Entry                          | Purpose                                                                                                                     |
| ------------------------------ | --------------------------------------------------------------------------------------------------------------------------- |
| `@getworkbench/core`           | Framework-agnostic surface: `WorkbenchCore`, `buildRouteTable`, `createFetchHandler`, types, basic auth + static helpers.   |
| `@getworkbench/core/hono`      | `buildWorkbenchApp`, `buildWorkbenchApiApp`, `createApiRoutes` — anything that returns a `Hono` instance.                   |
| `@getworkbench/core/ui`        | React `Dashboard` component for embedding the dashboard inside a host Vite/React app.                                       |
| `@getworkbench/core/ui/styles.css` | Tailwind-generated stylesheet that ships with the dashboard.                                                            |

The Hono-typed helpers live on a dedicated subpath so non-Hono adapters (Express, Fastify, NestJS, Next.js, Elysia) don't drag `hono`'s `.d.ts` into the consumer's TypeScript program. That `.d.ts` uses TypeScript 5.0 syntax (`const` type parameters) and isolating it lets TS 4.x users keep building.

## Requirements

- Node 18+ (or any runtime Hono supports)
- TypeScript 4.x or 5.x for the main entry. **TypeScript 5.0+ required if you import from `@getworkbench/core/hono`** — Hono 4's bundled `.d.ts` uses TS 5.0 syntax (`const` type parameters).

## Documentation

[getworkbench.dev](https://getworkbench.dev) · [GitHub](https://github.com/pontusab/workbench)

## License

MIT
