# DAY 12: DATA FETCHING (HTTP CLIENT)

## Mục tiêu bài học
- Hiểu 3 tầng fetch trong React 2026: `fetch` + `useEffect` (để học cơ chế), **TanStack Query v5** (chuẩn production), `use()` + Suspense / Server Components (framework-level).
- Nắm contract của fetch manual: AbortController, cleanup, loading/error states — nền tảng để hiểu vì sao cần managed fetching.
- Biết chọn đúng tầng: prod đừng tự quản lý cache/loading/dedup — dùng TanStack Query hoặc SWR.

## Khái niệm cốt lõi (Core)
- **Angular `HttpClient` trả Observable; React fetch trả Promise.** Không có interceptor built-in, không có DI intercept — bạn tự viết wrapper hoặc dùng `ky`/axios instance nếu cần.
- **`fetch` + `useEffect` flow:** effect chạy sau mount → fetch → setState → re-render. **Bắt buộc 3 điểm:** AbortController (hủy request khi unmount), check `!r.ok`, cleanup trả về `ctrl.abort()`.
- **TanStack Query v5 = managed fetching:** `useQuery({ queryKey, queryFn })` cho sẵn **cache, refetch, retry, staleTime, isLoading/isError/isPending**, dedupe cùng queryKey, background refetch, pagination/infinite query. Server state ≠ client state — đừng nhét vào Zustand (DAY 8).
- **`use()` (React 19):** đọc Promise trực tiếp trong render; component "suspend" cho tới khi resolve — phối hợp `<Suspense>`. Dành cho data fetch ở framework (Next.js/React Server Components) hoặc data local đã có promise.
- **Server Components** (ổn định 2026): fetch trực tiếp trên server (`async function`) không cần effect — nhưng chỉ khả dụng trong framework như Next.js. Tutorial SPA Vite dùng TanStack Query.
- **Keyword chính:** `useQuery`, `queryKey`, `queryFn`, `AbortController`, `staleTime`/`gcTime`, `retry`, `use()` + `Suspense`, deduplication, cache.

## Luồng hoạt động (Flow)
1. (Manual) Mount `Users`: 3 state `data`/`loading`/`error`; effect deps `[]` chạy 1 lần.
2. Tạo `AbortController`, gọi `fetch(url, { signal })`; `if (!r.ok) throw`; `r.json()` → `setData`; `.catch` setError (bỏ qua AbortError); `.finally` setLoading(false).
3. Unmount trước khi response về → cleanup gọi `ctrl.abort()` → fetch rejected với AbortError → không setState component đã unmount.
4. Render 3 nhánh: loading → "Đang tải..."; error → "Lỗi..."; data → `<ul>`.
5. (TanStack Query) Thay bằng `useQuery`: queryKey `["users"]` (identity của cache), queryFn gọi fetch. Cùng một queryKey ở 2 component → **dedupe** (chỉ 1 request), cùng cache, auto retry.
6. `staleTime` 30s: trong 30s không refetch lại dù remount; ngoài thời gian đó, mount lại → refetch nền, UI hiện dữ liệu cũ ngay (không loading) — trải nghiệm mượt hơn manual.
7. (use) Component `Profile` gọi `use(userPromise)` — nếu promise pending, React suspend; `<Suspense fallback>` hiển thị tới khi resolve.
8. Query tự dedupe: hai component cùng `queryKey` trong cùng thời điểm → chỉ 1 request; component thứ hai "mượn" cache đang tải.
9. Khi cửa sổ focus lại (mặc định `refetchOnWindowFocus`), query stale sẽ refetch nền — dữ liệu mới thay thế mà không có màn loading.
10. Unmount component: dữ liệu vẫn nằm trong cache tới hết `gcTime` (mặc định 5 phút) → quay lại trang hiển thị ngay lập tức.

## Ví dụ chi tiết
```tsx
// example.tsx — DAY 12: fetch + useEffect + AbortController
import { useEffect, useState } from "react";

type User = { id: number; name: string };

export default function App() {
  const [data, setData] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const ctrl = new AbortController(); // 1. bộ hủy request
    fetch("https://jsonplaceholder.typicode.com/users", { signal: ctrl.signal })
      .then((r) => { if (!r.ok) throw new Error(r.statusText); return r.json(); }) // 2. check HTTP
      .then(setData)
      .catch((e: Error) => { if (e.name !== "AbortError") setError(String(e)); }) // 3. bỏ qua lỗi do hủy
      .finally(() => setLoading(false));
    return () => ctrl.abort(); // 4. cleanup: hủy khi unmount/đổi deps
  }, []);

  if (loading) return <p>Đang tải...</p>;
  if (error) return <p>Lỗi: {error}</p>;
  return <ul>{data.map((u) => <li key={u.id}>{u.name}</li>)}</ul>;
}
```

```tsx
// TanStack Query v5 (prod) — `npm i @tanstack/react-query`
import { useQuery } from "@tanstack/react-query";

const { data, isLoading, error } = useQuery({
  queryKey: ["users"], // identity cache + dedupe
  queryFn: () => fetch("https://jsonplaceholder.typicode.com/users").then((r) => r.json()),
  staleTime: 30_000, // 30s không coi là cũ
  retry: 2, // retry 2 lần khi lỗi mạng
});
// Có sẵn: cache, background refetch, retry, gcTime, isLoading, refetch()...
```

Provider + cấu hình toàn cục (main.tsx):

```tsx
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, retry: 2 } },
});
// <QueryClientProvider client={queryClient}><App/></QueryClientProvider>
```

Mutation + invalidate (thêm/sửa/xóa):

```tsx
import { useMutation, useQueryClient } from "@tanstack/react-query";

const qc = useQueryClient();
const addUser = useMutation({
  mutationFn: (name: string) =>
    fetch("/api/users", { method: "POST", body: JSON.stringify({ name }) }).then((r) => r.json()),
  onSuccess: () => qc.invalidateQueries({ queryKey: ["users"] }), // refetch danh sách
});
```

## Giải thích từng phần
- `AbortController`: chuẩn Web — `signal` nối vào fetch; `abort()` hủy. React StrictMode dev mount 2 lần: effect 2 lần, request cũ bị abort — đây là lý do phải viết đủ pattern này.
- `if (!r.ok) throw`: `fetch` chỉ fail khi mạng; **HTTP 404/500 vẫn resolve** — check status thủ công.
- `.catch` kiểm tra `e.name !== "AbortError"`: hủy có chủ đích không phải lỗi — đừng hiện "Lỗi: ..." cho trường hợp này.
- `return () => ctrl.abort()`: cleanup đối xứng setup (DAY 15). Quên = setState sau unmount (warning) + request thừa.
- `queryKey: ["users"]`: "địa chỉ" của cache. Muốn theo tham số: `["users", userId]`; tham chiếu đổi → query khác/refetch.
- `staleTime` vs `gcTime`: staleTime = bao lâu dữ liệu "tươi"; gcTime = bao lâu giữ cache sau khi unmount. Phân biệt rõ 2 khái niệm.
- **Manual là để học; prod đừng tự viết** — dependency chain (retry, refetch window focus, pagination) rất dễ sai, TanStack Query đã giải quyết.
- **`QueryClientProvider` bọc app:** tạo một `QueryClient` ở `main.tsx`; mọi `useQuery` trong subtree dùng chung cache.
- **`isPending` vs `isLoading` (v5):** `isPending` = chưa có dữ liệu; `isLoading` = đang fetch và chưa có dữ liệu — v5 tách rõ nghĩa.
- **`queryFn` nên throw khi HTTP lỗi:** TanStack Query coi promise reject là lỗi để retry/`isError`; đừng trả `null` che lỗi.

## Bảng so sánh Angular ↔ React
| Angular | React | Ghi chú |
|---|---|---|
| `HttpClient.get(...)` (Observable) | `fetch` (Promise) / axios / ky | Khác mô hình stream↔promise |
| `subscribe` + `async` pipe | `useEffect`+state / `useQuery` / `use()` | RTL: data là state thường |
| Interceptor | wrapper fetch / axios instance / ky hooks | Tự viết tầng giữa |
| RxJS operators (`map`, `retry`, `switchMap`) | TanStack Query options (`select`, `retry`, `refetchOnWindowFocus`) | Cùng khả năng, ít boilerplate |
| `HttpClient` cache (rare) | `useQuery` cache + dedupe | Mạnh hơn hẳn |
| Guard chờ resolver | loader của router (DAY 14) / query | Khi cần data trước route |
| `HttpInterceptor` thêm header | `queryFn` bọc fetch/axios instance | Tập trung 1 wrapper |
| `HttpClient` Observable operators | `select`/`placeholderData` của query | Biến đổi data ngay trong hook |
| `catchError` + retry | `retry`/`retryDelay` options | Khai báo, không viết tay |

## Lỗi thường gặp (Common pitfalls)
- **SetState sau unmount** → React warning + memory thừa. → Fix: AbortController + cleanup (ví dụ trên).
- **Quên check `r.ok`** → 404 hiện `[]` thay vì lỗi. → Fix: `if (!r.ok) throw new Error(...)`.
- **`useEffect` deps `[url]` mà url là string nối mỗi render** (`api/${x}`) → refetch mỗi render. → Fix: deps ổn định, hoặc để TanStack queryKey lo.
- **Bỏ hết vào `useEffect` kể cả khi có bundle data** — React 19 khuyên: effect chỉ cho đồng bộ hệ thống ngoài; data fetching managed bằng thư viện. → Fix: dùng TanStack Query/SWR cho server state.
- **Không bọc `<QueryClientProvider>`** → `useQuery` ném "No QueryClient set". → Fix: `new QueryClient()` + Provider ở main.tsx.
- **Key chung cho mọi tham số** (`["users"]` cho cả page 1 và 2) → pagination trả về sai. → Fix: key đủ chi tiết (`["users", page]`).
- **Bọc `QueryClientProvider` nhưng tạo client mới mỗi render** → cache mất liên tục. → Fix: tạo `QueryClient` một lần ở module/main.
- **Gọi `useQuery` trong vòng lặp/điều kiện** → vi phạm rules of hooks. → Fix: tách component con nhận tham số.
- **Không xử lý `isError`** → UI trắng khi lỗi. → Fix: nhánh error rõ ràng + nút retry.

## Best practices / Mẹo
- **Nguyên tắc phân loại state:** server state (users, products) → TanStack Query; client state được sinh từ server (cart, filters, toggles) → Zustand/Context. Đừng trộn.
- Tạo `queryFn` chung dùng `fetch` wrapper có check `r.ok` + parse json — tái dùng được, dễ mock trong test.
- Dùng `select` để biến đổi dữ liệu ngay trong query (tránh `useMemo` thủ công); `placeholderData: keepPreviousData` cho pagination mượt.
- Mutation dùng `useMutation` + `queryClient.invalidateQueries({ queryKey })` — thay cho "refetch lại sau khi thêm".
- SPA thuần: không có SSR nên server fetching không cần; framework (Next.js) mới quan tâm Server Components/`use()`.
- **Cấu hình mặc định một lần:** `staleTime`, `retry`, `refetchOnWindowFocus` ở `QueryClient` thay vì lặp ở từng `useQuery`.
- **`queryKey` có cấu trúc:** `["users", { page, filter }]` — dễ invalidate theo nhóm (`{ queryKey: ["users"] }`).
- **Optimistic update:** `onMutate` cập nhật cache lạc quan rồi rollback trong `onError` — UX nhanh nhưng cần cẩn thận.

## Bài tập nhỏ
1. Chuyển component Users sang TanStack Query: thêm nút "Refetch" (gọi `refetch()`), bọc `QueryClientProvider` để test — đổi `staleTime` 5s/30s và remount component quan sát khác biệt.
2. Viết `useMutation` cho "thêm user" (POST /users), sau khi thành công gọi `invalidateQueries({queryKey:["users"]})` — kiểm tra danh sách tự cập nhật (dữ liệu từ server phản hồi).
3. Thêm phân trang: `useQuery({ queryKey: ["users", page], queryFn })` + `placeholderData: keepPreviousData` — quan sát dữ liệu cũ giữ trên màn khi đổi trang.
4. Viết `useMutation` xóa user + `invalidateQueries` — kiểm tra danh sách tự cập nhật sau khi xóa.
5. Bọc `QueryClientProvider` trong test với `retry: false` (DAY 21) và viết test cho trạng thái loading/error.

## Reference
- https://react.dev/reference/react/use
- https://tanstack.com/query/latest
- https://react.dev/reference/react/useEffect