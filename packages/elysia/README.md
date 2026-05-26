# @getworkbench/elysia

Elysia adapter for [Workbench](https://getworkbench.dev) — a beautiful, open-source BullMQ dashboard for modern Bun apps.

Mounts as a route in your existing Elysia app. No separate service.

## Install

```bash
bun add @getworkbench/elysia bullmq elysia
```

Or with the CLI:

```bash
bunx @getworkbench/cli init
```

## Usage

```ts
import { Elysia } from "elysia";
import { Queue } from "bullmq";
import { workbench } from "@getworkbench/elysia";

const emailQueue = new Queue("email", {
  connection: { url: process.env.REDIS_URL! },
});

new Elysia()
  .mount(
    "/jobs",
    workbench({
      queues: [emailQueue],
      basePath: "/jobs",
      auth: {
        username: process.env.WORKBENCH_USER!,
        password: process.env.WORKBENCH_PASS!,
      },
    }),
  )
  .listen(3000);
```

> Elysia's `.mount()` strips the mount prefix before passing the request, so
> always pass `basePath` matching the mount path — that's what the
> dashboard's HTML uses for its `<base href>` so assets resolve correctly.

Visit `http://localhost:3000/jobs`.

## Requirements

- Bun 1.1+ (or Node 18+ if you don't use Elysia's Bun-specific features)
- Elysia 1.0+
- TypeScript: this adapter itself has no specific minimum, but Elysia declares a `typescript >= 5.0.0` peer dependency, so most projects will need TS 5.0+ in practice.

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
