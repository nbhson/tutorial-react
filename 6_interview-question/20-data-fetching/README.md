# Q20: Cần đổ danh sách user từ API lên màn hình, đoạn lấy data em viết thế nào?

## Câu hỏi

> Mấy cách lấy data từ API trong React, và cách nào viết cho đúng (abort khi unmount, xử lý lỗi, tránh race)?
> Khi nào thì không nên tự viết nữa mà chuyển sang TanStack Query? So với `HttpClient` của Angular thì sao?

## Trả lời ngắn (elevator pitch, 30 giây)
- 3 tầng theo quy mô: tự viết `fetch` + `useEffect` để học cơ chế; production dùng TanStack Query (cache, chống gọi trùng, thử lại, tự refresh có sẵn); dự án Next.js mới dùng `use()` + Suspense.
- Tự viết thì nhớ 4 điểm: AbortController + signal để hủy, check `!r.ok` (fetch không tự báo lỗi 4xx/5xx), bỏ qua lỗi AbortError, cleanup abort khi unmount.
- Effect tự viết không lo được cache/dedupe/stale — càng viết càng sai, đó là lý do production dùng Query.

## Trả lời chi tiết

### 1. Ba tầng, chọn theo quy mô

| Tầng | Khi nào | Ghi chú |
|---|---|---|
| `fetch` + `useEffect` | Học cơ chế, app demo cực nhỏ | Bắt buộc đủ 4 điểm contract (§2) — thiếu là race/rò |
| **TanStack Query v5** | **Production (chuẩn 2026)** | Cache/dedupe/retry/stale/focus làm sẵn — server state |
| `use()` + Suspense / RSC | Framework (Next.js), promise có sẵn | Component "suspend" tới khi resolve; SPA Vite không bắt buộc |

**Nguyên tắc nền**: server state (dữ liệu API) ≠ client state (Zustand/Context, DAY 8). Đừng nhét data API vào store rồi tự viết lại cache/retry.

### 2. `useEffect` + `fetch` — contract 4 điểm (nói được 4 điểm = ăn điểm)

```tsx
useEffect(() => {
  const ctrl = new AbortController();                       // (a) bộ hủy
  fetch(url, { signal: ctrl.signal })
    .then((r) => {                                          // (b) fetch KHÔNG reject HTTP lỗi
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json();
    })
    .then(setData)
    .catch((e: Error) => {                                  // (c) abort ≠ lỗi thật
      if (e.name !== "AbortError") setError(String(e));
    });
  return () => ctrl.abort();                                 // (d) cleanup khi unmount/url đổi
}, [url]);
```

- (a)+(d): không có là request "treo" khi component unmount hoặc `url` đổi → **race** (cái chậm về sau ghi đè cái mới) + tốn băng thông.
- (b): `fetch` chỉ reject khi **mạng/CORS** — 404/500 vẫn `resolve` với `ok: false`. Không check là hiện trang lỗi như data đúng.
- (c): abort là **hủy chủ đích**, hiện `AbortError` ra UI = báo động giả khi user chuyển trang nhanh.

> Vì sao dev StrictMode "lộ" thiếu cleanup: mount → effect → cleanup → effect. Không abort thì 2 request song song, `setData` 2 lần. Cleanup đúng thì request đầu bị abort sạch.

### 3. TanStack Query — quản lý, không viết tay

```tsx
const { data, isPending, error, refetch } = useQuery({
  queryKey: ["users", page],            // địa chỉ cache + dedupe (cùng key = 1 request)
  queryFn: () => fetch(`/api/users?page=${page}`).then((r) => {
    if (!r.ok) throw new Error(`HTTP ${r.status}`);   // vẫn phải throw
    return r.json();
  }),
  staleTime: 30_000,   // 30s "tươi": remount trong 30s = hiện cache ngay, không fetch
  retry: 2,            // lỗi mạng tự retry (không retry AbortError)
});
```

| Tính năng | `useEffect` + `fetch` (tự viết) | TanStack Query |
|---|---|---|
| Cache sau unmount | Không (state chết cùng component) | Giữ tới `gcTime` (mặc định 5') — quay lại hiện ngay |
| 2 component cùng data | 2 request | **Dedupe**: 1 request, cùng cache |
| Lỗi mạng | Tự viết retry/backoff | `retry` + `retryDelay` |
| User focus lại tab | Không | `refetchOnWindowFocus` (refetch nền nếu stale) |
| Phân trang mượt | Skeleton mỗi lần đổi page | `placeholderData: keepPreviousData` |

**`QueryClient` tạo 1 lần** (module/`main.tsx`) — tạo trong render là cache chết mỗi lần, mọi query loading mãi.

### 4. Đối chiếu Angular (điểm ăn điểm cho người từ Angular)

| Angular | React | Ghi chú |
|---|---|---|
| `HttpClient.get()` → **Observable** | `fetch()` → **Promise** | Stream (nhiều emit, unsubscribe) ↔ 1 lần resolve (AbortController) |
| `subscribe` / `async` pipe | `useEffect` + 3 state / `useQuery` | Data React là state thường, không pipe |
| `HttpInterceptor` (header/log/retry tập trung) | wrapper fetch / axios instance | Tự viết tầng giữa, 1 file |
| RxJS `retry`, `switchMap`, `catchError` | Query options (`retry`, `select`, `placeholderData`) | **Khai báo thay vì chain operators** |
| Guard/resolver (chờ data trước route) | router loader (`queryClient.fetchQuery`) / `use()` + Suspense | Data sẵn trước khi vẽ route |

> **Nói đúng câu chốt**: "Angular tự động hóa bằng **stream** (unsubscribe, switchMap tự hủy request cũ); React tự động hóa bằng **query state có sẵn trong Query** (abort, dedupe, cache). Cùng mục tiêu, hai cơ chế khác nhau."

## Bẫy khi phỏng vấn

1. **"Nói `fetch` tự reject khi API trả 404"** → **sai**: reject chỉ khi mạng/CORS; HTTP lỗi phải check `r.ok` tay (cả trong `queryFn`).
2. **"Quên cleanup AbortController — có sao không?"** → có: race khi đổi url nhanh + request treo + `setState` sau unmount (warning React cũ, lãng phí hiện). Viết đúng = đối xứng setup/cleanup.
3. **"Prod dùng `useEffect` + `fetch` cho server state"** → đúng cơ chế nhưng sai chuẩn: tự viết lại cache/retry/dedupe/stale, sai từng cái — Query làm sẵn (Q21).
4. **"Nhét data API vào Zustand"** → mất cache/retry/dedupe; server state = Query, client state (filter, cart) = Zustand (DAY 8).
5. **"Hai page cùng data → 2 request"** → sai nếu dùng Query: dedupe theo `queryKey`. Và **key phải đủ chi tiết** (`["users", page]`) — key chung cho 2 page = sai cache (page 2 hiện cache page 1).

## Gợi ý câu chốt

> "3 tầng: `useEffect` + `fetch` (học, 4 điểm: AbortController, check `r.ok`, bỏ qua AbortError, cleanup), TanStack Query (prod: cache/dedupe/retry/staleTime/gcTime/focus-refetch, `queryKey` là địa chỉ cache), `use()` + Suspense (framework). Server state để Query, client state để store. Khác Angular: HttpClient stream (unsubscribe/switchMap) ↔ fetch promise (AbortController); interceptor ↔ wrapper; guard resolver ↔ router loader."

## Reference

- [`3_react-tutorial/12-data-fetching`](../../3_react-tutorial/12-data-fetching) — 3 tầng fetch, contract 4 điểm, TanStack Query v5, bảng Angular↔React
- [`3_react-tutorial/12-data-fetching/question-answer.md`](../../3_react-tutorial/12-data-fetching/question-answer.md) — hỏi & đáp chi tiết
- [`5_react-crud-jsonplaceholder`](../../5_react-crud-jsonplaceholder) — project CRUD dùng Query + mutation mirror cache (chuẩn prod)
- Q21 (chưa có response mà user đi trang khác) — hệ quả của cleanup/abort, so "Query để request chạy tiếp"
- Q15 (external store) — vì sao server state không nhét vào Zustand

## Câu hỏi liên quan

- **Hỏi tiếp (liên tục)**: [Q21 — API chưa về mà user đổi trang thì sao?](../21-abort-on-navigate/README.md) · [Q32 — mutation (xóa/sửa) thì cập nhật cache bằng gì?](../32-query-mutations/README.md)
- **Đào sâu (xuyên nhóm)**: [Q22 — mọi request tự động gắn token, xử lý 401 (interceptor)?](../22-interceptor/README.md) · [Q36 — data layer (Query/interceptor) đặt ở layer nào trong kiến trúc?](../36-architecture-code-org/README.md)
