# Q31: Render list 50.000 item — phải render hết, hay dùng virtualization?

## Câu hỏi

> Render 50.000 li thì có sao không? Virtualization (windowing) là gì, tại sao DOM vẫn nhỏ cố định dù data lên tới 1 triệu item? Các option của useVirtualizer (count, getScrollElement, estimateSize, overscan, measureElement) để làm gì? Kết hợp với useInfiniteQuery thì thế nào? Khác pagination ở đâu?

## Trả lời ngắn (elevator pitch, 30 giây)

- **Render hết 50k item = 50k node DOM** (× ~5 node/item = ~250k node) → layout + paint **mỗi lần scroll** nặng, RAM phình, React diff tốn, scroll giật. **Virtualization (windowing)** = chỉ **vẽ vài chục dòng khớp viewport + vùng đệm (overscan)** — DOM **nhỏ cố định** dù data 10k hay 1M.
- **Cơ chế**: container ngoài `overflow:auto` + chiều cao hữu hạn; bên trong "canvas" cao bằng **tổng chiều cao ảo** (`getTotalSize()`), mỗi row **`position:absolute; top:0; transform: translateY(start)`** (dùng `transform` = composite, nhanh, không layout mỗi scroll). Scroll đổi → virtualizer tính lại "cửa sổ" → React chỉ render đúng cửa sổ đó.
- **Quy tắc chọn**: list **> vài trăm dòng** có scroll (hoặc row chứa ảnh/iframe nặng) → virtualize; **< 200 dòng** → render thường + **pagination** (virtualization thêm chi phí đo + absolute positioning, không lợi).
- **Combo chuẩn feed dài (2026)**: `useInfiniteQuery` (nạp dần page, không tải hết API) + virtualizer (DOM nhỏ) — "vô hạn" nhưng chỉ giữ **cửa sổ DOM** trong memory.
- **Điểm ăn điểm**: virtualization **giảm số node DOM** (vẽ bao nhiêu), `useDeferredValue`/transition **hoãn thời điểm render** (Q29) — **vấn đề khác nhau, cần cả hai** cho list khổng lồ.

## Trả lời chi tiết

### 1. Vì sao "render hết" chết (con số cụ thể)

| Cách | Node DOM (50k dòng, ~5 node/dòng) | Layout/paint mỗi scroll |
|---|---|---|
| Render hết (map toàn bộ) | **~250.000** | **Toàn bộ** (trình duyệt layout 250k node mỗi frame scroll) |
| **Virtualize** | **~15–30** (cửa sổ viewport + overscan) | **Chỉ cửa sổ** (DOM ổn định khi cuộn) |

Bằng chứng đo: DevTools Performance → **DOM Nodes** ổn định khi cuộn qua hàng nghìn dòng (virtual) vs tăng vọt (không virtual).

### 2. `useVirtualizer` — 4–5 option sống còn

```tsx
import { useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";

export function VirtualList({ items }: { items: string[] }) {
  const parentRef = useRef<HTMLDivElement>(null);

  const v = useVirtualizer({
    count: items.length,                    // (1) tổng item — đổi khi filter/append
    getScrollElement: () => parentRef.current, // (2) ref ổn định (KHÔNG createElement mỗi lần)
    estimateSize: () => 32,                 // (3) ước cao mỗi row (trước khi đo thật)
    overscan: 5,                            // (4) đệm 5 dòng 2 đầu (scroll nhanh không trắng)
  });

  return (
    <div ref={parentRef} style={{ height: 300, overflow: "auto", border: "1px solid #ccc" }}>
      {/* (5) "canvas" cao đúng tổng (getTotalSize) — thanh cuộn dài như list thật */}
      <div style={{ height: v.getTotalSize(), position: "relative" }}>
        {v.getVirtualItems().map((vi) => (
          <div
            key={vi.key}                    // key ổn định (KHÔNG index render — sort/filter lệch, Q8)
            data-index={vi.index}
            ref={v.measureElement}          // (6) row cao động: đo thật (không phải chỉ estimate)
            style={{
              position: "absolute", top: 0, left: 0, width: "100%",
              height: vi.size,
              transform: `translateY(${vi.start}px)`, // composite (nhanh), không layout
            }}
          >
            {items[vi.index]}
          </div>
        ))}
      </div>
    </div>
  );
}
```

**Mỗi option làm gì (nói được = ăn điểm)**:
- **`count`**: tổng item → virtualizer biết "thước toàn list" (tính scroll range).
- **`getScrollElement`**: trả **ref ổn định** (đọc `scrollTop`/`clientHeight` ở đâu) — **không được** `createElement` (mất mốc đo, mỗi render null/mới → rỗng).
- **`estimateSize`**: cao ước lượng trước khi đo (sai nhiều → scroll lệch tạm, rồi `measureElement` hiệu chỉnh).
- **`overscan`**: đệm 2 đầu (scroll nhanh không "trắng"); quá lớn (> 20) mất lợi ích.
- **`measureElement` + `getItemKey`**: **row cao động** (text 1–3 dòng) — đo thật sau render, không "chỉ estimate" (sai tổng cao **tích lũy**, càng cuộn càng lệch/đè).

### 3. Vì sao "absolutely positioned + translateY" (cơ chế, không phải vẹt)

- Container phải có **height hữu hạn + overflow:auto** — không có = không scroll event, virtualizer chỉ vẽ vài dòng (list "trắng" — lỗi #1).
- Row dùng **`top:0; transform: translateY(start)`** thay `top: start` → trình duyệt chỉ **composite** (layer đã vẽ) — **không layout lại** mỗi scroll (layout = chậm, đúng thứ muốn tránh).
- `getTotalSize()` làm "thước" ảo: canvas cao bằng tổng → **thanh cuộn dài đúng**, dù DOM chỉ vài chục row.

### 4. Khi nào VIRTUALIZE, khi nào KHÔNG (quy tắc 1 trang)

| Trường hợp | Dùng |
|---|---|
| List **> vài trăm dòng** có scroll (log 50k, feed, table 10k, dropdown 5k option) | **Virtualize** |
| Row chứa **ảnh/iframe/table** (nặng) | **Virtualize** (dù số dòng ít hơn) |
| List **< 200 dòng** | **Không** (virtualization chi phí đo + absolute **không lợi** — render thường + pagination) |
| **Table** lớn + cột dính | `TanStack Table` (logic cột/sort) + `TanStack Virtual` (cửa sổ) — combo, không tự bịa CSS |

### 5. Kết hợp Query (feed vô hạn) — combo 2026

```tsx
// "Nạp dần" (server paginate) + "vẽ cửa sổ" (client virtualize) — 2 tầng khác nhau
const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
  queryKey: ["posts"],
  queryFn: ({ pageParam }) => fetchPosts(pageParam),
  getNextPageParam: (last) => last.nextCursor,
});
// (1) data.pages "dãn phẳng" thành 1 mảng (mọi item đã nạp)
// (2) scroll gần đáy (onScroll) → fetchNextPage() (chỉ fetch, chưa có DOM)
// (3) virtualizer chỉ render "cửa sổ" — memory giữ page đã nạp, DOM giữ vài chục
```

> **Phân biệt** (ăn điểm): **Infinite (không virtualize)** = mỗi page render hết → DOM **phình theo số page**. **Virtual + Infinite** = DOM **cố định** (cửa sổ), memory = page đã nạp. "Chỉ infinite (không virtual) là **nửa vời**".

### 6. Khác `pagination` (thường hỏi kèm)

| | Pagination | Virtualization |
|---|---|---|
| Ai chia dữ liệu | **Server** (nhiều click, 1 lần N trang) | **Client** (DOM nhỏ, "scroll một") |
| UX | Nhiều click (mất "scroll one") | Liền mạch (scroll) |
| Server | Nhẹ (trả 1 trang) | Nặng hơn (nạp dần, không trả hết) |
| **Chuẩn mới** | **Server paginate + client virtualize trang đang mở** (infinite + virtual — "cả hai", không chọn 1) |

## Bẫy khi phỏng vấn

1. **"Nói virtualization = giảm render (giống memo/deferred)"** → **sai** (khác trục): virtual **giảm số node DOM** ("vẽ bao nhiêu"), deferred/transition **hoãn thời điểm render** (Q29), memo **giảm CPU render con** (Q16). List khổng lồ: **cần cả virtual (DOM) + deferred (hoãn) + memo (CPU)**.
2. **"List ngắn (< 200 dòng) virtualize cho 'xịn'"** → **sai** (chi phí đo + absolute positioning **không lợi** — render thường + pagination). "Quy tắc 200 dòng" là điểm ăn điểm.
3. **Key dùng `index` (render)** → sort/filter/reorder là **React nhầm node** (Q8), row lệch/đo sai. **Key ổn định** (id thật / `vi.key`).
4. **Dùng `top: start` (không `translateY`)** → **layout mỗi scroll** (chậm) — composite (translate) là đúng (Q "vì sao 60fps").
5. **Container không `height` + `overflow:auto`** → "list trắng" (không scroll event, virtualizer không tính) — lỗi "thực chiến" #1 (phải kiểm tra đầu tiên khi "trắng").
6. **"`useInfiniteQuery` là đủ, không cần virtual"** → "nửa vời": DOM phình theo số page (bảng §5) — "combo" (infinite + virtual) mới đúng feed dài.

## Gợi ý câu chốt

> "50k `<li>` = 50k node DOM (× ~5 = ~250k) — layout/paint mỗi scroll chết. **Virtualization (windowing)** chỉ vẽ **cửa sổ viewport + overscan** (DOM ~15–30) dù data 1M: container `overflow:auto` + height, canvas cao `getTotalSize()`, row **`absolute; transform: translateY(start)`** (composite, không layout mỗi scroll). `useVirtualizer`: `count`/`getScrollElement` (ref ổn định, không createElement)/`estimateSize`/`overscan`/`measureElement`+`getItemKey` (row động). **Quy tắc: list > vài trăm dòng (hoặc row nặng) → virtual; < 200 → pagination**. Feed dài: **`useInfiniteQuery` (nạp dần, server) + virtual (DOM nhỏ, client)** — cả hai, không 1. Khác deferred/memo: virtual **giảm node DOM** (trục 'vẽ bao nhiêu'), deferred **hoãn thời điểm** (Q29), memo **giảm CPU** (Q16) — list khổng lồ cần cả ba."

## Reference

- [`2_react-techniques/3_performance-optimization/2-virtualization`](../../2_react-techniques/3_performance-optimization/2-virtualization) — `useVirtualizer` (4 option + measureElement + getItemKey), cơ chế "canvas ảo + absolute + translateY", "row động", "scrollToIndex", bảng "vs Pagination / vs Infinite / vs react-window", "list < 200 không virtual"
- [`5_react-crud-jsonplaceholder`](../../5_react-crud-jsonplaceholder) — "Search dùng `useDeferredValue` + filter" (combo deferred + list), Query server state
- [`2_react-techniques/8_best-practices/4_performance-guide`](../../2_react-techniques/8_best-practices/4_performance-guide) — "không thay virtualization (hoãn thời điểm vs giảm node)", deferred + virtual cùng lúc
- Q8 (key = index) — "key ổn định" (row virtual không dùng index render, reorder lệch)
- Q29 (transition/deferred) — deferred **hoãn** (trục thời gian) vs virtual **giảm node** (trục DOM) — "cần cả hai"

## Câu hỏi liên quan

- **Hỏi tiếp (liên tục)**: [Q29 — list nặng, giữ UI mượt (startTransition)?](../29-concurrency-transition-deferred/README.md) · [Q8 — key = id (không index) cho N item?](../08-key-index/README.md)
- **Đào sâu (xuyên nhóm)**: [Q20/32 — infinite query (load phân trang vô hạn)?](../20-data-fetching/README.md) · [Q34 — giữ ref cho N phần tử (virtualize + focus item)?](../34-ref-callback-n-items/README.md)
