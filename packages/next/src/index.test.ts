import { describe, expect, test } from "bun:test";
import type { Queue } from "bullmq";
import { workbench } from "./index";

// A queue stub is enough here: `/config` only reads queue names from the
// QueueManager map and never touches Redis.
function fakeQueue(name: string): Queue {
  return { name, opts: {} } as unknown as Queue;
}

const CONFIG_URL = "http://localhost/admin/jobs/config";

describe("workbench (Next.js adapter)", () => {
  test("accepts queues synchronously", async () => {
    const { GET } = workbench({
      queues: [fakeQueue("emails")],
      basePath: "/admin/jobs",
      alerts: { enabled: false },
    });

    const res = await GET(new Request(CONFIG_URL));
    expect(res.status).toBe(200);
    const config = (await res.json()) as { queues: string[] };
    expect(config.queues).toEqual(["emails"]);
  });

  test("accepts queues as a promise", async () => {
    const { GET } = workbench({
      queues: Promise.resolve([fakeQueue("emails"), fakeQueue("webhooks")]),
      basePath: "/admin/jobs",
      alerts: { enabled: false },
    });

    const res = await GET(new Request(CONFIG_URL));
    expect(res.status).toBe(200);
    const config = (await res.json()) as { queues: string[] };
    expect(config.queues).toEqual(["emails", "webhooks"]);
  });

  test("resolves the queues promise once and reuses the handler", async () => {
    let resolveCount = 0;
    const queues = Promise.resolve().then(() => {
      resolveCount++;
      return [fakeQueue("emails")];
    });

    const { GET, POST } = workbench({
      queues,
      basePath: "/admin/jobs",
      alerts: { enabled: false },
    });

    const [a, b] = await Promise.all([
      GET(new Request(CONFIG_URL)),
      POST(new Request(CONFIG_URL, { method: "POST" })),
    ]);
    expect(a.status).toBe(200);
    expect(b.status).toBe(404); // POST /config is not a route, but it routed
    expect(resolveCount).toBe(1);
  });

  test("surfaces a rejected queues promise on each request", async () => {
    const { GET } = workbench({
      queues: Promise.reject(new Error("redis unavailable")),
      basePath: "/admin/jobs",
      alerts: { enabled: false },
    });

    expect(GET(new Request(CONFIG_URL))).rejects.toThrow("redis unavailable");
    expect(GET(new Request(CONFIG_URL))).rejects.toThrow("redis unavailable");
  });
});
