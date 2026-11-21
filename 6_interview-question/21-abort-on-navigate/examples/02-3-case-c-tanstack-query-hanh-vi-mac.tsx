// Unmount component gọi useQuery(["posts", limit]) — request KHÔNG bị abort
// (đang active thì QueryClient giữ cho chạy tới khi settle, kết quả vào cache)
const { data, isPending } = useQuery({
  queryKey: ["posts", limit],
  queryFn: fetchPosts,
  gcTime: 5 * 60_000,   // giữ cache 5' sau unmount (mặc định)
});
