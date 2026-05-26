# @getworkbench/fastify

Fastify adapter for [Workbench](https://getworkbench.dev) — a beautiful, open-source BullMQ dashboard for modern Node apps.

Mounts as a plugin on your existing Fastify app. No separate service.

## Install

```bash
npm i @getworkbench/fastify bullmq fastify
```

Or with the CLI:

```bash
npx @getworkbench/cli init
```

## Usage

```ts
import Fastify from "fastify";
import { Queue } from "bullmq";
import { workbench } from "@getworkbench/fastify";

const app = Fastify();
const emailQueue = new Queue("email", {
  connection: { url: process.env.REDIS_URL! },
});

await app.register(
  workbench({
    queues: [emailQueue],
    auth: {
      username: process.env.WORKBENCH_USER!,
      password: process.env.WORKBENCH_PASS!,
    },
  }),
  { prefix: "/jobs" },
);

await app.listen({ port: 3000 });
```

Visit `http://localhost:3000/jobs`.

## Requirements

- Node 18+
- Fastify 5+
- TypeScript: this adapter itself has no specific minimum, but Fastify 5's own bundled `.d.ts` uses TypeScript 5.0 syntax, so most projects will need TS 5.0+ in practice.

## Options

| Option     | Type                        | Description                                            |
| ---------- | --------------------------- | ------------------------------------------------------ |
| `queues`   | `Queue[]`                   | BullMQ `Queue` instances to display. Required.         |
| `auth`     | `{ username, password }`    | Basic auth credentials. Strongly recommended in prod.  |
| `title`    | `string`                    | Dashboard title. Default: `"Workbench"`.               |
| `logo`     | `string`                    | Logo URL to display in the nav.                        |
| `basePath` | `string`                    | Override base path detection.                          |
| `readonly` | `boolean`                   | Disable actions (retry, remove, promote).              |
| `tags`     | `string[]`                  | Fields from `job.data` to extract as filterable tags.  |

## Documentation

[getworkbench.dev](https://getworkbench.dev) · [GitHub](https://github.com/pontusab/workbench)

## License

MIT
