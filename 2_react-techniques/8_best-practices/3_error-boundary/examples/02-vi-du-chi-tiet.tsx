// Query — không retry lỗi 4xx, chỉ retry lỗi mạng/5xx vài lần
import { QueryClient } from '@tanstack/react-query';

function isClientError(err: unknown): boolean {
  // Lỗi fetch/axios chứa status; 4xx là lỗi từ phía client, retry vô ích
  const status = (err as { status?: number })?.status;
  return typeof status === 'number' && status >= 400 && status < 500;
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) =>
        failureCount < 2 && !isClientError(error), // 401/403/404 → dừng ngay
      staleTime: 30_000,
    },
  },
});
