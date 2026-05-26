# @getworkbench/nestjs

NestJS adapter for [Workbench](https://getworkbench.dev) — a beautiful, open-source BullMQ dashboard for modern Node apps.

Mounts as a single call inside your `main.ts`. Works on both the Express (default) and Fastify NestJS platforms.

## Install

```bash
npm i @getworkbench/nestjs bullmq
```

Or with the CLI:

```bash
npx @getworkbench/cli init
```

## Usage

```ts
import { NestFactory } from "@nestjs/core";
import { Queue } from "bullmq";
import { workbench } from "@getworkbench/nestjs";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const emailQueue = new Queue("email", {
    connection: { url: process.env.REDIS_URL! },
  });

  await workbench(app, "/jobs", {
    queues: [emailQueue],
    auth: {
      username: process.env.WORKBENCH_USER!,
      password: process.env.WORKBENCH_PASS!,
    },
  });

  await app.listen(3000);
}
bootstrap();
```

Visit `http://localhost:3000/jobs`.

Call `workbench(app, ...)` **before** `app.listen(...)`.

## Requirements

- Node 18+
- NestJS 10+ (Express or Fastify platform)
- TypeScript 4.x or 5.x (no specific minimum)

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
