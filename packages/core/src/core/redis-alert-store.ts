import type { RedisOptions } from "bullmq";
import { type Cluster, Redis } from "ioredis";
import type {
  AlertContactPoint,
  AlertRule,
  AlertStore,
  AlertsOptions,
} from "./types";

export interface RedisAlertStoreOptions {
  /**
   * Anything BullMQ accepts as a queue connection: a URL string, ioredis
   * options (optionally with `url`), or a live `Redis`/`Cluster` instance.
   */
  connection: string | RedisOptions | Redis | Cluster;
  /** BullMQ-style prefix; keys are `${prefix}:workbench:alerts:*` */
  prefix?: string;
  /** Imported once when Redis has no stored config yet */
  seed?: Pick<AlertsOptions, "contactPoints" | "rules">;
}

/** A live ioredis client or cluster (BullMQ also accepts these). */
function isRedisInstance(
  connection: RedisAlertStoreOptions["connection"],
): connection is Redis | Cluster {
  return (
    typeof connection === "object" &&
    connection !== null &&
    typeof (connection as Redis).duplicate === "function"
  );
}

export function createRedisClient(
  connection: RedisAlertStoreOptions["connection"],
): Redis | Cluster {
  const client = buildRedisClient(connection);
  // ioredis emits `error` for every failed connect/retry; with no listener,
  // each becomes an "Unhandled error event" console flood (and on modern
  // Node an unhandled 'error' can crash the process). Alert persistence is
  // non-critical: log the first failure and keep retrying quietly — the
  // client recovers on its own once Redis is reachable.
  let warned = false;
  client.on("error", (err: Error) => {
    if (warned) return;
    warned = true;
    console.warn(
      `[workbench] Alert store Redis connection error (will keep retrying quietly): ${err.message}`,
    );
  });
  return client;
}

function buildRedisClient(
  connection: RedisAlertStoreOptions["connection"],
): Redis | Cluster {
  if (typeof connection === "string") {
    return new Redis(connection, { maxRetriesPerRequest: null });
  }
  // A live client: duplicate it to inherit the exact connection config.
  // Spreading an instance into `new Redis({...})` used to produce a client
  // with default options (localhost:6379) pointing at the wrong server.
  if (isRedisInstance(connection)) {
    return connection.duplicate();
  }
  const { url, ...rest } = connection as RedisOptions & { url?: string };
  if (url) {
    return new Redis(url, { ...rest, maxRetriesPerRequest: null });
  }
  return new Redis({ ...rest, maxRetriesPerRequest: null });
}

/**
 * Persists alert contact points and rules in the user's Redis.
 * Webhook URLs and rules created in the dashboard survive process restarts.
 */
export class RedisAlertStore implements AlertStore {
  private readonly client: Redis | Cluster;
  private readonly contactPointsKey: string;
  private readonly rulesKey: string;
  private readonly seed?: Pick<AlertsOptions, "contactPoints" | "rules">;
  private seeded = false;

  constructor(options: RedisAlertStoreOptions) {
    this.client = createRedisClient(options.connection);
    const prefix = options.prefix ?? "bull";
    this.contactPointsKey = `${prefix}:workbench:alerts:contact-points`;
    this.rulesKey = `${prefix}:workbench:alerts:rules`;
    this.seed = options.seed;
  }

  async close(): Promise<void> {
    await this.client.quit().catch(() => this.client.disconnect());
  }

  private async ensureSeeded(): Promise<void> {
    if (this.seeded) return;
    this.seeded = true;

    const [cpCount, ruleCount] = await Promise.all([
      this.client.hlen(this.contactPointsKey),
      this.client.hlen(this.rulesKey),
    ]);

    if (cpCount > 0 || ruleCount > 0) return;
    if (!this.seed?.contactPoints?.length && !this.seed?.rules?.length) return;

    const pipeline = this.client.pipeline();
    for (const cp of this.seed.contactPoints ?? []) {
      pipeline.hset(this.contactPointsKey, cp.id, JSON.stringify(cp));
    }
    for (const rule of this.seed.rules ?? []) {
      pipeline.hset(this.rulesKey, rule.id, JSON.stringify(rule));
    }
    await pipeline.exec();
  }

  private async readHash<T>(key: string): Promise<T[]> {
    const raw = await this.client.hgetall(key);
    const items: T[] = [];
    for (const value of Object.values(raw)) {
      try {
        items.push(JSON.parse(value) as T);
      } catch {
        // skip corrupt entries
      }
    }
    return items;
  }

  async getContactPoints(): Promise<AlertContactPoint[]> {
    await this.ensureSeeded();
    const items = await this.readHash<AlertContactPoint>(this.contactPointsKey);
    return items.sort((a, b) => a.name.localeCompare(b.name));
  }

  async getContactPoint(id: string): Promise<AlertContactPoint | undefined> {
    await this.ensureSeeded();
    const raw = await this.client.hget(this.contactPointsKey, id);
    if (!raw) return undefined;
    return JSON.parse(raw) as AlertContactPoint;
  }

  async createContactPoint(
    input: Omit<AlertContactPoint, "id" | "createdAt" | "updatedAt">,
  ): Promise<AlertContactPoint> {
    await this.ensureSeeded();
    const now = Date.now();
    const cp: AlertContactPoint = {
      ...input,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    };
    await this.client.hset(this.contactPointsKey, cp.id, JSON.stringify(cp));
    return cp;
  }

  async updateContactPoint(
    id: string,
    input: Partial<Omit<AlertContactPoint, "id" | "createdAt" | "updatedAt">>,
  ): Promise<AlertContactPoint | undefined> {
    await this.ensureSeeded();
    const existing = await this.getContactPoint(id);
    if (!existing) return undefined;
    const updated: AlertContactPoint = {
      ...existing,
      ...input,
      id,
      createdAt: existing.createdAt,
      updatedAt: Date.now(),
    };
    await this.client.hset(this.contactPointsKey, id, JSON.stringify(updated));
    return updated;
  }

  async deleteContactPoint(id: string): Promise<boolean> {
    await this.ensureSeeded();
    const removed = await this.client.hdel(this.contactPointsKey, id);
    return removed > 0;
  }

  async getRules(): Promise<AlertRule[]> {
    await this.ensureSeeded();
    const items = await this.readHash<AlertRule>(this.rulesKey);
    return items.sort((a, b) => a.name.localeCompare(b.name));
  }

  async getRule(id: string): Promise<AlertRule | undefined> {
    await this.ensureSeeded();
    const raw = await this.client.hget(this.rulesKey, id);
    if (!raw) return undefined;
    return JSON.parse(raw) as AlertRule;
  }

  async createRule(
    input: Omit<AlertRule, "id" | "createdAt" | "updatedAt">,
  ): Promise<AlertRule> {
    await this.ensureSeeded();
    const now = Date.now();
    const rule: AlertRule = {
      ...input,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    };
    await this.client.hset(this.rulesKey, rule.id, JSON.stringify(rule));
    return rule;
  }

  async updateRule(
    id: string,
    input: Partial<Omit<AlertRule, "id" | "createdAt" | "updatedAt">>,
  ): Promise<AlertRule | undefined> {
    await this.ensureSeeded();
    const existing = await this.getRule(id);
    if (!existing) return undefined;
    const updated: AlertRule = {
      ...existing,
      ...input,
      id,
      createdAt: existing.createdAt,
      updatedAt: Date.now(),
    };
    await this.client.hset(this.rulesKey, id, JSON.stringify(updated));
    return updated;
  }

  async deleteRule(id: string): Promise<boolean> {
    await this.ensureSeeded();
    const removed = await this.client.hdel(this.rulesKey, id);
    return removed > 0;
  }
}
