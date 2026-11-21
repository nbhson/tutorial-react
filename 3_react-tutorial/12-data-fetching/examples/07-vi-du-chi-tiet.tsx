import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Tạo 1 lần ở module — tạo mỗi render là mất cache liên tục
const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, retry: 2, refetchOnWindowFocus: true } },
});
// JSX: <QueryClientProvider client={queryClient}><App /></QueryClientProvider>
