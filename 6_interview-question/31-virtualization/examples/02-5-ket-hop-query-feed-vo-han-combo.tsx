// "Nạp dần" (server paginate) + "vẽ cửa sổ" (client virtualize) — 2 tầng khác nhau
const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
  queryKey: ["posts"],
  queryFn: ({ pageParam }) => fetchPosts(pageParam),
  getNextPageParam: (last) => last.nextCursor,
});
// (1) data.pages "dãn phẳng" thành 1 mảng (mọi item đã nạp)
// (2) scroll gần đáy (onScroll) → fetchNextPage() (chỉ fetch, chưa có DOM)
// (3) virtualizer chỉ render "cửa sổ" — memory giữ page đã nạp, DOM giữ vài chục
