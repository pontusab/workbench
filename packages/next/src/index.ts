import { createFetchHandler, type WorkbenchOptions } from "@getworkbench/core";
import type { Queue } from "bullmq";

type NextRouteHandler = (req: Request) => Promise<Response>;

export interface WorkbenchHandlers {
  GET: NextRouteHandler;
  POST: NextRouteHandler;
  PUT: NextRouteHandler;
  PATCH: NextRouteHandler;
  DELETE: NextRouteHandler;
}

/**
 * Same as {@link WorkbenchOptions}, but `queues` may also be a promise so
 * apps that collect their queues asynchronously can pass the promise
 * directly instead of blocking module evaluation.
 */
export interface NextWorkbenchOptions extends Omit<WorkbenchOptions, "queues"> {
  /** BullMQ Queue instances to display, or a promise resolving to them */
  queues?: Queue[] | Promise<Queue[]>;
}

/**
 * Mount the Workbench dashboard on a Next.js App Router catch-all route.
 *
 * Place this in `app/<mount>/[[...workbench]]/route.ts` and re-export the
 * HTTP methods. The dashboard becomes available at `/<mount>`.
 *
 * `basePath` must match the route file's directory so the dashboard's
 * `<base href>` and internal routing line up with Next.js's URL.
 *
 * @example
 * ```ts
 * // app/admin/jobs/[[...workbench]]/route.ts
 * import { Queue } from "bullmq";
 * import { workbench } from "@getworkbench/next";
 *
 * const emailQueue = new Queue("email", {
 *   connection: { url: process.env.REDIS_URL! },
 * });
 *
 * export const { GET, POST, PUT, PATCH, DELETE } = workbench({
 *   queues: [emailQueue],
 *   basePath: "/admin/jobs",
 *   auth: {
 *     username: process.env.WORKBENCH_USER!,
 *     password: process.env.WORKBENCH_PASS!,
 *   },
 * });
 * ```
 *
 * `queues` also accepts a `Promise<Queue[]>` for apps that discover their
 * queues asynchronously — pass the promise as-is and requests wait for it:
 *
 * @example
 * ```ts
 * export const { GET, POST, PUT, PATCH, DELETE } = workbench({
 *   queues: loadQueues(), // () => Promise<Queue[]>
 *   basePath: "/admin/jobs",
 * });
 * ```
 */
export function workbench(
  options: NextWorkbenchOptions | Queue[],
): WorkbenchHandlers {
  const fetch = createHandler(options);
  return {
    GET: fetch,
    POST: fetch,
    PUT: fetch,
    PATCH: fetch,
    DELETE: fetch,
  };
}

function createHandler(
  options: NextWorkbenchOptions | Queue[],
): NextRouteHandler {
  // Synchronous queues: build the handler eagerly, exactly as before.
  if (Array.isArray(options) || !isThenable(options.queues)) {
    return createFetchHandler(options as WorkbenchOptions | Queue[]).fetch;
  }

  const handlerPromise = options.queues.then(
    (queues) => createFetchHandler({ ...options, queues }).fetch,
  );
  // Keep a rejected queues promise from becoming an unhandled rejection that
  // can take down the server before any request lands — every request below
  // still surfaces the original error.
  handlerPromise.catch(() => {});

  return async (req) => (await handlerPromise)(req);
}

function isThenable(value: unknown): value is Promise<Queue[]> {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as PromiseLike<unknown>).then === "function"
  );
}

export type { WorkbenchOptions } from "@getworkbench/core";
