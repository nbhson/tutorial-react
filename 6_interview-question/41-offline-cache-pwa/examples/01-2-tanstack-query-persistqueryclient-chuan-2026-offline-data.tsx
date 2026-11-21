import { QueryClient, persistQueryClient } from "@tanstack/react-query";
import { persistedStorage } from "@tanstack/react-query-persist-client";

// "Query (Q20) + 'persist (IndexedDB) (Q32: cache offline)"
const client = new QueryClient();
persistQueryClient({
  persister: persistedStorage,  // "IndexedDB (nhiều key, async, không block)"
  client,
  debounceWriteMs: 1000,        // "ghi (debounce) — 'không 'ghi mỗi change' (nặng)"
});

// "Trước (online, 'fetch) → 'lưu cache (Q32) → 'mất mạng (offline, 'lấy cache (Q21)"
const { data, status } = useQuery({
  queryKey: ["posts"],
  queryFn: fetchPosts,
  staleTime: 5 * 60_000,       // "5 phút — 'cũ (5 phút) → refetch (server mới)"
  refetchOnWindowFocus: true,  // "focus tab → 'refresh (nếu stale)" (Q32)
});
// "Data (offline) = 'cache (IndexedDB) (Q32) — 'UI hiện (không 'trống' (Q21)"
