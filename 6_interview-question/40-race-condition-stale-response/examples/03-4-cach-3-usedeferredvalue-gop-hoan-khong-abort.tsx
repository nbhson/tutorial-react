// "Search 10k item (Q29) — 'deferred' (hoãn việc fetch) — 'gộp request' (debounce)"
const deferred = useDeferredValue(query);  // "query (mới) → deferred (cũ, chờ) → fetch (deferred)"
const { data } = useQuery({ queryKey: ["search", deferred], queryFn: (q) => searchAPI(q) });
// "Gõ (a, ab, abc) nhanh → deferred 'chờ 300ms' → 'chỉ fetch (abc) (1 request, không 3')"
