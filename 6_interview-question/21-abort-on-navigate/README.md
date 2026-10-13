# Q21: Đang gọi API mà user chuyển trang khác, request dở dang đó em xử lý sao?

## Câu hỏi

> Component đang fetch (response chưa về) mà user click sang trang khác thì request bị hủy không? Data mất không?
> TanStack Query thì xử lý ra sao? So với Angular (`takeUntil`…) thì sao?

## Trả lời ngắn (elevator pitch, 30 giây)
- Tự viết mà unmount không abort thì request vẫn chạy nền: tốn tài nguyên, dễ race. Cleanup `return () => controller.abort()` là bắt buộc.
- TanStack Query thì ngược lại: unmount **không hủy** mà để request chạy tiếp, kết quả cất vào cache — quay lại trang trong vài phút là hiện ngay, khỏi tải lại.
- Muốn hủy thật trong Query thì gọi `cancelQueries`. Mặc định "chạy tiếp + cache" là cố ý để UX mượt, không phải bug.

## Trả lời chi tiết

### 1. Case A: manual, viết ĐÚNG (abort trong cleanup)

```tsx
useEffect(() => {
  const ctrl = new AbortController();
  fetch(url, { signal: ctrl.signal })
    .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
    .then(setData)
    .catch((e: Error) => { if (e.name !== "AbortError") setError(String(e)); });
  return () => ctrl.abort();   // ← user navigate đi: cleanup chạy, request HỦY
}, [url]);
```

Hành vi khi user đi: (1) component unmount → cleanup → `ctrl.abort()`; (2) `fetch` reject với `AbortError`; (3) catch **lọc bỏ** AbortError (không hiện "Lỗi: AbortError" giả); (4) **không** có `setState` trên component đã chết. Giá: **data không được lưu ở đâu** — quay lại trang là fetch mới (vì state nằm trong component, chết cùng component).

### 2. Case B: manual, QUÊN cleanup (điểm ăn điểm nếu nêu được)

Request **vẫn chạy tới hết** (AbortController chưa từng được tạo). Response về → `setData` → component đã unmount → React 18+ **không còn warning** nữa (đã bỏ), nhưng:
- Lãng phí băng thông cho data không ai xem.
- **Race kinh điển khi `url` đổi nhanh** (không phải unmount): request cũ (chậm) về *sau* request mới → ghi đè data mới bằng data cũ. Cleanup `abort()` của hiệu ứng cũ chính là cách chặn — nên cleanup không chỉ là "sạch sẽ", là **sống còn** với url-dependent effect.

### 3. Case C: TanStack Query (hành vi MẶC ĐỊNH, khác A/B)

```tsx
// Unmount component gọi useQuery(["posts", limit]) — request KHÔNG bị abort
// (đang active thì QueryClient giữ cho chạy tới khi settle, kết quả vào cache)
const { data, isPending } = useQuery({
  queryKey: ["posts", limit],
  queryFn: fetchPosts,
  gcTime: 5 * 60_000,   // giữ cache 5' sau unmount (mặc định)
});
```

Trình tự user "đang tải → click sang trang khác → quay lại":

1. Unmount: observer cuối cùng biến mất, **query active chạy tiếp nền** (đặc tính Query, không phải bug).
2. Response về → đổ vào **cache** (dù không có ai render).
3. Quay lại: `queryKey` giống → **đọc cache ngay** (render data tức thì, không skeleton); nếu data `stale` (hết `staleTime`) → **refetch nền**, UI vẫn giữ data cũ (`placeholderData` / cache hiện trước).
4. Chỉ khi quá `gcTime` (mặc định 5') → cache bị thu hồi → lần quay lại mới là loading từ đầu.

**Nếu muốn hủy request khi user đi thật sự** (tiết kiệm, ví dụ request đắt): `qc.cancelQueries({ queryKey: ["posts"], type: "active" })` ở router/unmount — đây là lựa chọn **thủ công**, không phải mặc định.

### 4. `use()` + Suspense (framework)

Promise truyền xuống component đang suspend: component unmount → **prompt bị bỏ, không ai chờ nữa** — nhưng `fetch` bên dưới *không tự abort* (không có AbortController ai gắn) → request vẫn chạy hết ở tầng mạng. Khác manual chỉ ở "ai giữ controller", chứ network behavior giống Case B.

### 5. Bảng tổng kết 3 hành vi

| Tình huống | Manual đúng | Manual quên cleanup | TanStack Query |
|---|---|---|---|
| Request khi user đi | **Hủy** (abort) | Chạy hết (lãng phí, race) | **Chạy tiếp nền** |
| Data khi quay lại | Fetch mới | Fetch mới | **Cache ngay** (≤ gcTime) |
| Muốn hủy request nền | Đã hủy | — | `cancelQueries` (thủ công) |

### 6. Đối chiếu Angular (điểm ăn điểm cho người từ Angular)

| Angular | React | Ghi chú |
|---|---|---|
| `async` pipe / `first()` / `takeUntil(destroy$)` | cleanup `ctrl.abort()` trong `useEffect` | Cả hai **hủy** subscription/request khi component chết |
| `switchMap` (input đổi) hủy request trước | deps `[url]` → cleanup cũ abort request cũ | Cùng ý: "đổi tham số = hủy cái trước" (chặn race) |
| **Không có** "chạy tiếp sau destroy" (unsubscribe là xong) | **Query chạy tiếp + cache** | Khác nhau chính: data "sống" ngoài component (cache) vs chết cùng component (state) |

> **Nói đúng câu chốt**: "Angular mặc định **dọn dẹp theo vòng đời component** (unsubscribe = hủy); React prod (Query) **tách vòng đời data khỏi vòng đời component** — request + cache sống trong QueryClient, unmount không giết. Đó là khác nhau lớn nhất, không phải bug."

## Bẫy khi phỏng vấn

1. **"TanStack Query tự abort request khi component unmount"** → **sai** (ngược): default = **để chạy tiếp** để đổ vào cache; muốn abort thì `cancelQueries` thủ công. Trả lời "abort" là lộ chưa đọc tài liệu.
2. **"Unmount = request bị hủy luôn"** (chung chung) → chỉ đúng với manual có cleanup / Angular unsubscribe; Query thì không, `use()` thì request mạng cũng không bị hủy.
3. **"Quay lại trang là fetch lại từ đầu"** → sai với Query: trong `gcTime` (5' mặc định) đọc **cache** (hiện data ngay, refetch nền nếu stale). Chỉ hết gcTime mới loading từ đầu.
4. **"React 18 warning 'setState on unmounted component'"** → warning đó **đã bỏ** từ React 18; vấn đề thật còn lại là **race + lãng phí**, không phải warning.
5. **Manual đổi url: "chỉ cần thêm request mới, request cũ tự hết"** → **sai**: request cũ (chậm) về sau ghi đè → **race**. Chặn bằng `abort()` request cũ (cleanup) hoặc `switchMap` (Angular) / queryKey khác (Query — tự dedupe + hủy khi key đổi).

## Gợi ý câu chốt

> "Phụ thuộc cơ chế fetch: **manual viết đúng** → cleanup `abort()`, request hủy, data mất (quay lại fetch mới), AbortError bị lọc. **Manual quên cleanup** → request chạy hết, harmless (React 18 không warning) nhưng race + tốn. **TanStack Query (prod)** → unmount **không** abort: request chạy tiếp nền, kết quả vào cache — quay lại trong gcTime (5') **hiện data ngay**, stale thì refetch nền; muốn hủy thật dùng `cancelQueries`. Khác Angular: async pipe/`takeUntil` **hủy theo vòng đời component**; Query **tách vòng đời data khỏi component** — data sống trong QueryClient."

## Reference

- [`3_react-tutorial/12-data-fetching`](../../3_react-tutorial/12-data-fetching) — contract 4 điểm (AbortController/cleanup), `gcTime`/`staleTime`, race khi đổi url
- [`5_react-crud-jsonplaceholder`](../../5_react-crud-jsonplaceholder) — Query thực chiến: "signal từ Query, auto-abort khi unmount" trong flow, cache sống ngoài component
- [`3_react-tutorial/14-router`](../../3_react-tutorial/14-router) — navigate giữa các page (bối cảnh "user đi" của câu hỏi)
- Q20 (fetch data 3 tầng) — bức tranh tổng thể (Question 1 của cặp)
- Q15 (external store) — vì sao data "sống ngoài component" (Query cache) là server state

## Câu hỏi liên quan

- **Hỏi tiếp (liên tục)**: [Q20 — fetch trong React viết thế nào cho đúng?](../20-data-fetching/README.md) · [Q24 — navigate tới route bị guard chặn thì request đang chạy bị sao?](../24-router-guard/README.md)
- **Đào sâu (xuyên nhóm)**: [Q22 — 401 trong lúc abort (refresh token, single-flight)?](../22-interceptor/README.md) · [Q32 — onMutate cancelQueries (hủy request cũ, cùng cơ chế abort)?](../32-query-mutations/README.md)
