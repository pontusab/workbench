import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "@tanstack/react-router";
import { TooltipProvider } from "./components/ui/tooltip";
import { createAppRouter } from "./router";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 5,
      refetchOnWindowFocus: true,
      retry: 1,
    },
  },
});

// Get base path from the <base> tag or default to "/"
function getBasePath() {
  if (typeof document !== "undefined") {
    const base = document.querySelector("base");
    if (base?.href) {
      const url = new URL(base.href);
      return url.pathname.replace(/\/$/, "") || "/";
    }
  }
  return "/";
}

// Created lazily on first render: TanStack's createRouter touches
// window.history, so building it at module scope would crash any non-browser
// import of the embeddable `@getworkbench/core/ui` entry (SSR frameworks
// evaluate the module on the server before rendering client-side).
let router: ReturnType<typeof createAppRouter> | undefined;
function getRouter() {
  router ??= createAppRouter(getBasePath());
  return router;
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider delayDuration={0}>
        <RouterProvider router={getRouter()} />
      </TooltipProvider>
    </QueryClientProvider>
  );
}
