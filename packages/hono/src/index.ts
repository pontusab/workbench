import { WorkbenchCore, type WorkbenchOptions } from "@getworkbench/core";
import { buildWorkbenchApp } from "@getworkbench/core/hono";
import type { Queue } from "bullmq";
import type { Hono } from "hono";

/**
 * Mount the Workbench dashboard on a Hono app.
 *
 * @example
 * ```ts
 * import { Hono } from "hono";
 * import { Queue } from "bullmq";
 * import { workbench } from "@getworkbench/hono";
 *
 * const app = new Hono();
 * const emailQueue = new Queue("email", { connection: { url: process.env.REDIS_URL! } });
 *
 * app.route(
 *   "/jobs",
 *   workbench({
 *     queues: [emailQueue],
 *     auth: { username: process.env.WORKBENCH_USER!, password: process.env.WORKBENCH_PASS! },
 *   }),
 * );
 *
 * export default app;
 * ```
 */
export function workbench(options: WorkbenchOptions | Queue[]): Hono {
  const core = new WorkbenchCore(options);
  return buildWorkbenchApp(core);
}

export type { WorkbenchOptions } from "@getworkbench/core";
