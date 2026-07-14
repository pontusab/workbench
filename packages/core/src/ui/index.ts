/**
 * `@getworkbench/core/ui` — React entrypoint for embedding the Workbench
 * dashboard inside a host Vite/React app (e.g. the Tauri desktop client).
 *
 * Consumers import the `Dashboard` component, render it inside their own
 * provider tree, and optionally point it at a non-relative API base via
 * `setApiBase()` or the global `window.__WORKBENCH_RUNTIME__.apiBase`.
 *
 * The bundled `dist/ui/` build (used by adapters that serve UI from the
 * server) does **not** consume this entrypoint — it goes through
 * `src/ui/main.tsx`.
 */
// Side-effect import so the library build emits the compiled stylesheet
// (`dist/ui-lib/styles.css`, exported as `@getworkbench/core/ui/styles.css`).
// Vite extracts it — the built JS carries no CSS import.
import "./styles/globals.css";

import { createAppRouter as createAppRouterImpl } from "./router";

export { App as Dashboard } from "./app";
export { apiBase, getConfigUrl, joinApi, setApiBase } from "./lib/api-base";

/**
 * Create the dashboard's TanStack Router instance (advanced embeddings).
 *
 * Deliberately typed as `unknown`: `@tanstack/react-router` is bundled into
 * this entry rather than declared as a peer dependency, so the published
 * type declarations must not reference it. Cast the result to your own
 * `Router` type if you need to interact with it.
 */
export const createAppRouter: (basePath: string) => unknown =
  createAppRouterImpl;
