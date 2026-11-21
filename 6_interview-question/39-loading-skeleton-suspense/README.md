# Q39: Data API chưa về, em cho hiện khung chờ hay cứ để trống? Khi nào dùng Suspense?

## Câu hỏi

> Component nhận data từ API (chưa có / đang tải / có rồi / lỗi) — nên render thẳng, hay chờ "data sẵn sàng" rồi mới mount?
> Loading skeleton (shimmer) nên gắn ở tầng nào (route, widget, page), và khi nào thì `suspense` + `React.lazy` hợp lý hơn "loading state tự quản"?
> Khác Angular (NgRx + `async` pipe, `show loading` ở template) ở điểm nào?

## Trả lời ngắn (elevator pitch, 30 giây)

Mục này là "bản nói 30 giây" — chọn đúng 1 trong 3 phương án khung chờ là đã ăn điểm tư duy UX; phần chi tiết bên dưới để đỡ khi bị hỏi đào.

- Data chưa về thì đừng vẽ thẳng, chọn 1 trong 3: **khung skeleton cố định** khi biết trước layout; **Suspense + lazy** cho vùng không cần ngay (route, widget); **spinner đơn giản** khi chỉ có một vùng chờ.
- 2026: lazy theo route để phần đầu nhẹ + Suspense cho vùng phụ (sidebar, gợi ý, biểu đồ) — skeleton chính là `fallback` của Suspense, không làm lệch layout.
- Combo chuẩn lấy data: TanStack Query + Suspense.

## Trả lời chi tiết

Mục này xếp sẵn 3 "tầng chờ" (route, widget, ô nhỏ) để bạn dò theo loại component, rồi bổ sung vai trò của skeleton và combo Query + Suspense — đọc để biết "gắn biển đang tải ở đâu" thay vì "có chờ là treo spinner".

### 1. 3 tầng "sẵn sàng" — chọn theo loại component

| Loại component | Cách chuẩn | Vì sao |
|---|---|---|
| **Route** (mất trang) | `React.lazy` + `Suspense` (fallback = skeleton **toàn route**) | "Data = route chunk" (Q23, "code split critical<200KB") |
| **Widget (không cần ngay)** | `Suspense` (fallback = skeleton **widget**) | "Vùng có thể hoãn" (Q29, "không block page load") |
| **Ô input / form (data quan trọng, nhỏ)** | **Conditional render** (loading spinner) — "không cần Suspense" | "Đắt (suspense) cho 1 ô = overkill" |

> **Cách đọc bảng này:** mỗi dòng là một loại component xếp từ to đến nhỏ; cột "Cách chuẩn" là phương án nên chọn, cột "Vì sao" là lý do được hỏi kèm — dò theo đúng loại component bạn đang xử lý, đừng dùng một phương án cho cả ba tầng.

**Điểm ăn điểm**: "Suspense là 'lazy + skeleton' — **không phải 'loading state chung cho tất cả'**. Chỉ dùng cho **unit có thể lazy** (route, widget lớn), không 'nên wrap mọi fetch bằng Suspense'".

### 2. Skeleton (shimmer) — "nên có" để tránh CLS (layout shift)

> 📄 **Code ví dụ:** [`examples/01-2-skeleton-shimmer-nen-co-e-tranh-cls.tsx`](examples/01-2-skeleton-shimmer-nen-co-e-tranh-cls.tsx)

**"Skeleton = chống CLS"** (Web Vitals: **CLS < 0.1**): khi data về, **layout không đổi** (card skeleton có đúng kích thước card thật). **Bẫy**: "skeleton kích thước không khớp" → **layout shift** (CLS cao, "giật"). Ví von: skeleton giống như đặt bát đũa đúng vị trí trước khi món ăn được bưng ra — khách ngồi yên đợi, không ai phải dời chén khi món tới; bát sai cỡ là cả bàn phải "dịch chuyển" — đó chính là layout shift.

### 3. `Suspense` + `React.lazy` (route + widget)

> 📄 **Code ví dụ:** [`examples/02-3-suspense-react-lazy-route-widget.tsx`](examples/02-3-suspense-react-lazy-route-widget.tsx)

**"Khi nào hợp lý hơn 'loading state tự quản'"**:
- **Route**: `lazy` (code split) — "chưa cần 'loading state' (loading = fetch chunk, không fetch data)"
- **Widget lớn (chart, map)**: `Suspense` — "widget có thể hoãn (Q29, 'đắt được hoãn')"
- **Ô nhỏ (input, list 5 dòng)**: "conditional render (loading spinner) — 'đơn giản hơn, không cần Suspense'"

### 4. TanStack Query + `Suspense` (combo 2026, "data fetch state-driven")

> 📄 **Code ví dụ:** [`examples/03-4-tanstack-query-suspense-combo-2026-data-fetch.tsx`](examples/03-4-tanstack-query-suspense-combo-2026-data-fetch.tsx)

**"Khác Angular (NgRx + async pipe)"**: NgRx = **stream** (observable, `async pipe`); TanStack = **state-driven** (cache, invalidate — Q32) + React render. **Không có 'async pipe' built-in React** — **TanStack Query + Suspense = "gần nhất"** ("nói được = ăn điểm").

### 5. "Không render thẳng khi chưa có data" — các "bẫy thường gặp"

| Sai | Đúng |
|---|---|
| "Render thẳng, data là null, không có 'ready check'" → **flash UI rỗng** | **Skeleton / conditional (loading)** — "UI luôn 'có gì đó'" (tránh "blink trắng") |
| "Skeleton không đúng kích thước" → **CLS (layout shift)** | **Skeleton có size cố định** (Web Vitals: CLS < 0.1) |
| "Wrap mọi fetch bằng Suspense (kể cả ô nhỏ)" → "thừa (overhead)" | "Chỉ 'unit lazy' (route, widget lớn) dùng Suspense — ô nhỏ = conditional (spinner)" |
| "Loading state = 1 flag `isLoading` (3 flag rời — Q35)" | **discriminated union** (idle/loading/success/error, Q35) — "tránh 'data undefined khi loading'" |

> **Cách đọc bảng này:** mỗi dòng là một cặp "làm sai ↔ làm đúng"; cột Sai mô tả phản xạ thường gặp, cột Đúng là cách xử lý chuẩn kèm lý do — đọc cả bảng như checklist review trước khi xong feature.

## Bẫy khi phỏng vấn

Mục này là "bản đồ mìn": 4 câu trả lời nghe hợp lý nhưng sai — đây cũng là chỗ người phỏng vấn hay trộn lẫn "lazy" với "loading data".

1. **"Suspense = loading state cho tất cả"** → **sai** (chỉ "unit lazy" (route, widget lớn) — ô nhỏ = conditional, "đơn giản hơn").
2. **"Skeleton không quan trọng (chỉ visual)"** → **sai** (Skeleton = **chống CLS** (Web Vitals: CLS<0.1) — "layout không nhảy khi data về").
3. **"`React.lazy` = code split (Q23), không 'loading data'"** → "phân biệt" (lazy = "nạp chunk (JS)", data = "fetch API" (Q20) — "khác nhau").
4. **"React có 'async pipe' như Angular"** → **sai** (ngRx stream (RxJS); React "state-driven" (TanStack) + Suspense — "không có async pipe built-in").

> **Tóm gọn 1 câu:** Data chưa về thì đừng để khán giả nhìn sân khấu trống — treo đúng một tấm bạt skeleton đúng khung ở đúng khu đang chờ, và nhớ `lazy` là nạp JS còn Suspense là vẽ chỗ trống.

## Gợi ý câu chốt

Mục này gói cả bài thành một đoạn trả lời mẫu — đọc để tập nói trọn một hơi rồi diễn đạt lại bằng giọng của mình.

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
