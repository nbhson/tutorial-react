# DAY 12: DATA FETCHING (HTTP CLIENT)

## Mục tiêu bài học
- Hiểu 3 tầng fetch trong React 2026: `fetch` + `useEffect` (để học cơ chế), **TanStack Query v5** (chuẩn production), `use()` + Suspense / Server Components (framework-level).
- Nắm contract của fetch manual: AbortController, cleanup, loading/error states — nền tảng để hiểu vì sao cần managed fetching.
- Biết chọn đúng tầng: prod đừng tự quản lý cache/loading/dedup — dùng TanStack Query hoặc SWR.

## Khái niệm cốt lõi (Core)

### 1. Angular `HttpClient` trả Observable — React `fetch` trả Promise
Không có interceptor built-in, không DI intercept, không `async` pipe. Bạn tự viết wrapper (`ky`/axios instance) nếu cần header/retry/log tập trung.

Hãy hình dung: Angular đưa bạn một "nhà hàng phục vụ trọn gói" (HttpClient có sẵn interceptor, pipe), còn React đưa bạn nguyên liệu — `fetch` — và bạn tự nấu. Tự nấu thì tự do, nhưng muốn ăn nhiều món giống nhau (thêm header, retry) thì bạn nên xây một "nhà bếp chung" là wrapper.

> 📄 **Code ví dụ:** [`examples/01-1-angular-httpclient-tra-observable-react-fetch-tra.ts`](examples/01-1-angular-httpclient-tra-observable-react-fetch-tra.ts)

Vì sao Promise khác Observable? Vì Promise 1 giá trị (resolve 1 lần), Observable stream (nhiều emit, hủy bằng unsubscribe). Fetch + AbortController là cặp Promise + hủy tương đương subscribe + unsubscribe. Ví von: Observable là kênh radio phát liên tục còn Promise là thư gửi một lần — nhận thư hoặc không, không có "số phát sóng tiếp theo".

> **Tóm gọn 1 câu:** Sang React, dữ liệu về bằng Promise qua `fetch` — muốn interceptor/retry tập trung thì tự bọc một wrapper.

### 2. `fetch` + `useEffect` — contract 4 điểm bắt buộc
Effect chạy sau mount → fetch → setState → re-render. Bắt buộc: (a) `AbortController` + `signal`, (b) check `!r.ok` (fetch không reject HTTP lỗi), (c) bỏ qua `AbortError` trong catch, (d) cleanup `return () => ctrl.abort()`. Coi đây như "quy trình 4 bước xin phép" trước khi tự tay fetch — thiếu một bước là về sau lòi ra bug khó truy.

> 📄 **Code ví dụ:** [`examples/02-2-fetch-useeffect-contract-4-iem-bat-buoc.tsx`](examples/02-2-fetch-useeffect-contract-4-iem-bat-buoc.tsx)

Vì sao StrictMode dev "lộ" thiếu cleanup? Vì dev mount → effect → cleanup → effect: request đầu bị abort, fetch lại. Không cleanup là 2 request song song, `setData` 2 lần, race (cái chậm về sau ghi đè cái mới). Cleanup đúng thì request cũ abort sạch, chỉ còn 1.

> **Tóm gọn 1 câu:** Tự tay fetch = ký hợp đồng 4 điều khoản (abort, check `r.ok`, lọc AbortError, cleanup) — thiếu điều nào là bug điều đó.

### 3. TanStack Query v5 = managed fetching (chuẩn prod)
`useQuery({ queryKey, queryFn })` cho sẵn **cache, dedupe cùng key, retry, staleTime/gcTime, isLoading/isPending/isError, background refetch, refetchOnWindowFocus, pagination/infinite**. Server state ≠ client state — đừng nhét users vào Zustand (DAY 8) rồi tự viết lại từng tính năng trên. Ví von: tự tay fetch như tự đi lấy nước từng xô, còn TanStack Query là lắp đường ống một lần — bật vòi là có, hết nóng thì tự hâm lại.

> 📄 **Code ví dụ:** [`examples/03-3-tanstack-query-v5-managed-fetching-chuan-prod.tsx`](examples/03-3-tanstack-query-v5-managed-fetching-chuan-prod.tsx)

`staleTime` vs `gcTime`: staleTime = bao lâu coi "tươi" (không fetch lại khi mount); gcTime = bao lâu giữ cache sau unmount (hết thì xóa, vào lại loading từ đầu). `isPending` (v5) = chưa có data; `isLoading` = đang fetch + chưa có data — tách rõ để skeleton đúng. `select` biến đổi data trong query (khỏi `useMemo` tay); `placeholderData: keepPreviousData` giữ trang cũ khi đổi page.

> **Tóm gọn 1 câu:** Prod đừng tự lo cache/loading/dedupe — `useQuery` là đường ống nước đã lắp sẵn, bạn chỉ cần khai báo `queryKey` + `queryFn`.

### 4. `use()` (React 19) + Suspense — đọc Promise trong render
Component "suspend" tới khi promise resolve; `<Suspense fallback>` hiện trong lúc chờ. Dành cho framework (Next.js Server Components fetch trực tiếp `async function`) hoặc promise local đã có. SPA Vite thuần vẫn dùng TanStack Query là chính. Ví von: giống như đưa cho React "phiếu chờ món" — React treo tấm biển "đang chế biến" (fallback) và quay lại vẽ khi món ra.

> 📄 **Code ví dụ:** [`examples/04-4-use-react-19-suspense-oc-promise-trong.tsx`](examples/04-4-use-react-19-suspense-oc-promise-trong.tsx)

> **Tóm gọn 1 câu:** `use()` + Suspense cho phép "đợi" promise ngay trong render — React tự hiện fallback, bạn khỏi viết state loading tay.

### 5. Server Components (ổn định 2026, framework-only)
`async function Page() { const data = await fetch(...); return <ul>... }` chạy trên server, không effect, không loading state tay. Chỉ trong Next.js/framework — tutorial SPA Vite không dùng, nhưng cần biết để không mang effect-fetch sang Server Component. Hãy hình dung: thay vì bạn chạy ra "cửa hàng" (server) lấy đồ rồi bưng về bếp, bạn gửi đơn trực tiếp từ bếp chính — đồ về tới nơi là đã sẵn sàng bày.

> **Tóm gọn 1 câu:** Server Components cho phép `await` dữ liệu ngay trong component chạy trên server — chỉ dùng trong framework, đừng lẫn sang SPA thuần.

### Keyword chính
`fetch` (Promise) + `AbortController`/`signal`/`AbortError`, `r.ok` check, `useQuery`/`queryKey`/`queryFn`/`staleTime`/`gcTime`/`retry`/`select`/`placeholderData`, `QueryClientProvider`, `useMutation` + `invalidateQueries`, `use()` + `Suspense`, dedupe/cache.

> **Tóm gọn 1 câu:** Đây là "từ vựng tối thiểu" của data fetching — thuộc trước, đọc code sau.

## Luồng hoạt động (Flow)
Mục này đi qua từng bước dữ liệu di chuyển từ server tới màn hình — đọc để biết thứ tự xảy ra chuyện gì, từ lúc component mount tới khi dữ liệu hiện lên.
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

> **Tóm gọn 1 câu:** Dữ liệu đi một đường thẳng: mount → fetch/query → state hoặc cache → vẽ; hủy đúng lúc ở các bước chuyển (unmount, đổi url, đổi key) là không bao giờ race.

## Ví dụ chi tiết
Mục này ghép các mảnh trên thành code hoàn chỉnh để copy về chạy thử — đọc kèm `example.tsx` trong thư mục để soi từng dòng.
Khớp 1-1 với `example.tsx` (manual + deps `[url]` + empty state):

> 📄 **Code ví dụ:** [`examples/05-vi-du-chi-tiet.tsx`](examples/05-vi-du-chi-tiet.tsx)

TanStack Query v5 đầy đủ (copy vào prod):

> 📄 **Code ví dụ:** [`examples/06-vi-du-chi-tiet.tsx`](examples/06-vi-du-chi-tiet.tsx)

Provider + cấu hình toàn cục (`main.tsx` — tạo client 1 lần):

> 📄 **Code ví dụ:** [`examples/07-vi-du-chi-tiet.tsx`](examples/07-vi-du-chi-tiet.tsx)

Mutation + invalidate (thêm/sửa/xóa xong refetch list):

> 📄 **Code ví dụ:** [`examples/08-vi-du-chi-tiet.tsx`](examples/08-vi-du-chi-tiet.tsx)

## Giải thích từng phần
Mục này soi từng dòng code quan trọng ở ví dụ trên — đọc khi bạn thắc mắc "vì sao lại viết thế này mà không thế khác".
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
Mục này là "từ điển đối chiếu" cho người quen Angular: bên trái là thói quen cũ, bên phải là mảnh thay thế trong React.

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

> **Cách đọc bảng này:** đọc theo từng dòng — mỗi dòng là một thói quen Angular ở cột trái, tìm mảnh thay thế tương đương ở cột React, cột Ghi chú nói ngắn gọn điểm khác biệt chính. Đối chiếu dọc khi cần chuyển một tính năng cụ thể, đừng học thuộc cả bảng.

## Lỗi thường gặp (Common pitfalls)
Mục này là "bản đồ bẫy" — những chỗ người mới sập nhiều nhất. Đọc trước để đừng mất tối debug sau.

### 1. SetState sau unmount (không AbortController)
> 📄 **Code ví dụ:** [`examples/09-1-setstate-sau-unmount-khong-abortcontroller.tsx`](examples/09-1-setstate-sau-unmount-khong-abortcontroller.tsx)
> 📄 **Code ví dụ:** [`examples/10-1-setstate-sau-unmount-khong-abortcontroller.tsx`](examples/10-1-setstate-sau-unmount-khong-abortcontroller.tsx)

### 2. Quên check `r.ok` → 404 hiện như data đúng
> 📄 **Code ví dụ:** [`examples/11-2-quen-check-r-ok-404-hien-nhu.tsx`](examples/11-2-quen-check-r-ok-404-hien-nhu.tsx)
> 📄 **Code ví dụ:** [`examples/12-2-quen-check-r-ok-404-hien-nhu.tsx`](examples/12-2-quen-check-r-ok-404-hien-nhu.tsx)

### 3. Deps là string nối mỗi render → refetch vô tận
> 📄 **Code ví dụ:** [`examples/13-3-deps-la-string-noi-moi-render-refetch.tsx`](examples/13-3-deps-la-string-noi-moi-render-refetch.tsx)
> 📄 **Code ví dụ:** [`examples/14-3-deps-la-string-noi-moi-render-refetch.tsx`](examples/14-3-deps-la-string-noi-moi-render-refetch.tsx)

### 4. Tự viết effect-fetch cho server state ở prod
Mô tả: tự lo cache/retry/dedupe/stale/focus/pagination — dễ sai từng cái. Fix: TanStack Query/SWR cho server state; effect chỉ cho hệ thống ngoài (timer/socket/DOM) theo quy tắc DAY 15.

### 5. Không bọc `QueryClientProvider`
Mô tả: `useQuery` ném "No QueryClient set, use QueryClientProvider". Fix: `new QueryClient()` 1 lần + bọc ở `main.tsx` (xem mẫu trên).

### 6. Key chung cho 2 tham số khác nhau
> 📄 **Code ví dụ:** [`examples/15-6-key-chung-cho-2-tham-so-khac.tsx`](examples/15-6-key-chung-cho-2-tham-so-khac.tsx)
> 📄 **Code ví dụ:** [`examples/16-6-key-chung-cho-2-tham-so-khac.tsx`](examples/16-6-key-chung-cho-2-tham-so-khac.tsx)

### 7. Tạo `QueryClient` mỗi render → mất cache
> 📄 **Code ví dụ:** [`examples/17-7-tao-queryclient-moi-render-mat-cache.tsx`](examples/17-7-tao-queryclient-moi-render-mat-cache.tsx)
> 📄 **Code ví dụ:** [`examples/18-7-tao-queryclient-moi-render-mat-cache.tsx`](examples/18-7-tao-queryclient-moi-render-mat-cache.tsx)

### 8. `useQuery` trong điều kiện/vòng lặp
Mô tả: vi phạm rules of hooks ("Rendered more hooks..."). Fix: tách component con nhận tham số (`<UserDetail id={id} />` gọi `useQuery` top-level), hoặc `enabled: !!id` để chờ đủ điều kiện mà vẫn gọi hook.

## Best practices / Mẹo
Mục này là "tủ đồ chuyên nghiệp": cách phân loại state, cấu hình tập trung, và các cú đánh gọn để code prod sạch hơn — đọc để nâng cấp từ "chạy được" lên "chạy đẹp".
- **Phân loại state:** server state (users/products — cache/retry/dedupe) → TanStack Query; client state sinh từ server (cart/filter/toggle) → Zustand/Context. Vì sao? Vì trộn là tự viết lại cache cho cart và tự lo realtime cho users — sai cả hai.
- `queryFn` chung bọc fetch có check `r.ok` + parse — tái dùng, dễ mock (MSW DAY 21). Vì sao chung? Để 20 query không lặp 20 lần check `ok`.
- `select` biến đổi trong query (khỏi `useMemo` tay); `placeholderData: keepPreviousData` cho page mượt (giữ trang cũ khi đổi page). Vì sao? Vì derived từ data nên tính ở nguồn, không copy vào state.
- Mutation `useMutation` + `invalidateQueries` thay "refetch tay sau thêm". Vì sao? Để mọi nơi đọc key đó tự cập nhật, không gọi `refetch` rời rạc.
- **Cấu hình 1 lần** (`staleTime`, `retry`, `refetchOnWindowFocus`) ở `QueryClient` thay vì lặp mỗi `useQuery`. Vì sao? Để đổi chính sách 1 chỗ.
- **`queryKey` cấu trúc** (`["users", { page, q }]`) — invalidate nhóm (`{ queryKey: ["users"] }`) trúng cả nhóm. Vì sao cấu trúc? Để refetch theo nhóm (mọi page users) hoặc chính xác (page 2) tùy ý.
- Optimistic (`onMutate` set cache trước, `onError` rollback) cho UX nhanh — nhưng viết rollback đúng, không lạc quan mù.

## Bài tập nhỏ
Làm tay để nhớ — mỗi bài kéo một mảnh ở trên ra luyện: chuyển từ manual sang TanStack, rồi mutation, rồi phân trang.

1. Chuyển Users sang TanStack: nút Refetch (`refetch()`), bọc Provider — đổi `staleTime` 5s/30s, remount quan sát khác biệt (loading lại hay hiện cache).
2. `useMutation` thêm user (POST) + `invalidateQueries(["users"])` — kiểm tra list tự cập nhật từ server (không set tay).
3. Phân trang `queryKey: ["users", page]` + `placeholderData: keepPreviousData` — đổi trang, quan sát data cũ giữ (không skeleton) rồi thay bằng trang mới.
4. `useMutation` xóa + invalidate — kiểm tra list tự cập nhật sau xóa, và `retry: false` trong test để không chờ retry.
5. Bọc Provider trong test với `retry: false` (DAY 21), viết test loading (skeleton) → success (list) → error (alert) cho query.

> **Tóm gọn 1 câu:** Ghi nhớ cả bài trong 1 nhịp: tự fetch thì phải có AbortController + check `r.ok`; prod thì giao hết cho TanStack Query với `queryKey` làm địa chỉ cache.

## Reference
- https://react.dev/reference/react/use
- https://tanstack.com/query/latest
- https://react.dev/reference/react/useEffect
