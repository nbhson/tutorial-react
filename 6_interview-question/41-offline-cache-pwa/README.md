# Q41: Muốn app mất mạng vẫn xem được data cũ, em cache ở đâu, khi nào xóa?

## Câu hỏi

> App cần chạy được khi mất mạng (PWA, app wrap React Native / WebView) — data lưu bằng gì (`localStorage`, `IndexedDB`, `Service Worker`)?
> Khi server "đã đổi dữ liệu" thì cache client "bị cũ" — **invalidate / resync** bằng gì, theo thứ tự nào?
> So với cách Angular (NgRx + `HttpClient` + cache) thì khác chỗ nào?

## Trả lời ngắn (elevator pitch, 30 giây)

- **3 tầng "lưu data offline" (2026, theo kích cỡ + độ bền)**:
  1. **`localStorage`/`sessionStorage`** (≤ 5MB, string, "đơn giản"): **token, settings, "small data"** (user profile, last page) — **không** dùng cho "API response lớn" (5MB "đột biến" → crash).
  2. **`IndexedDB`** (> 5MB, "structured", "nhiều key"): **API response, files, "cache lớn"** (TanStack Query `persistQueryClient` → `indexeddb` adapter, Q20, Q32) — **chuẩn** cho "offline data".
  3. **`Service Worker`** (cache **JS/CSS/fonts** + "fetch requests" khi offline): **`workbox` / `vite-plugin-pwa`** (Q23, "code split + PWA") — "cache app (code) + 'nạp offline' (không cache 'API response (data')" (khác #1, #2).
- **Invalidate / resync (khi "server đổi")**: (1) **TanStack Query `staleTime`/`refetchOnWindowFocus`** (Q20, Q32: "query 'cũ' → refetch (server mới)"), (2) **`invalidateQueries`** (Q32: "mutation (thêm/sửa/xóa) → 'cache cũ' (refetch)"), (3) **`setQueryData`** (Q32: "ghi thẳng cache (optimistic), không refetch"). **Thứ tự đúng**: "trước (online, 'refresh') → sau (offline, 'lưu cache') — 'khi mất mạng, 'lấy từ cache' (Q21) (không 'fetch (trống'))"
- **Khác Angular (NgRx)**: NgRx + `HttpClient` = **"state (in-memory)"** (không "persist (IndexedDB)" (mặc định) — "nâng (NgRx Data / NgRx Persistent)" (ít dùng)"; **TanStack Query (React)** = **"cache (persistent, 'offline')"** (Q20, Q32 — "chuẩn 2026, 'persistQueryClient'").

## Trả lời chi tiết

### 1. "Lớp lưu" (3 tầng) — chọn theo "kích cỡ + độ bền"

| Lớp | Dùng khi | Vì sao |
|---|---|---|
| **`localStorage`** (string, ≤ 5MB) | Token, settings, "small data" (user profile, last page) | "Đơn giản, 'đọc/ghi sync' — '5MB 'đột biến' (API response lớn → crash)" |
| **`IndexedDB`** (structured, > 5MB) | API response, files, "cache lớn" (TanStack `persistQueryClient`) | "Chuẩn 'offline data' (Q20, Q32) — 'nhiều key, 'async' (không block)" |
| **`Service Worker`** (cache "JS/CSS/fonts" + "fetch" offline) | PWA ("code + assets" + "request (khi offline)") | "`workbox` / `vite-plugin-pwa` (Q23, "code split + PWA") — 'cache app (code), không 'API response (data)" (khác #1, #2)" |

### 2. "TanStack Query + `persistQueryClient`" (chuẩn 2026, "offline data")

```tsx
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
```

**"Điểm ăn điểm"**: "Query + persist = 'state server data (Q20, Q32) (offline) — 'khi mất mạng, 'lấy cache (không 'fetch (trống')" (Q21)".

### 3. "Invalidate / resync" (khi "server đổi") — "theo thứ tự"

| Bước | Khi nào | Công cụ | Vì sao |
|---|---|---|---|
| **`staleTime`** (Q20) | "Query 'cũ' (sau N ms)" (default 0, "chọn 5 phút) | `staleTime: 5 * 60_000` | "'5 phút → 'refetch (server mới) (không 'mỗi lần (nhiều, Q32)" |
| **`refetchOnWindowFocus`** (Q32) | "User quay lại tab (focus) | `refetchOnWindowFocus: true` | "'refresh (nếu stale) (Q32) — 'user 'sống' (tab) (server 'đã đổi')" |
| **`invalidateQueries`** (Q32) | "Mutation (thêm/sửa/xóa) (Q32) | `invalidateQueries({ queryKey: ["posts"] })` | "'cache (posts) 'stale' → refetch (server mới) (Q32) — 'mutation (Q32)" |
| **`setQueryData`** (Q32) | "Optimistic update (Q32) | `setQueryData(["posts"], newPosts)` | "'ghi thẳng cache (không refetch) (Q32) — 'UI hiện ngay (optimistic, Q32)" |

**"Thứ tự đúng"**: (1) **`staleTime`** (5 phút) (không refetch mỗi lần), (2) **`refetchOnWindowFocus`** (focus tab), (3) **`invalidateQueries`** (mutation, Q32), (4) **`setQueryData`** (optimistic, Q32). **Không "invalidate (mỗi lần (nhiều)" — 'thua (Q32, 'refetch (nhiều)'".

### 4. "PWA + `Service Worker`" (cache "code" + "fetch" offline)

```tsx
// "vite-plugin-pwa (Q23, "code split + PWA") — 'cache app (JS/CSS/fonts) + 'fetch (offline)"
// "Không 'cache API response (data' (Q20, Q32) — 'data (IndexedDB, Query, Q32)"
// "Service Worker (cache 'code + assets') ≠ IndexedDB (cache 'data' (Q20, Q32)"
```

**"Phân biệt"**: **Service Worker** = "cache **code (JS/CSS/fonts) + fetch request** (khi offline) — 'workbox' / `vite-plugin-pwa`"; **IndexedDB + Query** = "cache **data (API response)** (Q20, Q32). **Khác (không 'dùng (thay')" (Q23, "PWA" ≠ "data cache"").

### 5. "So Angular (NgRx)" (Q1, Q15)

| | Angular (NgRx + HttpClient) | React (TanStack Query) |
|---|---|---|
| **State (in-memory)** | NgRx (`store`, `actions` — Q15, "external store") | Query (Q20, "server state") + Context/Zustand (Q13, Q15) |
| **Offline (persist)** | NgRx Data / NgRx Persistent (ít dùng, "thủ công") | **`persistQueryClient` (IndexedDB)** (Q32, "chuẩn") |
| **PWA (code + assets)** | `ngsw-config.json` (Service Worker, Angular PWA) | `vite-plugin-pwa` (Service Worker, React PWA) |
| **Invalidate** | NgRx (action (Q15, "external store")) | **`invalidateQueries` / `setQueryData` (Q32)** |

**"Điểm ăn điểm"**: "Angular (NgRx) = 'state (in-memory) (mặc định, 'không persist' (NgRx Data (ít dùng)"); React (Query) = 'server state + persist (IndexedDB) (chuẩn 2026' (Q20, Q32)".

## Bẫy khi phỏng vấn

1. **"Lưu API response vào `localStorage` (5MB)"** → **sai** (5MB "đột biến" → crash, "IndexedDB (chuẩn (Q20, Q32)").
2. **"Service Worker (cache 'API response (data')"** → **sai** (Service Worker = "cache code + assets + fetch (offline)" (Q23, PWA); "data (IndexedDB + Query) (Q32).
3. **"Mất mạng → 'fetch (trống' (UI trống)"** → **sai** (Q21, Q32) — "lấy cache (IndexedDB, Query) (không fetch), 'UI hiện (data (offline)".
4. **"NgRx (cứu 'offline (persist)'"** → **sai** (NgRx = "in-memory" (mặc định); NgRx Data / Persistent = "thủ công, ít dùng" (React + Query + persist = "chuẩn").

## Gợi ý câu chốt

> "Cache offline (PWA / app wrap) (2026) (3 lớp: **`localStorage`** (token, small, ≤ 5MB), **`IndexedDB`** (API response, files, 'nhiều key') (Q20, Q32), **`Service Worker`** (code + assets, PWA (Q23). **Invalidate (khi 'server đổi') (4 bước: `staleTime` (5 phút, không refetch mỗi lần), `refetchOnWindowFocus` (focus tab), `invalidateQueries` (mutation, Q32), `setQueryData` (optimistic, Q32). **PWA**: `vite-plugin-pwa` (Service Worker (cache code), 'khác data (IndexedDB + Query (Q32). **So Angular (NgRx)**: NgRx = in-memory (mặc định, 'không persist'); React + Query + persist (IndexedDB) = 'chuẩn 2026' (Q20, Q32)."

## Reference

- [`20-data-fetching`](../20-data-fetching/README.md) — "Fetch data, TanStack Query (Q20)"
- [`32-query-mutations`](../32-query-mutations/README.md) — "Invalidate / setQueryData (optimistic, Q32)"
- [`21-abort-on-navigate`](../21-abort-on-navigate/README.md) — "Abort khi offline (Q21)"
- [`23-bundle-size`](../23-bundle-size/README.md) — "PWA + code split (Q23)"
- [`15-external-stores`](../15-external-stores/README.md) — "So Angular (NgRx) (Q15)"
- [TanStack Query Persist docs](https://tanstack.com/query/latest/docs/framework/react/persister)
- [MDN: IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)
- [Vite PWA plugin](https://vite-pwa-org.netlify.app/)

## Câu hỏi liên quan

- **Hỏi tiếp (liên tục)**: [Q20 — fetch data, TanStack Query (Q20)?](../20-data-fetching/README.md) · [Q32 — invalidate / optimistic (Q32)?](../32-query-mutations/README.md)
- **Đào sâu (xuyên nhóm)**: [Q21 — abort khi offline (Q21)?](../21-abort-on-navigate/README.md) · [Q23 — PWA + code split (Q23)?](../23-bundle-size/README.md) · [Q15 — so Angular (NgRx) (Q15)?](../15-external-stores/README.md)
