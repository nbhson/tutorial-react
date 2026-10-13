// QueryClient dùng chung (DAY 12 TanStack Query v5).
// - staleTime 30s: remount trong 30s không refetch, ngoài thì refetch nền.
// - retry 2, refetchOnWindowFocus giữ mặc định (focus lại tab stale -> refetch nền).

import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      retry: 2,
      refetchOnWindowFocus: true,
    },
  },
});

export const postsKeys = {
  all: ["posts"] as const,
  list: (limit: number) => ["posts", "list", limit] as const,
  detail: (id: number) => ["posts", "detail", id] as const,
};
