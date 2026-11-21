// "Query (Q20, Q21) — 'stale-while-revalidate' + 'dedupe' (không 'fetch trùng')"
const { data } = useQuery({
  queryKey: ["search", query],   // "key đổi (query mới) → 'stale' (cũ), 'refetch' (mới nhất)"
  queryFn: (q) => searchAPI(q), // "queryKey (q) — 'request cũ abort' (Q21)"
  staleTime: 30_000,           // "30s trong = 'cache, không fetch lại' (giảm request)"
  refetchOnWindowFocus: true,  // "focus tab = 'refetch' (nếu stale)"
});
// "Query (a) → (ab) → (abc)": "mỗi lần queryKey đổi → 'cancel' (request cũ) + 'fetch' (mới)"
// "Tự động: 'only latest wins' (Q21) — không 'abort request cũ (tự viết useEffect)'"
