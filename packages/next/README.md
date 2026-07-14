<p align="center">
  <a href="https://getworkbench.dev">
    <img src="https://raw.githubusercontent.com/pontusab/workbench/main/hero.png" alt="Workbench — the missing dashboard for BullMQ" />
  </a>
</p>

# @getworkbench/next

Next.js App Router adapter for [Workbench](https://getworkbench.dev) — a beautiful, open-source BullMQ dashboard for modern Node apps.

Mounts as a single catch-all route in your existing Next.js app. No separate service.

## Migrating from bull-board?

Workbench covers the same BullMQ use case with a modern UI, broader framework support, and a one-command install. Remove your `@bull-board/*` packages and run `npx @getworkbench/cli init`.

Full comparison: [Workbench vs Bull Board](https://getworkbench.dev/blog/workbench-vs-bull-board)

## Install

```bash
npm i @getworkbench/next bullmq
```

Or with the CLI:

```bash
npx @getworkbench/cli init
```

## Usage

Create a catch-all route file at `app/<mount>/[[...workbench]]/route.ts`:

```ts
import { Queue } from "bullmq";
import { workbench } from "@getworkbench/next";

const emailQueue = new Queue("email", {
  connection: { url: process.env.REDIS_URL! },
});

export const { GET, POST, PUT, PATCH, DELETE } = workbench({
  queues: [emailQueue],
  basePath: "/jobs",
  auth: {
    username: process.env.WORKBENCH_USER!,
    password: process.env.WORKBENCH_PASS!,
  },
});
```

> `basePath` must match the route file's directory so the dashboard's
> `<base href>` and internal routing line up with the App Router URL.

Visit `http://localhost:3000/<mount>`.

> Note: Next.js doesn't host BullMQ workers itself — run them in a sibling
> process. See `examples/with-next/` for a reference.

## Requirements

- Node 18+
- Next.js 14+ (App Router)
- TypeScript 4.x or 5.x (no specific minimum)

## Options

| Option     | Type                        | Description                                            |
| ---------- | --------------------------- | ------------------------------------------------------ |
| `queues`   | `Queue[] \| Promise<Queue[]>` | BullMQ `Queue` instances to display, or a promise resolving to them. Required. |
| `auth`     | `{ username, password }`    | Basic auth credentials. Strongly recommended in prod.  |
| `title`    | `string`                    | Dashboard title. Default: `"Workbench"`.               |
| `logo`     | `string`                    | Logo URL to display in the nav.                        |
| `basePath` | `string`                    | Override base path detection.                          |
| `readonly` | `boolean`                   | Disable actions (retry, remove, promote).              |
| `tags`     | `string[]`                  | Fields from `job.data` to extract as filterable tags.  |

## Documentation

**https://getworkbench.dev/docs/frameworks/next** — full install guide, configuration, and examples.

[getworkbench.dev](https://getworkbench.dev/docs) · [GitHub](https://github.com/pontusab/workbench)

## License

MIT
