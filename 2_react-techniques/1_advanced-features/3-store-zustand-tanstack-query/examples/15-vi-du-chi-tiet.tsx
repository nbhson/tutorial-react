// Chuẩn đi kèm: provider một lần + mutation invalidate
import { QueryClient, QueryClientProvider, useMutation, useQueryClient } from '@tanstack/react-query';

// Một client duy nhất ở module scope — tạo trong render là reset cache mỗi lần vẽ
const queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: 30_000, retry: 2 } } });

export function Providers({ children }: { children: React.ReactNode }) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
