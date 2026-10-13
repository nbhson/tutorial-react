# Q39: Data API chưa về, em cho hiện khung chờ hay cứ để trống? Khi nào dùng Suspense?

## Câu hỏi

> Component nhận data từ API (chưa có / đang tải / có rồi / lỗi) — nên render thẳng, hay chờ "data sẵn sàng" rồi mới mount?
> Loading skeleton (shimmer) nên gắn ở tầng nào (route, widget, page), và khi nào thì `suspense` + `React.lazy` hợp lý hơn "loading state tự quản"?
> Khác Angular (NgRx + `async` pipe, `show loading` ở template) ở điểm nào?

## Trả lời ngắn (elevator pitch, 30 giây)
- Data chưa về thì đừng vẽ thẳng, chọn 1 trong 3: **khung skeleton cố định** khi biết trước layout; **Suspense + lazy** cho vùng không cần ngay (route, widget); **spinner đơn giản** khi chỉ có một vùng chờ.
- 2026: lazy theo route để phần đầu nhẹ + Suspense cho vùng phụ (sidebar, gợi ý, biểu đồ) — skeleton chính là `fallback` của Suspense, không làm lệch layout.
- Combo chuẩn lấy data: TanStack Query + Suspense.

## Trả lời chi tiết

### 1. 3 tầng "sẵn sàng" — chọn theo loại component

| Loại component | Cách chuẩn | Vì sao |
|---|---|---|
| **Route** (mất trang) | `React.lazy` + `Suspense` (fallback = skeleton **toàn route**) | "Data = route chunk" (Q23, "code split critical<200KB") |
| **Widget (không cần ngay)** | `Suspense` (fallback = skeleton **widget**) | "Vùng có thể hoãn" (Q29, "không block page load") |
| **Ô input / form (data quan trọng, nhỏ)** | **Conditional render** (loading spinner) — "không cần Suspense" | "Đắt (suspense) cho 1 ô = overkill" |

**Điểm ăn điểm**: "Suspense là 'lazy + skeleton' — **không phải 'loading state chung cho tất cả'**. Chỉ dùng cho **unit có thể lazy** (route, widget lớn), không 'nên wrap mọi fetch bằng Suspense'".

### 2. Skeleton (shimmer) — "nên có" để tránh CLS (layout shift)

```tsx
// "Skeleton có kích thước CHẮC CHẮN (khó CLS 0)"
function SkeletonCard() {
  return <div className="card skeleton" />; // width/height cố định (không "nhảy" khi data về)
}
// "data về → thay skeleton bằng card thật" (Suspense fallback = SkeletonCard)
```

**"Skeleton = chống CLS"** (Web Vitals: **CLS < 0.1**): khi data về, **layout không đổi** (card skeleton có đúng kích thước card thật). **Bẫy**: "skeleton kích thước không khớp" → **layout shift** (CLS cao, "giật").

### 3. `Suspense` + `React.lazy` (route + widget)

```tsx
// "Route lazy (Q23, critical<200KB)"
const AdminPage = React.lazy(() => import("./AdminPage"));
<Suspense fallback={<SkeletonAdmin />}>
  <AdminPage />
</Suspense>
// "Widget không cần ngay (suggestion, chart)"
const Suggestion = React.lazy(() => import("./Suggestion"));
<Suspense fallback={<SkeletonList />}>
  <Suggestion />
</Suspense>
```

**"Khi nào hợp lý hơn 'loading state tự quản'"**:
- **Route**: `lazy` (code split) — "chưa cần 'loading state' (loading = fetch chunk, không fetch data)"
- **Widget lớn (chart, map)**: `Suspense` — "widget có thể hoãn (Q29, 'đắt được hoãn')"
- **Ô nhỏ (input, list 5 dòng)**: "conditional render (loading spinner) — 'đơn giản hơn, không cần Suspense'"

### 4. TanStack Query + `Suspense` (combo 2026, "data fetch state-driven")

```tsx
// "Query (Q20, Q32) + Suspense (loading state)"
function usePosts(id) {
  const q = useQuery({ queryKey: ["posts", id], queryFn: () => fetchPost(id) });
  if (q.isPending) throw q.promise;       // "suspense: chưa có → fallback"
  if (q.isError) throw q.error;           // "error boundary (Q 'error handling')"
  return q.data;
}
// "data có → render, chưa có → Suspense fallback (skeleton)"
```

**"Khác Angular (NgRx + async pipe)"**: NgRx = **stream** (observable, `async pipe`); TanStack = **state-driven** (cache, invalidate — Q32) + React render. **Không có 'async pipe' built-in React** — **TanStack Query + Suspense = "gần nhất"** ("nói được = ăn điểm").

### 5. "Không render thẳng khi chưa có data" — các "bẫy thường gặp"

| Sai | Đúng |
|---|---|
| "Render thẳng, data là null, không có 'ready check'" → **flash UI rỗng** | **Skeleton / conditional (loading)** — "UI luôn 'có gì đó'" (tránh "blink trắng") |
| "Skeleton không đúng kích thước" → **CLS (layout shift)** | **Skeleton có size cố định** (Web Vitals: CLS < 0.1) |
| "Wrap mọi fetch bằng Suspense (kể cả ô nhỏ)" → "thừa (overhead)" | "Chỉ 'unit lazy' (route, widget lớn) dùng Suspense — ô nhỏ = conditional (spinner)" |
| "Loading state = 1 flag `isLoading` (3 flag rời — Q35)" | **discriminated union** (idle/loading/success/error, Q35) — "tránh 'data undefined khi loading'" |

## Bẫy khi phỏng vấn

1. **"Suspense = loading state cho tất cả"** → **sai** (chỉ "unit lazy" (route, widget lớn) — ô nhỏ = conditional, "đơn giản hơn").
2. **"Skeleton không quan trọng (chỉ visual)"** → **sai** (Skeleton = **chống CLS** (Web Vitals: CLS<0.1) — "layout không nhảy khi data về").
3. **"`React.lazy` = code split (Q23), không 'loading data'"** → "phân biệt" (lazy = "nạp chunk (JS)", data = "fetch API" (Q20) — "khác nhau").
4. **"React có 'async pipe' như Angular"** → **sai** (ngRx stream (RxJS); React "state-driven" (TanStack) + Suspense — "không có async pipe built-in").

## Gợi ý câu chốt

> "Component nhận data từ API: **không render thẳng (flash rỗng)** — 'chọn 1 tầng ready': (1) **Skeleton** (layout cố định, CLS<0.1 — Web Vitals), (2) **Suspense + React.lazy** (route, widget lớn — 'đơn vị lazy' (Q23)), (3) **Conditional (loading spinner)** (ô nhỏ, đơn giản). **Combo 2026**: TanStack Query (Q20, Q32 — state-driven, cache) + Suspense (fallback = skeleton). **Khác Angular**: NgRx = stream (async pipe); React = state + Suspense (không async pipe built-in). **Bẫy**: 'Suspense cho mọi fetch (thừa)', 'skeleton không khớp size (CLS)'. **Điểm ăn điểm**: 'lazy (JS) ≠ data (API)' (Q23 vs Q20)."

## Reference

- [`20-data-fetching`](../20-data-fetching/README.md) — "Lấy data từ API, useState/useEffect, khi nào TanStack Query"
- [`32-query-mutations`](../32-query-mutations/README.md) — "Query + invalidate / optimistic (cache) + Suspense"
- [`23-bundle-size`](../23-bundle-size/README.md) — "React.lazy (code split), critical<200KB"
- [`29-concurrency-transition-deferred`](../29-concurrency-transition-deferred/README.md) — "Widget có thể hoãn (transition)"
- [`35-type-safety`](../35-type-safety/README.md) — "Discriminated union (idle/loading/success/error), không 3 flag"
- Web Vitals (LCP, **INP**, **CLS** — "CLS<0.1", skeleton chống layout shift)
- [TanStack Query + Suspense docs](https://tanstack.com/query/latest/docs/framework/react/with-suspense)

## Câu hỏi liên quan

- **Hỏi tiếp (liên tục)**: [Q20 — fetch data bằng gì?](../20-data-fetching/README.md) · [Q23 — code split + React.lazy?](../23-bundle-size/README.md)
- **Đào sâu (xuyên nhóm)**: [Q32 — mutation + invalidate (cache)?](../32-query-mutations/README.md) · [Q29 — widget có thể hoãn (transition)?](../29-concurrency-transition-deferred/README.md) · [Q35 — discriminated union (state fetch)?](../35-type-safety/README.md)
