/**
 * Runtime-configurable API base URL for the dashboard.
 *
 * Three modes:
 *
 * - Default (adapter consumers): derive a clean absolute URL from the
 *   `<base href>` injected by the host server. This keeps requests mounted at
 *   the same dashboard path without resolving relative fetches against a
 *   credentialed document URL.
 * - Host-injected (Tauri desktop): the host page sets
 *   `window.__WORKBENCH_RUNTIME__ = { apiBase: "http://127.0.0.1:54321" }`
 *   before the React tree mounts. Reading the global at request time means
 *   the host can swap connections (sidecar restart) without remounting.
 * - Programmatic: `setApiBase(url)` for tests and unusual embeddings.
 */

declare global {
  interface Window {
    __WORKBENCH_RUNTIME__?: {
      apiBase?: string;
    };
  }
}

let overrideBase: string | null = null;

/**
 * Programmatically set the API base URL. Pass `null` to fall back to the
 * `window.__WORKBENCH_RUNTIME__.apiBase` / relative default.
 */
export function setApiBase(base: string | null): void {
  overrideBase = base ? stripTrailingSlash(base) : null;
}

/**
 * Resolve the current API base. Returns either an absolute URL with no
 * trailing slash (e.g. `http://127.0.0.1:54321`) or an empty string,
 * which signals "use relative `./api/*` paths".
 */
export function apiBase(): string {
  if (overrideBase !== null) return overrideBase;
  if (typeof window !== "undefined" && window.__WORKBENCH_RUNTIME__?.apiBase) {
    return stripTrailingSlash(window.__WORKBENCH_RUNTIME__.apiBase);
  }
  return defaultApiBase();
}

/**
 * Build a fully-qualified URL for an API path like `/queues` or `queues`.
 * Falls back to `./api/<path>` for the relative-default case so the existing
 * `<base href>` mount-path logic keeps working.
 */
export function joinApi(path: string): string {
  const clean = path.replace(/^\/+/, "");
  const base = apiBase();
  if (!base) return `./api/${clean}`;
  return `${base}/api/${clean}`;
}

/**
 * Build the URL for `/config` (sibling of `/api/*`, served by the same host).
 */
export function getConfigUrl(): string {
  const base = apiBase();
  if (!base) return "./config";
  return `${base}/config`;
}

function stripTrailingSlash(s: string): string {
  return s.endsWith("/") ? s.slice(0, -1) : s;
}

function defaultApiBase(): string {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return "";
  }

  const href = document.querySelector("base")?.getAttribute("href");
  if (!href) return "";

  try {
    const url = new URL(href, window.location.origin);
    url.username = "";
    url.password = "";
    return stripTrailingSlash(url.toString());
  } catch {
    return "";
  }
}
