import type { RedisOptions } from "bullmq";

/** The subset of process env the standalone server reads for Redis config. */
export interface RedisEnv {
  REDIS_URL?: string;
  REDIS_SENTINELS?: string;
  REDIS_SENTINEL_NAME?: string;
  REDIS_SENTINEL_PASSWORD?: string;
  REDIS_USERNAME?: string;
  REDIS_PASSWORD?: string;
  REDIS_DB?: string;
}

const DEFAULT_SENTINEL_PORT = 26379;

/**
 * Parse `"host:port,host:port"` into ioredis sentinel entries. Entries
 * without a port default to 26379.
 */
export function parseSentinels(
  value: string,
): Array<{ host: string; port: number }> {
  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      const idx = entry.lastIndexOf(":");
      if (idx === -1) {
        return { host: entry, port: DEFAULT_SENTINEL_PORT };
      }
      const host = entry.slice(0, idx);
      const port = Number(entry.slice(idx + 1));
      if (!host || !Number.isInteger(port) || port <= 0 || port > 65535) {
        throw new Error(
          `Invalid REDIS_SENTINELS entry "${entry}" — expected host or host:port`,
        );
      }
      return { host, port };
    });
}

/**
 * Build the BullMQ connection from environment variables.
 *
 * Two modes:
 * - `REDIS_URL` — single-instance connection URL (existing behavior).
 * - `REDIS_SENTINELS` + `REDIS_SENTINEL_NAME` — Redis Sentinel; ioredis
 *   resolves the current master through the listed sentinels and follows
 *   failovers automatically.
 */
export function connectionFromEnv(env: RedisEnv): RedisOptions {
  const shared: RedisOptions = {
    ...(env.REDIS_USERNAME && { username: env.REDIS_USERNAME }),
    ...(env.REDIS_PASSWORD && { password: env.REDIS_PASSWORD }),
    ...(env.REDIS_DB && { db: Number(env.REDIS_DB) }),
  };

  if (env.REDIS_SENTINELS) {
    if (!env.REDIS_SENTINEL_NAME) {
      throw new Error(
        "REDIS_SENTINEL_NAME is required when REDIS_SENTINELS is set (the sentinel master group name, e.g. mymaster)",
      );
    }
    return {
      sentinels: parseSentinels(env.REDIS_SENTINELS),
      name: env.REDIS_SENTINEL_NAME,
      ...(env.REDIS_SENTINEL_PASSWORD && {
        sentinelPassword: env.REDIS_SENTINEL_PASSWORD,
      }),
      ...shared,
    };
  }

  if (!env.REDIS_URL) {
    throw new Error(
      "Set REDIS_URL (single instance) or REDIS_SENTINELS + REDIS_SENTINEL_NAME (Sentinel)",
    );
  }
  // `url` rides along inside RedisOptions; BullMQ passes it through to ioredis.
  return { url: env.REDIS_URL, ...shared } as RedisOptions;
}
