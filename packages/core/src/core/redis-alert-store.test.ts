import { describe, expect, test } from "bun:test";
import { EventEmitter } from "node:events";
import type { Redis } from "ioredis";
import { createRedisClient } from "./redis-alert-store";

/**
 * Regression tests for #33: the alert store's Redis client was built by
 * spreading the queue connection into `new Redis({...})`. When the queue
 * connection was a live ioredis instance, that produced a client with
 * default options — dialing localhost:6379 instead of the user's server —
 * and no `error` listener, so every failed retry became an ioredis
 * "Unhandled error event" console flood.
 */

describe("createRedisClient", () => {
  test("duplicates a live ioredis instance instead of spreading it", () => {
    const duplicated = new EventEmitter();
    let duplicateCalls = 0;
    const instance = {
      duplicate() {
        duplicateCalls++;
        return duplicated;
      },
    } as unknown as Redis;

    const client = createRedisClient(instance);
    expect(duplicateCalls).toBe(1);
    expect(client).toBe(duplicated as unknown as Redis);
  });

  test("attaches an error listener so failures are not unhandled", () => {
    const duplicated = new EventEmitter();
    const instance = {
      duplicate: () => duplicated,
    } as unknown as Redis;

    const client = createRedisClient(instance) as unknown as EventEmitter;
    expect(client.listenerCount("error")).toBe(1);
    // An EventEmitter with no 'error' listener throws on emit — this not
    // throwing is the regression guard for the "Unhandled error event" flood.
    expect(() => {
      client.emit("error", new Error("ECONNREFUSED"));
      client.emit("error", new Error("ECONNREFUSED"));
    }).not.toThrow();
  });

  test("warns exactly once on repeated connection errors", () => {
    const duplicated = new EventEmitter();
    const instance = { duplicate: () => duplicated } as unknown as Redis;
    const client = createRedisClient(instance) as unknown as EventEmitter;

    const warnings: string[] = [];
    const originalWarn = console.warn;
    console.warn = (...args: unknown[]) => {
      warnings.push(args.join(" "));
    };
    try {
      for (let i = 0; i < 5; i++) {
        client.emit("error", new Error("connect ECONNREFUSED 127.0.0.1:6379"));
      }
    } finally {
      console.warn = originalWarn;
    }
    expect(warnings.length).toBe(1);
    expect(warnings[0]).toContain("ECONNREFUSED");
  });

  test("honors ioredis options objects (host/port preserved)", () => {
    const client = createRedisClient({
      host: "redis.internal",
      port: 6390,
      lazyConnect: true,
    }) as Redis;
    expect(client.options.host).toBe("redis.internal");
    expect(client.options.port).toBe(6390);
    client.disconnect();
  });

  test("honors url inside an options object", () => {
    const client = createRedisClient({
      url: "redis://redis.internal:6390",
      lazyConnect: true,
    } as never) as Redis;
    expect(client.options.host).toBe("redis.internal");
    expect(client.options.port).toBe(6390);
    client.disconnect();
  });
});
