# Q41: Muốn app mất mạng vẫn xem được data cũ, em cache ở đâu, khi nào xóa?

## Câu hỏi

> App cần chạy được khi mất mạng (PWA, app wrap React Native / WebView) — data lưu bằng gì (`localStorage`, `IndexedDB`, `Service Worker`)?
> Khi server "đã đổi dữ liệu" thì cache client "bị cũ" — **invalidate / resync** bằng gì, theo thứ tự nào?
> So với cách Angular (NgRx + `HttpClient` + cache) thì khác chỗ nào?

## Trả lời ngắn (elevator pitch, 30 giây)

Mục này là "bản nói 30 giây" — thuộc khung "3 tầng lưu" là đã trả lời xong nửa câu hỏi; phần chi tiết bên dưới để đỡ khi bị hỏi resync và so với Angular.

- **3 tầng theo nhu cầu**: (1) `localStorage` (≤ 5MB): token, settings, data nhỏ. (2) `IndexedDB`: response API lớn — chuẩn cho data offline (kèm persist của Query). (3) Service Worker: cache **code** (JS/CSS/fonts) để mở được app khi mất mạng.
- **Đồng bộ khi online lại**: hiển thị cache trước, refresh nền sau — data cũ thì refetch, vừa mutate xong thì invalidate cache.

## Trả lời chi tiết

Mục này xếp 3 "kho lưu trữ" theo kích cỡ và độ bền, rồi trả lời câu hỏi khó nhất: cache cũ thì làm sao biết và làm sao vứt — đọc để nắm được cả mặt "lưu" lẫn mặt "xóa".

### 1. "Lớp lưu" (3 tầng) — chọn theo "kích cỡ + độ bền"

| Lớp | Dùng khi | Vì sao |
|---|---|---|
| **`localStorage`** (string, ≤ 5MB) | Token, settings, "small data" (user profile, last page) | "Đơn giản, 'đọc/ghi sync' — '5MB 'đột biến' (API response lớn → crash)" |
| **`IndexedDB`** (structured, > 5MB) | API response, files, "cache lớn" (TanStack `persistQueryClient`) | "Chuẩn 'offline data' (Q20, Q32) — 'nhiều key, 'async' (không block)" |
| **`Service Worker`** (cache "JS/CSS/fonts" + "fetch" offline) | PWA ("code + assets" + "request (khi offline)") | "`workbox` / `vite-plugin-pwa` (Q23, "code split + PWA") — 'cache app (code), không 'API response (data)" (khác #1, #2)" |

> **Cách đọc bảng này:** mỗi dòng là một kho lưu trữ xếp theo mức "lớn" dần; cột "Dùng khi" là cột quyết định, cột "Vì sao" nêu giới hạn đáng nhớ (nhất là trần 5MB của `localStorage`) — đọc nhanh bằng cách nhớ: cái nhỏ sync, cái lớn async, còn Service Worker chỉ lo code chứ không lo data.

### 2. "TanStack Query + `persistQueryClient`" (chuẩn 2026, "offline data")

> 📄 **Code ví dụ:** [`examples/01-2-tanstack-query-persistqueryclient-chuan-2026-offline-data.tsx`](examples/01-2-tanstack-query-persistqueryclient-chuan-2026-offline-data.tsx)

**"Điểm ăn điểm"**: "Query + persist = 'state server data (Q20, Q32) (offline) — 'khi mất mạng, 'lấy cache (không 'fetch (trống')" (Q21)".

### 3. "Invalidate / resync" (khi "server đổi") — "theo thứ tự"

| Bước | Khi nào | Công cụ | Vì sao |
|---|---|---|---|
| **`staleTime`** (Q20) | "Query 'cũ' (sau N ms)" (default 0, "chọn 5 phút) | `staleTime: 5 * 60_000` | "'5 phút → 'refetch (server mới) (không 'mỗi lần (nhiều, Q32)" |
| **`refetchOnWindowFocus`** (Q32) | "User quay lại tab (focus) | `refetchOnWindowFocus: true` | "'refresh (nếu stale) (Q32) — 'user 'sống' (tab) (server 'đã đổi')" |
| **`invalidateQueries`** (Q32) | "Mutation (thêm/sửa/xóa) (Q32) | `invalidateQueries({ queryKey: ["posts"] })` | "'cache (posts) 'stale' → refetch (server mới) (Q32) — 'mutation (Q32)" |
| **`setQueryData`** (Q32) | "Optimistic update (Q32) | `setQueryData(["posts"], newPosts)` | "'ghi thẳng cache (không refetch) (Q32) — 'UI hiện ngay (optimistic, Q32)" |

**"Thứ tự đúng"**: (1) **`staleTime`** (5 phút) (không refetch mỗi lần), (2) **`refetchOnWindowFocus`** (focus tab), (3) **`invalidateQueries`** (mutation, Q32), (4) **`setQueryData`** (optimistic, Q32). **Không "invalidate (mỗi lần (nhiều)" — 'thua (Q32, 'refetch (nhiều)'". Ví von: cache offline như tủ lạnh ở nhà — mất điện vẫn ăn được đồ trong tủ, nhưng tủ phải được "kiểm hàng định kỳ" (staleTime, focus) và "xóa món cũ khi nhập món mới" (invalidateQueries) thì mới không ăn phải đồ hỏng.

### 4. "PWA + `Service Worker`" (cache "code" + "fetch" offline)

> 📄 **Code ví dụ:** [`examples/02-4-pwa-service-worker-cache-code-fetch-offline.tsx`](examples/02-4-pwa-service-worker-cache-code-fetch-offline.tsx)

**"Phân biệt"**: **Service Worker** = "cache **code (JS/CSS/fonts) + fetch request** (khi offline) — 'workbox' / `vite-plugin-pwa`"; **IndexedDB + Query** = "cache **data (API response)** (Q20, Q32). **Khác (không 'dùng (thay')" (Q23, "PWA" ≠ "data cache"").

### 5. "So Angular (NgRx)" (Q1, Q15)

| | Angular (NgRx + HttpClient) | React (TanStack Query) |
|---|---|---|
| **State (in-memory)** | NgRx (`store`, `actions` — Q15, "external store") | Query (Q20, "server state") + Context/Zustand (Q13, Q15) |
| **Offline (persist)** | NgRx Data / NgRx Persistent (ít dùng, "thủ công") | **`persistQueryClient` (IndexedDB)** (Q32, "chuẩn") |
| **PWA (code + assets)** | `ngsw-config.json` (Service Worker, Angular PWA) | `vite-plugin-pwa` (Service Worker, React PWA) |
| **Invalidate** | NgRx (action (Q15, "external store")) | **`invalidateQueries` / `setQueryData` (Q32)** |

> **Cách đọc bảng này:** mỗi dòng là một khía cạnh (state trong RAM, persist offline, PWA, cách làm mới cache) — cột giữa là Angular, cột phải là React; dòng "Offline (persist)" là dòng được hỏi nhiều nhất vì đó là chỗ hai hệ sinh thái chênh lệch rõ nhất.

**"Điểm ăn điểm"**: "Angular (NgRx) = 'state (in-memory) (mặc định, 'không persist' (NgRx Data (ít dùng)"); React (Query) = 'server state + persist (IndexedDB) (chuẩn 2026' (Q20, Q32)".

## Bẫy khi phỏng vấn

1. **"Lưu API response vào `localStorage` (5MB)"** → **sai** (5MB "đột biến" → crash, "IndexedDB (chuẩn (Q20, Q32)").
2. **"Service Worker (cache 'API response (data')"** → **sai** (Service Worker = "cache code + assets + fetch (offline)" (Q23, PWA); "data (IndexedDB + Query) (Q32).
3. **"Mất mạng → 'fetch (trống' (UI trống)"** → **sai** (Q21, Q32) — "lấy cache (IndexedDB, Query) (không fetch), 'UI hiện (data (offline)".
4. **"NgRx (cứu 'offline (persist)'"** → **sai** (NgRx = "in-memory" (mặc định); NgRx Data / Persistent = "thủ công, ít dùng" (React + Query + persist = "chuẩn").

> **Tóm gọn 1 câu:** Offline cache là quản lý tủ lạnh: đồ nhỏ để ngăn trên (`localStorage`), đồ nhiều để ngăn lớn (`IndexedDB`), còn `Service Worker` chỉ là bảo đảm nhà vẫn có điện mở được cửa — và nhớ kiểm hàng (staleTime/focus) kèm xóa món cũ (invalidate) thì mới không ăn đồ hỏng.

## Gợi ý câu chốt

Mục này gói cả bài thành một đoạn trả lời mẫu — đọc để tập nói trọn một hơi rồi diễn đạt lại bằng giọng của mình.

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
