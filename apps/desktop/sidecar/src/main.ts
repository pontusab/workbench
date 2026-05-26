/**
 * Workbench desktop sidecar.
 *
 * A Bun-compiled binary that the Tauri shell spawns with a `REDIS_URL` env
 * var. Secrets (the Redis password) are passed via a single JSON line on
 * stdin, NOT env vars — env vars leak to anything running `ps` as the
 * same user. The first line on stdout is always a JSON event (`ready` or
 * `error`) so the Rust side can parse the outcome with a short timeout.
 *
 * Stdin handshake (Rust side writes this immediately after spawn):
 *   {"password":"..."}\n        — with password
 *   {}\n                          — no password
 *   (EOF before any input)        — treated identically to `{}`, so running
 *                                   the binary manually (e.g. CI smoke test)
 *                                   still proceeds to the missing-URL check.
 *
 * Lifecycle:
 *   - SIGTERM / SIGINT → graceful shutdown
 *   - Uncaught exception → emit `error` then exit non-zero
 *
 * Everything else (the actual job dashboard logic) lives in `@getworkbench/core`.
 */

import { WorkbenchCore } from "@getworkbench/core";
import { buildWorkbenchApiApp } from "@getworkbench/core/hono";

interface ReadyEvent {
  event: "ready";
  port: number;
  queues: number;
  discoveryTotal: number | null;
  discoveryCapped: boolean;
}

interface ErrorEvent {
  event: "error";
  code: ErrorCode;
  message: string;
}

type ErrorCode =
  | "REDIS_AUTH"
  | "REDIS_REFUSED"
  | "REDIS_DNS"
  | "REDIS_TLS"
  | "REDIS_TIMEOUT"
  | "MISSING_REDIS_URL"
  | "UNKNOWN";

function emit(event: ReadyEvent | ErrorEvent): void {
  // One JSON object per line so the Rust side can read with BufReader::lines()
  process.stdout.write(`${JSON.stringify(event)}\n`);
}

function classify(e: unknown): ErrorCode {
  const msg = ((e as { message?: string })?.message ?? String(e)).toLowerCase();
  if (
    msg.includes("noauth") ||
    msg.includes("wrongpass") ||
    msg.includes("invalid password")
  )
    return "REDIS_AUTH";
  if (msg.includes("econnrefused")) return "REDIS_REFUSED";
  if (msg.includes("enotfound") || msg.includes("eai_again"))
    return "REDIS_DNS";
  if (msg.includes("tls") || msg.includes("ssl")) return "REDIS_TLS";
  if (msg.includes("etimedout") || msg.includes("connect etimedout"))
    return "REDIS_TIMEOUT";
  return "UNKNOWN";
}

interface StdinHandshake {
  password?: string;
}

/**
 * Read a single newline-terminated JSON object from stdin with a short
 * timeout. Returns an empty object when stdin closes before any data is
 * received — that's the path taken by manual invocations (CI smoke test,
 * `./workbench-sidecar < /dev/null`) and we treat it as "no password".
 */
async function readHandshake(timeoutMs = 1000): Promise<StdinHandshake> {
  return new Promise((resolveHandshake) => {
    let buffer = "";
    let settled = false;

    const finish = (value: StdinHandshake): void => {
      if (settled) return;
      settled = true;
      process.stdin.removeAllListeners("data");
      process.stdin.removeAllListeners("end");
      process.stdin.removeAllListeners("error");
      clearTimeout(timer);
      resolveHandshake(value);
    };

    const timer = setTimeout(() => finish({}), timeoutMs);

    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (chunk: string) => {
      buffer += chunk;
      const nl = buffer.indexOf("\n");
      if (nl === -1) return;
      const line = buffer.slice(0, nl).trim();
      if (line.length === 0) {
        finish({});
        return;
      }
      try {
        finish(JSON.parse(line) as StdinHandshake);
      } catch {
        finish({});
      }
    });
    process.stdin.on("end", () => finish({}));
    process.stdin.on("error", () => finish({}));
  });
}

async function main(): Promise<void> {
  const handshake = await readHandshake();

  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) {
    emit({
      event: "error",
      code: "MISSING_REDIS_URL",
      message: "REDIS_URL environment variable is required",
    });
    process.exit(2);
  }

  const prefix = process.env.WORKBENCH_PREFIX || "bull";
  const maxQueues = Number.parseInt(
    process.env.WORKBENCH_MAX_QUEUES ?? "100",
    10,
  );
  const username = process.env.REDIS_USERNAME;
  const password = handshake.password;

  // Build the core (this is where most failures surface: bad URL, refused
  // connection, auth, TLS). We deliberately let any throw propagate up to
  // the top-level catch so all error paths go through the same `emit("error")`.
  const core = await WorkbenchCore.fromOptions({
    redis: buildConnectionOptions(redisUrl, username, password),
    prefix,
    maxQueues,
    title: "Workbench",
  });

  const app = buildWorkbenchApiApp(core);

  // Bun.serve binds 127.0.0.1 explicitly — never expose to the network.
  const server = Bun.serve({
    hostname: "127.0.0.1",
    port: 0,
    fetch: app.fetch,
  });

  // `server.port` is typed as `number | undefined` because Bun supports unix
  // sockets too. We always bind a TCP port here, so it's safe to coerce.
  const port = server.port ?? 0;
  if (!port) {
    throw new Error("Bun.serve did not return a TCP port");
  }

  emit({
    event: "ready",
    port,
    queues: core.queueManager.getQueueNames().length,
    discoveryTotal: core.discovery?.total ?? null,
    discoveryCapped: core.discovery?.capped ?? false,
  });

  const stop = (): void => {
    try {
      server.stop(true);
    } finally {
      process.exit(0);
    }
  };

  process.on("SIGTERM", stop);
  process.on("SIGINT", stop);
}

function buildConnectionOptions(
  url: string,
  username: string | undefined,
  password: string | undefined,
): { url: string; username?: string; password?: string } {
  const conn: { url: string; username?: string; password?: string } = { url };
  if (username) conn.username = username;
  if (password) conn.password = password;
  return conn;
}

main().catch((e: unknown) => {
  emit({
    event: "error",
    code: classify(e),
    message: (e as { message?: string })?.message ?? String(e),
  });
  process.exit(1);
});
