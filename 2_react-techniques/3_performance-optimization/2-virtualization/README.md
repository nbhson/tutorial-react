# Virtualization (TanStack Virtual)

> Nguồn: https://tanstack.com/virtual/latest

## Mục tiêu

### 1. Render chỉ các dòng trong viewport thay vì toàn bộ list 10k+ dòng (windowing)

**Vì sao:** 50.000 `<li>` là 50.000 node DOM — trình duyệt layout + paint mỗi lần scroll đều nặng, RAM phình hàng trăm MB, React diff cũng tốn. Scroll giật, gõ filter delay, máy yếu đứng hình. Virtualization (windowing) chỉ vẽ vài chục dòng vừa khớp viewport + vùng đệm, nội dung đổi theo scroll — DOM nhỏ cố định dù data 10k hay 1M.

**Cơ chế:** container ngoài `overflow:auto` + chiều cao hữu hạn; bên trong là "canvas" cao bằng tổng chiều cao ảo (`getTotalSize()`), mỗi row `position:absolute; transform: translateY(start)`. Scroll đổi → virtualizer tính lại "cửa sổ" nào cần vẽ → React chỉ render đúng cửa sổ đó. Browser không layout toàn bộ vì row định vị tuyệt đối theo offset.

```tsx
// ✅ ĐÚNG: 10.000 item nhưng DOM chỉ ~15 node — scroll mượt
const v = useVirtualizer({ count: 10_000, getScrollElement: () => parentRef.current, estimateSize: () => 32, overscan: 5 });
// Chỉ map v.getVirtualItems() — không map toàn bộ items
```

**Usecase thực tế:** log hệ thống 50k dòng, feed vô hạn, table 10k đơn hàng, dropdown 5k option, chat history dài. Quy tắc nhận diện "khi nào dùng": list > vài trăm dòng có scroll, hoặc row chứa ảnh/iframe nặng, hoặc table cột dính. List < 200 dòng → render thường + pagination, virtualization chỉ thêm chi phí đo đạc.

### 2. Giảm node DOM và bộ nhớ hàng trăm lần → scroll mượt với dữ liệu khổng lồ

10.000 dòng × ~5 node/dòng = 50.000 node. Virtualize còn ~15 dòng × 5 = 75 node — giảm ~600 lần. RAM, layout, paint đều giảm tương ứng. Bằng chứng: DevTools Performance → DOM Nodes ổn định khi cuộn qua hàng nghìn dòng (không virtualize thì tăng vọt).

### 3. Nắm API `useVirtualizer`: `count`, `getScrollElement`, `estimateSize`, `overscan`, `measureElement`

`count` là tổng item; `getScrollElement` trả scroll container (ref); `estimateSize` ước cao mỗi row trước khi đo; `overscan` là đệm 2 đầu viewport (tránh trắng khi scroll nhanh); `measureElement` tự đo row cao động sau render. Nắm 5 cái này là dùng được 90% case; còn lại (`scrollToIndex`, `getItemKey`, grid/horizontal) là mở rộng.

## Tổng quan

Render 50.000 dòng `<li>` đồng nghĩa 50.000 node DOM — trình duyệt tính layout + paint mỗi lần scroll đều nặng, bộ nhớ phình, React cũng tốn khi diff. **Virtualization** (windowing) vẽ *chỉ* vài chục dòng vừa khớp viewport + một phần "vùng đệm", đổ đúng nội dung khi scroll bằng cách **định vị tuyệt đối** theo offset đã tính.

`@tanstack/react-virtual` (kế thừa react-window hiện đại) không phụ thuộc layout UI — tự đo, hỗ trợ row cao động, grid, cột dính, RTL, `scrollToIndex`. Áp dụng khi: list dài (hàng nghìn), log/feed vô hạn, table lớn, dropdown hàng ngàn option. Không dùng cho list ngắn (< 200 dòng) — chi phí đo + absolute positioning không có lợi.

## Khái niệm cốt lõi

### 1. `useVirtualizer(options)` — 4 option sống còn

**Vì sao từng option:** `count` cho biết tổng để tính scroll range; `getScrollElement` cho biết đọc `scrollTop`/`clientHeight` ở đâu; `estimateSize` cho chiều cao khởi đầu khi chưa đo (sai nhiều thì scroll lệch tạm rồi hiệu chỉnh); `overscan` cho đệm để scroll nhanh không trắng (quá lớn thì mất lợi ích, quá nhỏ thì chớp).

```tsx
// ✅ ĐÚNG: 4 option tối thiểu — đủ để virtualizer tính cửa sổ
const v = useVirtualizer({
  count: items.length, // tổng dòng — đổi khi filter/append
  getScrollElement: () => parentRef.current, // ref ổn định, không tạo mới mỗi render
  estimateSize: () => 32, // mọi row 32px — chính xác thì không cần measureElement
  overscan: 5, // thêm 5 dòng mỗi đầu — scroll nhanh đã có sẵn trong DOM
});
```

**Sai thì sao:**

```tsx
// ❌ SAI: getScrollElement tạo element mới mỗi lần — virtualizer mất mốc đo
getScrollElement: () => document.createElement('div'),
// ✅ ĐÚNG: trả ref ổn định
getScrollElement: () => parentRef.current,
```

### 2. `getVirtualItems()` + `getTotalSize()` — cửa sổ đang vẽ + thước toàn list

`getVirtualItems()` trả mảng item ảo cần render, mỗi item có `index` (vị trí data), `key` (key ổn định), `start` (offset Y), `size` (cao đã đo/ước). `getTotalSize()` là tổng cao ảo — canvas phải cao đúng bằng nó thì thanh cuộn mới dài đúng như list thật.

### 3. Cơ chế windowing — canvas ảo + absolute + translateY

Container ngoài cuộn; canvas trong cao `getTotalSize()` + `position:relative`; mỗi row `absolute; top:0; translateY(start)`. Dùng `transform` thay `top: start` để browser chỉ composite (nhanh) thay vì layout (chậm) mỗi scroll. Không gắn ref/height cho container → `clientHeight` 0 → trắng.

### 4. Dynamic size — `measureElement` + `getItemKey` cho row cao không đều

`estimateSize` chỉ là ước khởi đầu. Row cao động (text 1–3 dòng) phải đo thật: gắn `ref={v.measureElement}` + `data-index` lên row, đặt `getItemKey={(i) => items[i].id}` ổn định. TanStack đo sau render và hiệu chỉnh offset — scroll không lệch dần. Chỉ `estimateSize` cho row động → tổng cao sai 누적, càng cuộn càng lệch.

```tsx
// ✅ ĐÚNG: row cao động — đo thật + key ổn định
const v = useVirtualizer({ count: items.length, getScrollElement: () => parentRef.current, estimateSize: () => 40, getItemKey: (i) => items[i].id });
{v.getVirtualItems().map((vi) => (
  <div key={vi.key} data-index={vi.index} ref={v.measureElement} style={{ position: 'absolute', top: 0, left: 0, width: '100%', transform: `translateY(${vi.start}px)` }}>
    {items[vi.index].noiDungDai}
  </div>
))}
```

### 5. `scrollToIndex` — nhảy tới dòng bất kỳ không cần render cả list

Tìm kiếm "nhảy tới #8000", anchor, chat "về tin mới nhất" — virtualizer tính offset từ estimate/đo và cuộn tới, chỉ render cửa sổ đích. Không cần giữ toàn bộ DOM để cuộn được.

## Luồng hoạt động / Cách áp dụng

### Bước 1. Xác định scroll container: `useRef` + `height` + `overflow:auto`

Div có chiều cao hữu hạn (300px hoặc `100%` có cha cao) để sinh scroll event. Không height → không cuộn → chỉ vẽ vài dòng mặc định, list "trắng".

### Bước 2. Gọi `useVirtualizer({ count, getScrollElement, estimateSize, overscan })`

`count` cập nhật khi filter/append — virtualizer tự tính lại. `getScrollElement` trả ref ổn định.

### Bước 3. Render canvas: cao `getTotalSize()`, `position:relative`

Canvas là "thước" — thanh cuộn dài đúng như list thật dù chỉ vẽ vài dòng.

### Bước 4. Map `getVirtualItems()` → row absolute + `translateY(start)` + key ổn định

Luôn `key={vi.key}` (hoặc id thật), không `key={index` render} — sort/filter giữa chừng mà key sai là React nhầm node, row lệch/đo sai.

### Bước 5. Data đổi → `count` cập nhật; reset scroll khi đổi dataset

Filter mới thì `scrollToOffset(0)` về đầu (không giữ scrollTop cũ của dataset cũ). Virtualizer tự tính lại cửa sổ.

## Ví dụ chi tiết

Mirror 1-1 với `example.tsx` cùng thư mục (không rút gọn):

```tsx
// example.tsx — mirror đầy đủ, khớp từng dòng với file thật
import { useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';

export function VirtualDemo() {
  // 10.000 phần tử — đủ thấy khác biệt so với render tất cả (50.000 node vs ~75 node)
  const items = Array.from({ length: 10_000 }, (_, i) => `Dòng #${i + 1}`);
  const parentRef = useRef<HTMLDivElement>(null); // scroll container — virtualizer đọc scrollTop ở đây

  // useVirtualizer: tính "cửa sổ hiển thị" dựa trên scroll position
  // Vì sao 4 option này: count để biết tổng, getScrollElement để biết đọc ở đâu,
  // estimateSize để có cao khởi đầu, overscan để scroll nhanh không trắng
  const v = useVirtualizer({
    count: items.length, // tổng số dòng — filter/append thì số này đổi, virtualizer tính lại
    getScrollElement: () => parentRef.current, // lấy container cuộn (ref ổn định)
    estimateSize: () => 32, // ước 32px/row — đúng vì demo mọi row cùng cao
    overscan: 5, // render thêm 5 dòng 2 đầu cho mượt khi scroll nhanh
  });

  return (
    // Container BẮT BUỘC có height hữu hạn + overflow auto — không có là không cuộn, list trắng
    <div ref={parentRef} style={{ height: 300, overflow: 'auto', border: '1px solid #ccc' }}>
      {/* "canvas" ảo: cao đúng tổng (getTotalSize) để thanh cuộn dài như list thật, position relative làm mốc */}
      <div style={{ height: v.getTotalSize(), position: 'relative' }}>
        {/* chỉ render đúng số dòng trong viewport + overscan — không map toàn bộ items */}
        {v.getVirtualItems().map((vi) => (
          <div
            key={vi.key} // key ổn định từ virtualizer — KHÔNG dùng index render, sort/filter là lệch
            style={{
              position: 'absolute', top: 0, left: 0, width: '100%',
              height: 32, // khớp estimateSize (row động thì dùng vi.size + measureElement)
              transform: `translateY(${vi.start}px)`, // định vị theo offset — dùng transform để chỉ composite, nhanh hơn top
            }}
          >
            {items[vi.index]} {/* lấy nội dung theo index ảo — vi.index là vị trí data thật */}
          </div>
        ))}
      </div>
    </div>
  );
}
```

## Giải thích từng phần

### `parentRef` — mốc đo scroll

Virtualizer đọc `scrollTop`/`clientHeight` của element này để biết cửa sổ nào đang hiện. Không gắn ref (null) → không tính được → rỗng. Ref phải ổn định, không tạo element mới mỗi render.

### `height: 300; overflow: auto` — điều kiện sinh scroll

Không chiều cao hữu hạn thì container cao bằng nội dung, không có scroll event, virtualizer chỉ vẽ vài dòng đầu. Đây là lỗi "list trắng" phổ biến nhất — fix đầu tiên luôn là kiểm tra height.

### `vi.start` + `translateY` — composite thay layout

`top: start` mỗi scroll bắt browser layout lại canvas (chậm — đúng thứ muốn tránh). `transform` chỉ composite lớp đã vẽ (nhanh, 60fps). Giữ `top: 0` cố định + `translateY` động là pattern chuẩn.

### `estimateSize: () => 32` — đủ cho row đều, thiếu cho row động

Demo mọi row 32px nên ước chính xác là đủ. Row cao động (text dài ngắn khác nhau) phải thêm `measureElement` + `getItemKey`, nếu không tổng cao sai dần, scroll lệch, dòng đè nhau.

### `overscan: 5` — đệm chống trắng

Scroll nhanh vài trăm px/frame, dòng mới chưa kịp render → trắng. Đệm 5 dòng mỗi đầu (3–10 tùy cao row) để dòng mới đã nằm sẵn trong DOM. Quá lớn (> 20) là render thừa, mất lợi ích.

## So sánh (nếu có)

### Virtualization vs Pagination

Pagination chia API (nhiều click, mất UX "scroll one"), nhưng server nhẹ. Virtualization giữ list liên tục mượt, nhưng cần toàn bộ data ở client memory. Chuẩn mới: server paginate + client virtualize trang đang mở (infinite + virtual).

### Virtualization vs Infinite Scroll (không virtualize)

Infinite nối dần data nhưng mỗi page render hết → DOM vẫn phình theo số page. Virtual + infinite: gần đáy thì fetch thêm page, virtualizer chỉ giữ cửa sổ DOM nhỏ. Không kết hợp là nửa vời.

### TanStack Virtual vs react-window/react-virtualized

react-window đơn giản nhưng row cùng size, grid thủ công, API thập niên trước. TanStack hỗ trợ dynamic measure, grid 2 chiều, RTL, `scrollToIndex`, hooks hiện đại — lựa chọn 2026 cho mọi case mới.

## Lỗi thường gặp / Chống chỉ định

### 1. Container không height → trắng

```tsx
// ❌ SAI: không height — không scroll, virtualizer không tính
<div ref={parentRef} style={{ overflow: 'auto' }}>
// ✅ ĐÚNG: height hữu hạn
<div ref={parentRef} style={{ height: 300, overflow: 'auto' }}>
```

### 2. Key dùng index render → sort/filter lệch

```tsx
// ❌ SAI: key theo thứ tự render — reorder là React nhầm node
{v.getVirtualItems().map((vi, idx) => <div key={idx}>)}
// ✅ ĐÚNG: key ổn định từ virtualizer (hoặc id thật qua getItemKey)
{v.getVirtualItems().map((vi) => <div key={vi.key}>)}
```

### 3. `top: start` thay `translateY` → layout mỗi scroll

Giữ `top: 0` + `transform: translateY(start)` để chỉ composite. Đo Performance trước/sau để thấy khác biệt frame time.

### 4. Row động mà chỉ estimate → lệch 누적

Thêm `measureElement` + `getItemKey` như mục Khái niệm 4. Với ảnh trong row, chừa `aspect-ratio` để có cao trước khi ảnh tải (tránh nhảy khi ảnh về).

### 5. Chống chỉ định: list < 200 dòng, table dính phức tạp chưa tính kỹ

Chi phí đo + absolute không lợi cho list ngắn — render thường/pagination đủ. Table hàng cao bất định + nhiều cột sticky thì dùng TanStack Table + Virtual kết hợp, không tự bịa.

## Câu hỏi thường gặp

### Table lớn dùng được không?

Có — TanStack Table (logic cột/sort) + TanStack Virtual (render cửa sổ) là combo chuẩn. Cột dính xử lý bằng CSS sticky ngoài vùng ảo, không virtualize theo chiều ngang cột dính.

### Row cao động thì sao?

`measureElement` + `getItemKey` — TanStack đo sau render và hiệu chỉnh offset. `estimateSize` chỉ là ước khởi đầu, càng gần trung bình thật càng ít nhảy lúc đầu.

### Có cần toàn bộ data ở memory?

Client-side virtualize cần. Vô hạn thì `useInfiniteQuery` nạp dần + virtualizer render cửa sổ — memory chỉ giữ page đã nạp, DOM chỉ giữ cửa sổ hiện tại.

### Overscan bao nhiêu?

3–10 tùy cao row và tốc độ scroll. Test scroll nhanh tay: trắng thì tăng, DOM phình thì giảm.

### `scrollToIndex` tới dòng chưa render được không?

Được — offset tính từ estimate/đo, không cần render cả list. Dùng cho "nhảy tới #8000", tìm kiếm, anchor.

## Ghi chú 2026

- **`@tanstack/react-virtual` v3 là chuẩn hiện đại:** thay react-window/virtualized; hỗ trợ grid, RTL, dynamic size, `scrollToIndex`.
- **Compiler + Virtual chia việc:** Compiler giảm render thừa từng row; virtualizer giảm số node DOM. Một cái lo "ai vẽ", một cái lo "vẽ bao nhiêu" — cần cả hai cho list lớn.
- **React 19 concurrent-measure an toàn:** đo lường kiểu `useSyncExternalStore` từ virtualizer không tearing ở concurrent render.

## Best practices / Mẹo

### Row động: `getItemKey` + `measureElement` + `data-index`; overscan 3–10

Key id thật khi reorder được. Overscan quá lớn mất lợi ích. Lazy-load ảnh/iframe trong row; ảnh chừa `aspect-ratio` để không nhảy khi tải xong.

### Query + Virtual + Infinite là combo feed dài; grid/ngang có cấu hình riêng

`useQuery` bơm mảng, `useInfiniteQuery` nạp thêm khi gần đáy, `scrollToIndex` nhảy. `horizontal: true` cho timeline ngang, `useGridVirtualizer` cho grid 2 chiều — không tự bịa CSS.

### `contain: strict`/`content-visibility` + reset scroll + test DOM nodes

Tăng tốc paint từng row. Đổi dataset thì `scrollToOffset(0)`. Test Performance: DOM nodes phải ổn định khi cuộn nghìn dòng — tăng vọt là virtualize chưa đúng.

## Bài tập nhỏ

1. Thêm input "Nhảy tới dòng 8.000" dùng `scrollToIndex(N, { align: 'center' })` — xác nhận không render cả list mà vẫn tới.
2. Chuyển row cao động (text 1–3 dòng theo index) + `measureElement` + `getItemKey` — cuộn nhanh kiểm tra không lệch/đè.
3. Bọc data bằng `useQuery` giả lập vài nghìn dòng (delay 500ms) — skeleton lúc tải, virtualize khi có data.
4. Đếm DOM nodes (DevTools Elements → đếm, hoặc Performance): so với 10.000 nếu không virtualize — ghi tỉ lệ giảm.

## Reference

- [TanStack Virtual](https://tanstack.com/virtual/latest)
- [TanStack Virtual — dynamic measurement](https://tanstack.com/virtual/latest/docs/framework/react/examples/dynamic)
