import type {
  CreateFlowRequest,
  JobStatus,
  SortOptions,
  TestJobRequest,
} from "../core/types";
import type { WorkbenchCore } from "../core/workbench";

/**
 * Framework-agnostic HTTP method.
 */
export type HttpMethod = "get" | "post" | "put" | "patch" | "delete";

/**
 * Normalized input passed to every handler. Adapters are responsible for
 * mapping their framework-specific request shape to this.
 */
export interface HandlerInput {
  params: Record<string, string>;
  query: Record<string, string | undefined>;
  body?: unknown;
}

/**
 * Normalized output returned by every handler. Adapters serialize this
 * onto their framework-specific response object.
 */
export interface HandlerResult {
  status: number;
  body: unknown;
}

/**
 * A framework-agnostic route handler. Closes over a `WorkbenchCore` and
 * takes a normalized request envelope.
 */
export type Handler = (input: HandlerInput) => Promise<HandlerResult>;

/**
 * A framework-agnostic route definition.
 *
 * `path` uses `:param` syntax compatible with Hono, Express, and Fastify.
 * Paths are relative to `/api` — adapters mount them under that prefix.
 */
export interface RouteDef {
  method: HttpMethod;
  path: string;
  handler: Handler;
}

/**
 * Parse sort query param in format "field:direction" (e.g., "timestamp:desc")
 * Defaults to desc if direction not specified.
 */
function parseSort(sort?: string): SortOptions | undefined {
  if (!sort) return undefined;
  const [field, dir] = sort.split(":");
  if (!field) return undefined;
  return {
    field,
    direction: dir === "asc" ? "asc" : "desc",
  };
}

const readonlyError = {
  status: 403 as const,
  body: { error: "Dashboard is in readonly mode" },
};

/**
 * Build the framework-agnostic route table for the Workbench API.
 *
 * Adapters iterate this list and register each route on their host framework.
 * Paths are relative to `/api`.
 */
export function buildRouteTable(core: WorkbenchCore): RouteDef[] {
  const qm = core.queueManager;
  const isReadonly = () => !!core.options.readonly;

  return [
    {
      method: "post",
      path: "/refresh",
      handler: async () => {
        qm.clearCache();
        return { status: 200, body: { success: true } };
      },
    },

    {
      method: "get",
      path: "/overview",
      handler: async () => ({
        status: 200,
        body: await qm.getOverview(),
      }),
    },

    {
      method: "get",
      path: "/counts",
      handler: async () => ({
        status: 200,
        body: await qm.getQuickCounts(),
      }),
    },

    {
      method: "get",
      path: "/runs",
      handler: async ({ query }) => {
        const limit = Number(query.limit) || 50;
        const cursor = query.cursor;
        const start = cursor ? Number(cursor) : 0;
        const sort = parseSort(query.sort);

        const status = query.status as JobStatus | undefined;
        const q = query.q;
        const from = query.from;
        const to = query.to;
        const tagsParam = query.tags;

        let tags: Record<string, string> | undefined;
        if (tagsParam) {
          try {
            tags = JSON.parse(tagsParam);
          } catch {
            const tagPairs = tagsParam.split(",");
            tags = {};
            for (const pair of tagPairs) {
              const [key, value] = pair.split(":");
              if (key && value) {
                tags[key.trim()] = value.trim();
              }
            }
          }
        }

        let timeRange: { start: number; end: number } | undefined;
        if (from && to) {
          timeRange = {
            start: Number(from),
            end: Number(to),
          };
        }

        let text: string | undefined;
        if (q) {
          if (!q.includes(":")) {
            text = q;
          } else {
            const parts = q.split(" ");
            const textParts = parts.filter((p) => !p.includes(":"));
            if (textParts.length > 0) {
              text = textParts.join(" ");
            }
          }
        }

        const filters =
          status || tags || text || timeRange
            ? {
                status,
                tags,
                text,
                timeRange,
              }
            : undefined;

        return {
          status: 200,
          body: await qm.getAllRuns(limit, start, sort, filters),
        };
      },
    },

    {
      method: "get",
      path: "/schedulers",
      handler: async ({ query }) => {
        const repeatableSort = parseSort(query.repeatableSort);
        const delayedSort = parseSort(query.delayedSort);
        return {
          status: 200,
          body: await qm.getSchedulers(repeatableSort, delayedSort),
        };
      },
    },

    {
      method: "post",
      path: "/test",
      handler: async ({ body }) => {
        if (isReadonly()) return readonlyError;
        const req = body as TestJobRequest | undefined;

        if (!req?.queueName || !req.jobName) {
          return {
            status: 400,
            body: { error: "queueName and jobName are required" },
          };
        }

        try {
          const result = await qm.enqueueJob(req);
          return { status: 200, body: result };
        } catch (e) {
          return { status: 400, body: { error: (e as Error).message } };
        }
      },
    },

    {
      method: "get",
      path: "/queue-names",
      handler: async () => ({
        status: 200,
        body: qm.getQueueNames(),
      }),
    },

    {
      method: "get",
      path: "/queues",
      handler: async () => ({
        status: 200,
        body: await qm.getQueues(),
      }),
    },

    {
      method: "get",
      path: "/metrics",
      handler: async () => ({
        status: 200,
        body: await qm.getMetrics(),
      }),
    },

    {
      method: "get",
      path: "/activity",
      handler: async () => ({
        status: 200,
        body: await qm.getActivityStats(),
      }),
    },

    {
      method: "get",
      path: "/queues/:name/jobs",
      handler: async ({ params, query }) => {
        const name = params.name!;
        const status = query.status as JobStatus | undefined;
        const limit = Number(query.limit) || 50;
        const cursor = query.cursor;
        const start = cursor ? Number(cursor) : 0;
        const sort = parseSort(query.sort);

        return {
          status: 200,
          body: await qm.getJobs(name, status, limit, start, sort),
        };
      },
    },

    {
      method: "get",
      path: "/jobs/:queue/:id",
      handler: async ({ params }) => {
        const job = await qm.getJob(params.queue!, params.id!);
        if (!job) {
          return { status: 404, body: { error: "Job not found" } };
        }
        return { status: 200, body: job };
      },
    },

    {
      method: "post",
      path: "/jobs/:queue/:id/retry",
      handler: async ({ params }) => {
        if (isReadonly()) return readonlyError;
        const success = await qm.retryJob(params.queue!, params.id!);
        if (!success) {
          return { status: 400, body: { error: "Failed to retry job" } };
        }
        return { status: 200, body: { success: true } };
      },
    },

    {
      method: "post",
      path: "/jobs/:queue/:id/remove",
      handler: async ({ params }) => {
        if (isReadonly()) return readonlyError;
        const success = await qm.removeJob(params.queue!, params.id!);
        if (!success) {
          return { status: 400, body: { error: "Failed to remove job" } };
        }
        return { status: 200, body: { success: true } };
      },
    },

    {
      method: "post",
      path: "/jobs/:queue/:id/promote",
      handler: async ({ params }) => {
        if (isReadonly()) return readonlyError;
        const success = await qm.promoteJob(params.queue!, params.id!);
        if (!success) {
          return { status: 400, body: { error: "Failed to promote job" } };
        }
        return { status: 200, body: { success: true } };
      },
    },

    {
      method: "post",
      path: "/schedulers/:queue/:key/run",
      handler: async ({ params }) => {
        if (isReadonly()) return readonlyError;
        const result = await qm.runSchedulerNow(params.queue!, params.key!);
        if (!result) {
          return { status: 400, body: { error: "Failed to run scheduler" } };
        }
        return { status: 200, body: result };
      },
    },

    {
      method: "get",
      path: "/search",
      handler: async ({ query }) => {
        const q = query.q || "";
        const limit = Number(query.limit) || 20;
        if (!q) return { status: 200, body: { results: [] } };
        const results = await qm.search(q, limit);
        return { status: 200, body: { results } };
      },
    },

    {
      method: "get",
      path: "/tags/:field/values",
      handler: async ({ params, query }) => {
        const field = params.field!;
        const limit = Number(query.limit) || 50;

        const tagFields = qm.getTagFields();
        if (tagFields.length > 0 && !tagFields.includes(field)) {
          return {
            status: 400,
            body: {
              error: `Field "${field}" is not a configured tag field`,
            },
          };
        }

        const values = await qm.getTagValues(field, limit);
        return { status: 200, body: { field, values } };
      },
    },

    {
      method: "post",
      path: "/queues/:name/clean",
      handler: async ({ params, body }) => {
        if (isReadonly()) return readonlyError;
        const req = body as
          | { status: "completed" | "failed"; grace?: number }
          | undefined;
        if (!req) {
          return { status: 400, body: { error: "Body required" } };
        }
        const count = await qm.cleanJobs(
          params.name!,
          req.status,
          req.grace || 0,
        );
        return { status: 200, body: { removed: count } };
      },
    },

    {
      method: "post",
      path: "/bulk/retry",
      handler: async ({ body }) => {
        if (isReadonly()) return readonlyError;
        const req = body as
          | { jobs: { queueName: string; jobId: string }[] }
          | undefined;
        if (!req?.jobs) {
          return { status: 400, body: { error: "jobs is required" } };
        }
        return { status: 200, body: await qm.bulkRetry(req.jobs) };
      },
    },

    {
      method: "post",
      path: "/bulk/delete",
      handler: async ({ body }) => {
        if (isReadonly()) return readonlyError;
        const req = body as
          | { jobs: { queueName: string; jobId: string }[] }
          | undefined;
        if (!req?.jobs) {
          return { status: 400, body: { error: "jobs is required" } };
        }
        return { status: 200, body: await qm.bulkDelete(req.jobs) };
      },
    },

    {
      method: "post",
      path: "/bulk/promote",
      handler: async ({ body }) => {
        if (isReadonly()) return readonlyError;
        const req = body as
          | { jobs: { queueName: string; jobId: string }[] }
          | undefined;
        if (!req?.jobs) {
          return { status: 400, body: { error: "jobs is required" } };
        }
        return { status: 200, body: await qm.bulkPromote(req.jobs) };
      },
    },

    {
      method: "post",
      path: "/queues/:name/pause",
      handler: async ({ params }) => {
        if (isReadonly()) return readonlyError;
        try {
          await qm.pauseQueue(params.name!);
          return { status: 200, body: { success: true, paused: true } };
        } catch (error) {
          return {
            status: 404,
            body: {
              error:
                error instanceof Error
                  ? error.message
                  : "Failed to pause queue",
            },
          };
        }
      },
    },

    {
      method: "post",
      path: "/queues/:name/resume",
      handler: async ({ params }) => {
        if (isReadonly()) return readonlyError;
        try {
          await qm.resumeQueue(params.name!);
          return { status: 200, body: { success: true, paused: false } };
        } catch (error) {
          return {
            status: 404,
            body: {
              error:
                error instanceof Error
                  ? error.message
                  : "Failed to resume queue",
            },
          };
        }
      },
    },

    {
      method: "get",
      path: "/flows",
      handler: async ({ query }) => {
        const limit = Number(query.limit) || 50;
        const flows = await qm.getFlows(limit);
        return { status: 200, body: { flows } };
      },
    },

    {
      method: "get",
      path: "/flows/:queueName/:jobId",
      handler: async ({ params }) => {
        const flow = await qm.getFlow(params.queueName!, params.jobId!);
        if (!flow) {
          return { status: 404, body: { error: "Flow not found" } };
        }
        return { status: 200, body: flow };
      },
    },

    {
      method: "post",
      path: "/flows",
      handler: async ({ body }) => {
        if (isReadonly()) return readonlyError;
        const req = body as CreateFlowRequest | undefined;

        if (!req?.name || !req.queueName || !req.children?.length) {
          return {
            status: 400,
            body: { error: "name, queueName, and children are required" },
          };
        }

        try {
          const result = await qm.createFlow(req);
          return { status: 200, body: result };
        } catch (e) {
          return { status: 400, body: { error: (e as Error).message } };
        }
      },
    },
  ];
}
