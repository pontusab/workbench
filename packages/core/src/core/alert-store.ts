import {
  RedisAlertStore,
  type RedisAlertStoreOptions,
} from "./redis-alert-store";
import type {
  AlertContactPoint,
  AlertContactPointPublic,
  AlertPersistence,
  AlertRule,
  AlertStore,
  AlertsOptions,
} from "./types";

function maskUrl(url: string): string {
  try {
    const parsed = new URL(url);
    const segments = parsed.pathname.split("/").filter(Boolean);
    const secret = segments[segments.length - 1] ?? "";
    const tail = secret.length >= 4 ? secret.slice(-4) : "****";
    return `${parsed.hostname}/…${tail}`;
  } catch {
    return "••••••••";
  }
}

export function toPublicContactPoint(
  cp: AlertContactPoint,
): AlertContactPointPublic {
  const { url, ...rest } = cp;
  return { ...rest, urlMasked: maskUrl(url) };
}

/**
 * Use {@link createAlertStore} — defaults to Redis when a connection is available.
 */
export type { AlertPersistence, AlertStore } from "./types";

export interface CreateAlertStoreContext {
  /** Workbench-level Redis connection (auto-discovery) */
  redis?: string | import("bullmq").RedisOptions;
  /** Connection from the first mounted BullMQ queue (BullMQ `ConnectionOptions`) */
  queueConnection?: unknown;
  /** Key prefix for Redis storage; defaults to Workbench `prefix` or `"bull"` */
  prefix?: string;
}

/**
 * Resolve the alert config store. Redis is the default when a connection exists.
 * Code-defined `contactPoints` / `rules` seed Redis on first run only.
 */
export function createAlertStore(
  alerts: AlertsOptions,
  ctx: CreateAlertStoreContext,
): { store: AlertStore; persistence: AlertPersistence } {
  if (alerts.store) {
    return { store: alerts.store, persistence: "custom" };
  }

  if (alerts.persistence === "memory") {
    return {
      store: new MemoryAlertStore({
        contactPoints: alerts.contactPoints,
        rules: alerts.rules,
      }),
      persistence: "memory",
    };
  }

  const connection = (ctx.queueConnection ?? ctx.redis) as
    | RedisAlertStoreOptions["connection"]
    | undefined;
  if (connection) {
    return {
      store: new RedisAlertStore({
        connection,
        prefix: alerts.storagePrefix ?? ctx.prefix ?? "bull",
        seed: {
          contactPoints: alerts.contactPoints,
          rules: alerts.rules,
        },
      }),
      persistence: "redis",
    };
  }

  return {
    store: new MemoryAlertStore({
      contactPoints: alerts.contactPoints,
      rules: alerts.rules,
    }),
    persistence: "memory",
  };
}

export class MemoryAlertStore implements AlertStore {
  private contactPoints = new Map<string, AlertContactPoint>();
  private rules = new Map<string, AlertRule>();

  constructor(seed?: Pick<AlertsOptions, "contactPoints" | "rules">) {
    for (const cp of seed?.contactPoints ?? []) {
      this.contactPoints.set(cp.id, { ...cp });
    }
    for (const rule of seed?.rules ?? []) {
      this.rules.set(rule.id, { ...rule });
    }
  }

  async getContactPoints(): Promise<AlertContactPoint[]> {
    return Array.from(this.contactPoints.values()).sort((a, b) =>
      a.name.localeCompare(b.name),
    );
  }

  async getContactPoint(id: string): Promise<AlertContactPoint | undefined> {
    return this.contactPoints.get(id);
  }

  async createContactPoint(
    input: Omit<AlertContactPoint, "id" | "createdAt" | "updatedAt">,
  ): Promise<AlertContactPoint> {
    const now = Date.now();
    const cp: AlertContactPoint = {
      ...input,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    };
    this.contactPoints.set(cp.id, cp);
    return cp;
  }

  async updateContactPoint(
    id: string,
    input: Partial<Omit<AlertContactPoint, "id" | "createdAt" | "updatedAt">>,
  ): Promise<AlertContactPoint | undefined> {
    const existing = this.contactPoints.get(id);
    if (!existing) return undefined;
    const updated: AlertContactPoint = {
      ...existing,
      ...input,
      id,
      createdAt: existing.createdAt,
      updatedAt: Date.now(),
    };
    this.contactPoints.set(id, updated);
    return updated;
  }

  async deleteContactPoint(id: string): Promise<boolean> {
    return this.contactPoints.delete(id);
  }

  async getRules(): Promise<AlertRule[]> {
    return Array.from(this.rules.values()).sort((a, b) =>
      a.name.localeCompare(b.name),
    );
  }

  async getRule(id: string): Promise<AlertRule | undefined> {
    return this.rules.get(id);
  }

  async createRule(
    input: Omit<AlertRule, "id" | "createdAt" | "updatedAt">,
  ): Promise<AlertRule> {
    const now = Date.now();
    const rule: AlertRule = {
      ...input,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    };
    this.rules.set(rule.id, rule);
    return rule;
  }

  async updateRule(
    id: string,
    input: Partial<Omit<AlertRule, "id" | "createdAt" | "updatedAt">>,
  ): Promise<AlertRule | undefined> {
    const existing = this.rules.get(id);
    if (!existing) return undefined;
    const updated: AlertRule = {
      ...existing,
      ...input,
      id,
      createdAt: existing.createdAt,
      updatedAt: Date.now(),
    };
    this.rules.set(id, updated);
    return updated;
  }

  async deleteRule(id: string): Promise<boolean> {
    return this.rules.delete(id);
  }
}
