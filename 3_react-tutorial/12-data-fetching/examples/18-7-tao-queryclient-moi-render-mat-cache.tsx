// ✅ ĐÚNG: tạo 1 lần ở module/main
const queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: 30_000 } } });
