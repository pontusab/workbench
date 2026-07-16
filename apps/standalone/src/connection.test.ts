import { describe, expect, test } from "bun:test";
import { connectionFromEnv, parseSentinels } from "./connection";

describe("parseSentinels", () => {
  test("parses host:port pairs", () => {
    expect(parseSentinels("10.0.0.1:26379, 10.0.0.2:26380")).toEqual([
      { host: "10.0.0.1", port: 26379 },
      { host: "10.0.0.2", port: 26380 },
    ]);
  });

  test("defaults the port to 26379", () => {
    expect(parseSentinels("sentinel-a,sentinel-b:5000")).toEqual([
      { host: "sentinel-a", port: 26379 },
      { host: "sentinel-b", port: 5000 },
    ]);
  });

  test("rejects malformed entries", () => {
    expect(() => parseSentinels("host:notaport")).toThrow(
      /Invalid REDIS_SENTINELS entry/,
    );
    expect(() => parseSentinels(":26379")).toThrow(
      /Invalid REDIS_SENTINELS entry/,
    );
  });
});

describe("connectionFromEnv", () => {
  test("uses REDIS_URL when no sentinels are set", () => {
    expect(connectionFromEnv({ REDIS_URL: "redis://localhost:6379" })).toEqual(
      { url: "redis://localhost:6379" },
    );
  });

  test("builds a sentinel connection", () => {
    expect(
      connectionFromEnv({
        REDIS_SENTINELS: "s1:26379,s2:26379",
        REDIS_SENTINEL_NAME: "mymaster",
        REDIS_SENTINEL_PASSWORD: "sentinel-secret",
        REDIS_PASSWORD: "redis-secret",
        REDIS_DB: "2",
      }),
    ).toEqual({
      sentinels: [
        { host: "s1", port: 26379 },
        { host: "s2", port: 26379 },
      ],
      name: "mymaster",
      sentinelPassword: "sentinel-secret",
      password: "redis-secret",
      db: 2,
    });
  });

  test("sentinels take precedence over REDIS_URL", () => {
    const conn = connectionFromEnv({
      REDIS_URL: "redis://ignored:6379",
      REDIS_SENTINELS: "s1",
      REDIS_SENTINEL_NAME: "mymaster",
    });
    expect(conn).not.toHaveProperty("url");
    expect(conn.name).toBe("mymaster");
  });

  test("requires REDIS_SENTINEL_NAME with REDIS_SENTINELS", () => {
    expect(() => connectionFromEnv({ REDIS_SENTINELS: "s1:26379" })).toThrow(
      /REDIS_SENTINEL_NAME is required/,
    );
  });

  test("requires at least one connection mode", () => {
    expect(() => connectionFromEnv({})).toThrow(/Set REDIS_URL/);
  });

  test("applies auth to url connections too", () => {
    expect(
      connectionFromEnv({
        REDIS_URL: "redis://localhost:6379",
        REDIS_USERNAME: "app",
        REDIS_PASSWORD: "pw",
      }),
    ).toEqual({ url: "redis://localhost:6379", username: "app", password: "pw" });
  });
});
