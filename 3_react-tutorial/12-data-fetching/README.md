# DAY 12: DATA FETCHING (HTTP CLIENT)

## Mục tiêu bài học
- Hiểu 3 tầng fetch trong React 2026: `fetch` + `useEffect` (để học cơ chế), **TanStack Query v5** (chuẩn production), `use()` + Suspense / Server Components (framework-level).
- Nắm contract của fetch manual: AbortController, cleanup, loading/error states — nền tảng để hiểu vì sao cần managed fetching.
- Biết chọn đúng tầng: prod đừng tự quản lý cache/loading/dedup — dùng TanStack Query hoặc SWR.

## Khái niệm cốt lõi (Core)

### 1. Angular `HttpClient` trả Observable — React `fetch` trả Promise
Không có interceptor built-in, không DI intercept, không `async` pipe. Bạn tự viết wrapper (`ky`/axios instance) nếu cần header/retry/log tập trung.

```ts
// Angular: Observable + operators + interceptor
// this.http.get<User[]>("/api/users").pipe(retry(2), map(u => u.filter(...))).subscribe(...)

// React manual: Promise + .then + check tay (xem example.tsx)
fetch(url, { signal: ctrl.signal })
  .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
  .then((json: User[]) => setData(json));

// React prod: TanStack Query bọc Promise + cache/retry/dedupe (không viết tay)
const { data } = useQuery({ queryKey: ["users"], queryFn: () => fetch("/api/users").then((r) => { if (!r.ok) throw new Error("..."); return r.json(); }) });
```

Vì sao Promise khác Observable? Vì Promise 1 giá trị (resolve 1 lần), Observable stream (nhiều emit, hủy bằng unsubscribe). Fetch + AbortController là cặp Promise + hủy tương đương subscribe + unsubscribe.

### 2. `fetch` + `useEffect` — contract 4 điểm bắt buộc
Effect chạy sau mount → fetch → setState → re-render. Bắt buộc: (a) `AbortController` + `signal`, (b) check `!r.ok` (fetch không reject HTTP lỗi), (c) bỏ qua `AbortError` trong catch, (d) cleanup `return () => ctrl.abort()`.

```tsx
// example.tsx là contract chuẩn — thiếu 1 trong 4 là bug:
useEffect(() => {
  const ctrl = new AbortController(); // (a) bộ hủy
  fetch(url, { signal: ctrl.signal })
    .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); }) // (b) check HTTP
    .then((json: User[]) => setData(json))
    .catch((e: Error) => { if (e.name !== "AbortError") setError(String(e.message)); }) // (c) bỏ qua hủy chủ đích
    .finally(() => setLoading(false));
  return () => ctrl.abort(); // (d) cleanup khi unmount/url đổi
}, [url]);
```

Vì sao StrictMode dev "lộ" thiếu cleanup? Vì dev mount → effect → cleanup → effect: request đầu bị abort, fetch lại. Không cleanup là 2 request song song, `setData` 2 lần, race (cái chậm về sau ghi đè cái mới). Cleanup đúng thì request cũ abort sạch, chỉ còn 1.

### 3. TanStack Query v5 = managed fetching (chuẩn prod)
`useQuery({ queryKey, queryFn })` cho sẵn **cache, dedupe cùng key, retry, staleTime/gcTime, isLoading/isPending/isError, background refetch, refetchOnWindowFocus, pagination/infinite**. Server state ≠ client state — đừng nhét users vào Zustand (DAY 8) rồi tự viết lại từng tính năng trên.

```tsx
// TanStack Query v5 (prod) — npm i @tanstack/react-query
import { useQuery } from "@tanstack/react-query";

const { data, isLoading, isPending, error, refetch } = useQuery({
  queryKey: ["users"], // identity cache + dedupe: 2 component cùng key chỉ 1 request
  queryFn: () => fetch("https://jsonplaceholder.typicode.com/users").then((r) => {
    if (!r.ok) throw new Error(`HTTP ${r.status}`); // queryFn reject thì Query coi là lỗi để retry/isError
    return r.json();
  }),
  staleTime: 30_000, // 30s "tươi": remount trong 30s không fetch lại, hiện cache ngay
  retry: 2, // lỗi mạng retry 2 lần (không retry AbortError/hủy)
});
// Có sẵn: cache tới gcTime (5' mặc định), background refetch khi focus, placeholderData cho page...
```

`staleTime` vs `gcTime`: staleTime = bao lâu coi "tươi" (không fetch lại khi mount); gcTime = bao lâu giữ cache sau unmount (hết thì xóa, vào lại loading từ đầu). `isPending` (v5) = chưa có data; `isLoading` = đang fetch + chưa có data — tách rõ để skeleton đúng. `select` biến đổi data trong query (khỏi `useMemo` tay); `placeholderData: keepPreviousData` giữ trang cũ khi đổi page.

### 4. `use()` (React 19) + Suspense — đọc Promise trong render
Component "suspend" tới khi promise resolve; `<Suspense fallback>` hiện trong lúc chờ. Dành cho framework (Next.js Server Components fetch trực tiếp `async function`) hoặc promise local đã có. SPA Vite thuần vẫn dùng TanStack Query là chính.

```tsx
// use() + Suspense (framework-level, gợi ý — SPA Vite không bắt buộc):
import { Suspense, use } from "react";
function Profile({ promise }: { promise: Promise<User> }) {
  const user = use(promise); // pending -> suspend, resolve -> vẽ; không cần useEffect + state
  return <p>{user.name}</p>;
}
<Suspense fallback={<p>Đang tải profile...</p>}><Profile promise={userPromise} /></Suspense>
```

### 5. Server Components (ổn định 2026, framework-only)
`async function Page() { const data = await fetch(...); return <ul>... }` chạy trên server, không effect, không loading state tay. Chỉ trong Next.js/framework — tutorial SPA Vite không dùng, nhưng cần biết để không mang effect-fetch sang Server Component.

### Keyword chính
`fetch` (Promise) + `AbortController`/`signal`/`AbortError`, `r.ok` check, `useQuery`/`queryKey`/`queryFn`/`staleTime`/`gcTime`/`retry`/`select`/`placeholderData`, `QueryClientProvider`, `useMutation` + `invalidateQueries`, `use()` + `Suspense`, dedupe/cache.

## Luồng hoạt động (Flow)
1. (Manual) Mount `App`: `data = []`, `loading = true`, `error = null`. Render nhánh loading "Đang tải...".
2. Effect `[url]` chạy sau paint: tạo `AbortController`, reset loading/error, gọi `fetch(url, { signal })`. Vì sao sau paint? Để lần vẽ đầu (skeleton) hiện ngay, không chặn.
3. `fetch` resolve: check `!r.ok` → throw nếu 404/500 (vì fetch không reject HTTP lỗi). `r.json()` → `setData` → re-render nhánh data `<ul>`. `.finally` tắt loading.
4. Lỗi mạng → `.catch` (không phải AbortError) → `setError` → nhánh error + `role="alert"`. AbortError (unmount/StrictMode/url đổi) → bỏ qua, không hiện lỗi.
5. Unmount trước khi về → cleanup `ctrl.abort()` → fetch reject AbortError → không `setState` component đã unmount (hết warning + request thừa). `url` đổi → cleanup cũ + effect mới (request cũ abort, không race).
6. (TanStack) Thay 3 state + effect bằng `useQuery`: `queryKey ["users"]` là địa chỉ cache. Hai component cùng key cùng lúc → **dedupe** 1 request, cùng cache, auto retry 2 lần.
7. `staleTime` 30s: remount trong 30s → hiện cache ngay, không loading; ngoài 30s → hiện cache cũ + refetch nền (không skeleton). Focus lại cửa sổ (`refetchOnWindowFocus`) mà stale → refetch nền tương tự.
8. Unmount: data nằm cache tới `gcTime` (5' mặc định) → quay lại hiện ngay. Hết gcTime → xóa, vào lại loading từ đầu.
9. Mutation: `useMutation({ mutationFn: POST, onSuccess: () => qc.invalidateQueries(["users"]) })` → thêm xong refetch list. Optimistic (`onMutate` cập nhật cache trước, `onError` rollback) cho UX nhanh nhưng phải cẩn thận.
10. (`use()`) `Profile` gọi `use(promise)` — pending thì suspend, `<Suspense fallback>` hiện; resolve thì vẽ. Không `useEffect`, không 3 state.

## Ví dụ chi tiết
Khớp 1-1 với `example.tsx` (manual + deps `[url]` + empty state):

```tsx
// example.tsx — DAY 12: fetch manual (học cơ chế) + TanStack/mutation ghi chú
// Mục đích: nắm contract AbortController/cleanup/loading-error trước khi dùng lib.
import { useEffect, useState } from "react"; // (1) Effect cho fetch sau mount, state cho 3 nhánh

type User = { id: number; name: string }; // (2) Shape data — query lib cũng suy từ queryFn

export default function App({ url = "https://jsonplaceholder.typicode.com/users" }: { url?: string }) {
  // (3) Ba state cho 3 nhánh UI: data rỗng ban đầu, loading true, error null.
  // TanStack gộp thành { data, isLoading/isPending, error } — cùng ý.
  const [data, setData] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const ctrl = new AbortController(); // (4) Bộ hủy: signal nối vào fetch, abort() hủy khi unmount/url đổi
    setLoading(true); setError(null); // (5) Reset khi url đổi (deps [url]) — query lib làm tự động
    fetch(url, { signal: ctrl.signal })
      // (6) fetch chỉ reject khi mạng; HTTP 404/500 vẫn resolve -> PHẢI check r.ok tay
      .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}: ${r.statusText}`); return r.json(); })
      .then((json: User[]) => setData(json)) // (7) Về -> setData -> re-render nhánh data
      // (8) Bỏ qua AbortError (hủy chủ đích vì unmount/StrictMode) — không phải lỗi để hiện
      .catch((e: Error) => { if (e.name !== "AbortError") setError(String(e.message ?? e)); })
      .finally(() => setLoading(false)); // (9) Tắt loading cả thành công lẫn lỗi (trừ unmount sớm)
    return () => ctrl.abort(); // (10) Cleanup đối xứng: hủy request khi unmount hoặc url đổi trước khi xong
  }, [url]); // deps [url] — đổi url là fetch lại; TanStack dùng queryKey ["users", url] cho việc này

  // (11) Ba nhánh loại trừ: loading -> error -> data. Thứ tự quan trọng (loading trước).
  if (loading) return <p>Đang tải...</p>;
  if (error) return <p role="alert">Lỗi: {error}</p>;
  if (data.length === 0) return <p>Trống — không có user nào.</p>; // empty state (không có là <ul> rỗng)
  return <ul>{data.map((u) => <li key={u.id}>{u.name}</li>)}</ul>; // (12) key ổn định theo id
}

// Ghi chú prod (xem README để copy đầy đủ):
// - useQuery({ queryKey: ["users"], queryFn, staleTime: 30_000, retry: 2 }) cho cache/dedupe/retry/refetch.
// - QueryClientProvider ở main.tsx với QueryClient tạo 1 lần (không tạo mỗi render).
// - useMutation + qc.invalidateQueries({ queryKey: ["users"] }) sau thêm/sửa/xóa.
// - queryKey đủ chi tiết (["users", page]) — chung key cho 2 page là sai cache.
```

TanStack Query v5 đầy đủ (copy vào prod):

```tsx
// TanStack Query v5 (prod) — `npm i @tanstack/react-query`
import { useQuery } from "@tanstack/react-query";

const { data, isLoading, isPending, error, refetch } = useQuery({
  queryKey: ["users"], // identity cache + dedupe
  queryFn: () => fetch("https://jsonplaceholder.typicode.com/users").then((r) => {
    if (!r.ok) throw new Error(`HTTP ${r.status}`); // reject để retry/isError
    return r.json();
  }),
  staleTime: 30_000, // 30s tươi
  retry: 2, // retry mạng 2 lần
});
```

Provider + cấu hình toàn cục (`main.tsx` — tạo client 1 lần):

```tsx
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Tạo 1 lần ở module — tạo mỗi render là mất cache liên tục
const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, retry: 2, refetchOnWindowFocus: true } },
});
// JSX: <QueryClientProvider client={queryClient}><App /></QueryClientProvider>
```

Mutation + invalidate (thêm/sửa/xóa xong refetch list):

```tsx
import { useMutation, useQueryClient } from "@tanstack/react-query";

const qc = useQueryClient();
const addUser = useMutation({
  mutationFn: (name: string) =>
    fetch("/api/users", { method: "POST", body: JSON.stringify({ name }) }).then((r) => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json();
    }),
  onSuccess: () => qc.invalidateQueries({ queryKey: ["users"] }), // đánh dấu stale -> refetch
});
```

## Giải thích từng phần
- Dòng `useState<User[]>([])` + `loading true` + `error null`: 3 nhánh chuẩn. Vì sao 3 state mà không 1 object? Vì demo rõ từng nhánh; TanStack gộp sẵn (`data/isLoading/error`) để prod gọn. Thứ tự check `loading → error → data` quan trọng: đang tải thì hiện skeleton dù error cũ còn.
- Dòng `AbortController` + `{ signal }`: chuẩn Web để hủy fetch. Vì sao cần? Vì unmount/url đổi/StrictMode double-effect đều để lại request thừa; không hủy là `setState` sau unmount (warning) + race (cũ về sau ghi đè mới) + tốn băng thông.
- Dòng `if (!r.ok) throw`: **fetch không reject HTTP 404/500** (chỉ reject mạng/CORS/abort). Không check là 404 hiện `[]`/JSON lỗi như data đúng. Mọi `queryFn` cũng phải throw khi `!ok` để Query biết retry/`isError`.
- Dòng `.catch(e => { if (e.name !== "AbortError") ... })`: hủy chủ đích không phải lỗi. Vì sao check tên? Vì abort reject với `DOMException: AbortError` — hiện nó ra UI là báo động giả ("Lỗi: AbortError") khi user chỉ chuyển trang nhanh.
- Dòng `return () => ctrl.abort()`: cleanup đối xứng setup (nguyên tắc DAY 15). Quên là rò rỉ + race. Deps `[url]` (không phải `[]`) để đổi url fetch lại; TanStack thay bằng `queryKey: ["users", url]` — đổi key là refetch.
- Dòng `setLoading(true); setError(null)` đầu effect: reset khi `url` đổi. Vì sao? Vì không reset thì đổi url vẫn hiện data cũ + không skeleton, user tưởng không tải. Query lib reset/`isFetching` tự động.
- Ba nhánh `if (loading) / if (error) / if (empty)`: loại trừ, mỗi lúc một nhánh. `role="alert"` cho lỗi để screen reader đọc. Empty state riêng (`data.length === 0`) thay `<ul>` trống — tốt hơn hẳn.
- Dòng `key={u.id}`: id server ổn định cho diff (DAY 2). Không `key={index}` vì page đổi/thêm/xóa làm index dịch.
- Dòng `queryKey: ["users"]`: "địa chỉ" cache. Tham số hóa (`["users", page]`, `["users", { q }]`) — key khác là cache khác. Key chung cho 2 page là sai (page 2 hiện cache page 1).
- Dòng `staleTime`/`gcTime`: stale = tươi bao lâu (không fetch lại khi mount); gc = giữ cache bao lâu sau unmount. Phân biệt để skeleton đúng: stale còn thì hiện ngay không loading; hết stale thì hiện cũ + nền; hết gc thì loading từ đầu.
- Dòng `QueryClient` tạo 1 lần: tạo mỗi render (`function App() { const qc = new QueryClient(); }`) là cache mất liên tục, mọi query loading mãi. Tạo ở module/`main.tsx` 1 lần.
- Dòng `invalidateQueries`: sau mutation đánh dấu key stale → refetch. Không invalidate là list cũ dù server đã thêm. Optimistic (`onMutate` set cache trước, `onError` rollback) nhanh nhưng phải viết rollback đúng.

## Bảng so sánh Angular ↔ React
| Angular | React | Ghi chú |
|---|---|---|
| `HttpClient.get(...)` (Observable) | `fetch` (Promise) / axios / ky | Stream nhiều emit ↔ promise 1 resolve |
| `subscribe` + `async` pipe | `useEffect`+3 state / `useQuery` / `use()` | Data là state thường, không pipe |
| Interceptor (`HttpInterceptor`) thêm header/log | wrapper fetch / axios instance / ky hooks | Tự viết tầng giữa tập trung 1 file |
| RxJS (`map`, `retry`, `switchMap`, `catchError`) | Query options (`select`, `retry`/`retryDelay`, `refetchOnWindowFocus`) | Khai báo thay vì operators chain |
| Cache thủ công (hiếm) | `useQuery` cache + dedupe cùng key | Mạnh hơn hẳn, mặc định có |
| Guard chờ resolver (data trước route) | loader router (DAY 14) / `queryClient.fetchQuery` bridge | Data sẵn trước khi vẽ route |
| `HttpClient` params/headers | `queryFn` bọc fetch với `RequestInit` | Tập trung 1 wrapper có check `r.ok` |
| Biến đổi data (`map`) | `select` trong `useQuery` | Không `useMemo` tay sau query |
| Phân trang (`page` param) | `queryKey: ["users", page]` + `placeholderData: keepPreviousData` | Giữ trang cũ khi đổi page, không skeleton |

## Lỗi thường gặp (Common pitfalls)

### 1. SetState sau unmount (không AbortController)
```tsx
// ❌ SAI: unmount trước khi về -> warning + request thừa
useEffect(() => { fetch(url).then((r) => r.json()).then(setData); }, []);
```
```tsx
// ✅ ĐÚNG: controller + cleanup (như example)
useEffect(() => {
  const ctrl = new AbortController();
  fetch(url, { signal: ctrl.signal }).then((r) => r.json()).then(setData)
    .catch((e) => { if (e.name !== "AbortError") setError(String(e)); });
  return () => ctrl.abort();
}, [url]);
```

### 2. Quên check `r.ok` → 404 hiện như data đúng
```tsx
// ❌ SAI: 404 vẫn .json() (có thể crash parse HTML lỗi) hoặc hiện rỗng như đúng
fetch(url).then((r) => r.json()).then(setData);
```
```tsx
// ✅ ĐÚNG: throw khi !ok để catch/isError bắt
fetch(url).then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); }).then(setData);
```

### 3. Deps là string nối mỗi render → refetch vô tận
```tsx
// ❌ SAI: url object/string mới mỗi render (ví dụ `api/${JSON.stringify(f)}`) -> effect chạy mỗi render
useEffect(() => { fetch(`/api/users?f=${JSON.stringify(filter)}`); }, [`/api/users?f=${JSON.stringify(filter)}`]);
```
```tsx
// ✅ ĐÚNG: deps nguyên thủy ổn định, hoặc để queryKey lo
const q = filter.q; // string ổn định
useEffect(() => { fetch(`/api/users?q=${q}`); }, [q]);
// TanStack: useQuery({ queryKey: ["users", { q }], queryFn }) — key object được hash ổn định
```

### 4. Tự viết effect-fetch cho server state ở prod
Mô tả: tự lo cache/retry/dedupe/stale/focus/pagination — dễ sai từng cái. Fix: TanStack Query/SWR cho server state; effect chỉ cho hệ thống ngoài (timer/socket/DOM) theo quy tắc DAY 15.

### 5. Không bọc `QueryClientProvider`
Mô tả: `useQuery` ném "No QueryClient set, use QueryClientProvider". Fix: `new QueryClient()` 1 lần + bọc ở `main.tsx` (xem mẫu trên).

### 6. Key chung cho 2 tham số khác nhau
```tsx
// ❌ SAI: page 1 và 2 cùng key -> page 2 hiện cache page 1
useQuery({ queryKey: ["users"], queryFn: () => fetch(`/api/users?page=${page}`) });
```
```tsx
// ✅ ĐÚNG: key đủ chi tiết
useQuery({ queryKey: ["users", page], queryFn: () => fetch(`/api/users?page=${page}`) });
```

### 7. Tạo `QueryClient` mỗi render → mất cache
```tsx
// ❌ SAI: mỗi render client mới, cache xóa liên tục, loading mãi
function App() { const qc = new QueryClient(); return <QueryClientProvider client={qc}>...</QueryClientProvider>; }
```
```tsx
// ✅ ĐÚNG: tạo 1 lần ở module/main
const queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: 30_000 } } });
```

### 8. `useQuery` trong điều kiện/vòng lặp
Mô tả: vi phạm rules of hooks ("Rendered more hooks..."). Fix: tách component con nhận tham số (`<UserDetail id={id} />` gọi `useQuery` top-level), hoặc `enabled: !!id` để chờ đủ điều kiện mà vẫn gọi hook.

## Best practices / Mẹo
- **Phân loại state:** server state (users/products — cache/retry/dedupe) → TanStack Query; client state sinh từ server (cart/filter/toggle) → Zustand/Context. Vì sao? Vì trộn là tự viết lại cache cho cart và tự lo realtime cho users — sai cả hai.
- `queryFn` chung bọc fetch có check `r.ok` + parse — tái dùng, dễ mock (MSW DAY 21). Vì sao chung? Để 20 query không lặp 20 lần check `ok`.
- `select` biến đổi trong query (khỏi `useMemo` tay); `placeholderData: keepPreviousData` cho page mượt (giữ trang cũ khi đổi page). Vì sao? Vì derived từ data nên tính ở nguồn, không copy vào state.
- Mutation `useMutation` + `invalidateQueries` thay "refetch tay sau thêm". Vì sao? Để mọi nơi đọc key đó tự cập nhật, không gọi `refetch` rời rạc.
- **Cấu hình 1 lần** (`staleTime`, `retry`, `refetchOnWindowFocus`) ở `QueryClient` thay vì lặp mỗi `useQuery`. Vì sao? Để đổi chính sách 1 chỗ.
- **`queryKey` cấu trúc** (`["users", { page, q }]`) — invalidate nhóm (`{ queryKey: ["users"] }`) trúng cả nhóm. Vì sao cấu trúc? Để refetch theo nhóm (mọi page users) hoặc chính xác (page 2) tùy ý.
- Optimistic (`onMutate` set cache trước, `onError` rollback) cho UX nhanh — nhưng viết rollback đúng, không lạc quan mù.

## Bài tập nhỏ
1. Chuyển Users sang TanStack: nút Refetch (`refetch()`), bọc Provider — đổi `staleTime` 5s/30s, remount quan sát khác biệt (loading lại hay hiện cache).
2. `useMutation` thêm user (POST) + `invalidateQueries(["users"])` — kiểm tra list tự cập nhật từ server (không set tay).
3. Phân trang `queryKey: ["users", page]` + `placeholderData: keepPreviousData` — đổi trang, quan sát data cũ giữ (không skeleton) rồi thay bằng trang mới.
4. `useMutation` xóa + invalidate — kiểm tra list tự cập nhật sau xóa, và `retry: false` trong test để không chờ retry.
5. Bọc Provider trong test với `retry: false` (DAY 21), viết test loading (skeleton) → success (list) → error (alert) cho query.

## Reference
- https://react.dev/reference/react/use
- https://tanstack.com/query/latest
- https://react.dev/reference/react/useEffect
