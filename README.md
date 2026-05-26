# Workbench

Open-source BullMQ dashboard. Drop-in for any Node or Bun backend.

Workbench is a modern dashboard for [BullMQ](https://docs.bullmq.io/). Runs jobs, flows, schedulers and metrics, all served from your own backend behind your own auth.

- Zero infrastructure — mounts as a route in your existing app
- Adapters for Hono, Elysia, Express, Fastify, NestJS, and Next.js
- Flows & DAG view, metrics, schedulers, search
- Dark-mode UI, basic-auth-protected by default
- MIT licensed

Website: [getworkbench.dev](https://getworkbench.dev)

## Quick start

```bash
npx @getworkbench/cli init
```

The CLI detects your framework, installs the matching `@getworkbench/<fw>` package, injects the mount (or scaffolds a route file for Next.js), writes `.env.example` entries, and optionally drops a `docker-compose.yml` for Redis.

## Manual setup

Pick the adapter that matches your stack:

<details>
<summary><strong>Hono</strong></summary>

```bash
npm i @getworkbench/hono bullmq hono
```

```ts
import { Hono } from "hono";
import { Queue } from "bullmq";
import { workbench } from "@getworkbench/hono";

const app = new Hono();
const emailQueue = new Queue("email", { connection: { url: process.env.REDIS_URL! } });

app.route("/jobs", workbench({ queues: [emailQueue] }));

export default app;
```

</details>

<details>
<summary><strong>Elysia</strong></summary>

```bash
bun add @getworkbench/elysia bullmq elysia
```

```ts
import { Elysia } from "elysia";
import { Queue } from "bullmq";
import { workbench } from "@getworkbench/elysia";

const emailQueue = new Queue("email", { connection: { url: process.env.REDIS_URL! } });

new Elysia()
  .mount("/jobs", workbench({ queues: [emailQueue], basePath: "/jobs" }))
  .listen(3000);
```

</details>

<details>
<summary><strong>Express</strong></summary>

```bash
npm i @getworkbench/express bullmq express
```

```ts
import express from "express";
import { Queue } from "bullmq";
import { workbench } from "@getworkbench/express";

const app = express();
const emailQueue = new Queue("email", { connection: { url: process.env.REDIS_URL! } });

app.use("/jobs", workbench({ queues: [emailQueue] }));
app.listen(3000);
```

</details>

<details>
<summary><strong>Fastify</strong></summary>

```bash
npm i @getworkbench/fastify bullmq fastify
```

```ts
import Fastify from "fastify";
import { Queue } from "bullmq";
import { workbench } from "@getworkbench/fastify";

const app = Fastify();
const emailQueue = new Queue("email", { connection: { url: process.env.REDIS_URL! } });

await app.register(workbench({ queues: [emailQueue] }), { prefix: "/jobs" });
await app.listen({ port: 3000 });
```

</details>

<details>
<summary><strong>NestJS</strong></summary>

```bash
npm i @getworkbench/nestjs bullmq
```

```ts
import { NestFactory } from "@nestjs/core";
import { Queue } from "bullmq";
import { workbench } from "@getworkbench/nestjs";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const emailQueue = new Queue("email", { connection: { url: process.env.REDIS_URL! } });

  await workbench(app, "/jobs", { queues: [emailQueue] });

  await app.listen(3000);
}
bootstrap();
```

> Works on both the Express (default) and Fastify NestJS platforms.

</details>

<details>
<summary><strong>Next.js (App Router)</strong></summary>

```bash
npm i @getworkbench/next bullmq
```

```ts
// app/jobs/[[...workbench]]/route.ts
import { Queue } from "bullmq";
import { workbench } from "@getworkbench/next";

const emailQueue = new Queue("email", { connection: { url: process.env.REDIS_URL! } });

export const { GET, POST, PUT, PATCH, DELETE } = workbench({
  queues: [emailQueue],
  basePath: "/jobs",
});
```

> Next doesn't host BullMQ workers itself — run them in a sibling process. See [examples/with-next](./examples/with-next/).

</details>

Visit `http://localhost:PORT/jobs`.

## Configuration

| Option     | Type                                | Description                                                |
| ---------- | ----------------------------------- | ---------------------------------------------------------- |
| `queues`   | `Queue[]`                           | BullMQ `Queue` instances to display. Required.             |
| `auth`     | `{ username, password }`            | Basic auth credentials. Strongly recommended in prod.      |
| `title`    | `string`                            | Dashboard title. Default: `"Workbench"`.                   |
| `logo`     | `string`                            | Logo URL to display in the nav.                            |
| `basePath` | `string`                            | Override base path detection. Required for `@getworkbench/elysia` and `@getworkbench/next`. |
| `readonly` | `boolean`                           | Disable actions (retry, remove, promote).                  |
| `tags`     | `string[]`                          | Fields from `job.data` to extract as filterable tags.      |

## Packages

| Package                                                                 | Description                  |
| ----------------------------------------------------------------------- | ---------------------------- |
| [`@getworkbench/core`](./packages/core)                                 | Core + API router + UI       |
| [`@getworkbench/hono`](./packages/hono)                                 | Hono adapter                 |
| [`@getworkbench/elysia`](./packages/elysia)                             | Elysia adapter               |
| [`@getworkbench/express`](./packages/express)                           | Express adapter              |
| [`@getworkbench/fastify`](./packages/fastify)                           | Fastify adapter              |
| [`@getworkbench/nestjs`](./packages/nestjs)                             | NestJS adapter               |
| [`@getworkbench/next`](./packages/next)                                 | Next.js App Router adapter   |
| [`@getworkbench/cli`](./packages/cli)                                   | `npx @getworkbench/cli init` |

[Hyper](https://hyperjs.ai) is distributed via a source-component registry, so its Workbench integration ships separately as a `hyper add @getworkbench` component in the [pontusab/hyper](https://github.com/pontusab/hyper) repo.

## FAQ

**Is it BullMQ-only?** Yes. Bull (legacy) is not supported.

**What Node version?** 18+ (or Bun 1.1+ for the Elysia adapter).

**What TypeScript version?** Any TypeScript 4.x or 5.x for the non-Hono adapters (Express, Fastify, NestJS, Next.js, Elysia) and `@getworkbench/core`. **`@getworkbench/hono` requires TypeScript 5.0+** because Hono 4's own bundled `.d.ts` uses `const` type parameters introduced in TS 5.0.

**Can I run it without auth?** Yes, omit the `auth` option. Don't do that in production.

**Does it require a separate service?** No. It mounts as a route in your existing backend.

## Development

```bash
bun i
bun run build
bun run typecheck

# end-to-end smoke test against every example
docker compose up -d redis
bun run smoke
```

See [CONTRIBUTING.md](./CONTRIBUTING.md).

## License

MIT © [Pontus Abrahamsson](https://github.com/pontusab)
