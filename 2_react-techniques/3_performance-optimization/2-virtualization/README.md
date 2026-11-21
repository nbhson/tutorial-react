# Virtualization (TanStack Virtual)

> Nguồn: https://tanstack.com/virtual/latest

## Mục tiêu

### 1. Render chỉ các dòng trong viewport thay vì toàn bộ list 10k+ dòng (windowing)

**Vì sao:** 50.000 `<li>` là 50.000 node DOM — trình duyệt layout + paint mỗi lần scroll đều nặng, RAM phình hàng trăm MB, React diff cũng tốn. Scroll giật, gõ filter delay, máy yếu đứng hình. Virtualization (windowing) chỉ vẽ vài chục dòng vừa khớp viewport + vùng đệm, nội dung đổi theo scroll — DOM nhỏ cố định dù data 10k hay 1M.

**Cơ chế:** container ngoài `overflow:auto` + chiều cao hữu hạn; bên trong là "canvas" cao bằng tổng chiều cao ảo (`getTotalSize()`), mỗi row `position:absolute; transform: translateY(start)`. Scroll đổi → virtualizer tính lại "cửa sổ" nào cần vẽ → React chỉ render đúng cửa sổ đó. Browser không layout toàn bộ vì row định vị tuyệt đối theo offset.

> 📄 **Code ví dụ:** [`examples/01-1-render-chi-cac-dong-trong-viewport-thay.tsx`](examples/01-1-render-chi-cac-dong-trong-viewport-thay.tsx)

**Usecase thực tế:** log hệ thống 50k dòng, feed vô hạn, table 10k đơn hàng, dropdown 5k option, chat history dài. Quy tắc nhận diện "khi nào dùng": list > vài trăm dòng có scroll, hoặc row chứa ảnh/iframe nặng, hoặc table cột dính. List < 200 dòng → render thường + pagination, virtualization chỉ thêm chi phí đo đạc.

### 2. Giảm node DOM và bộ nhớ hàng trăm lần → scroll mượt với dữ liệu khổng lồ

10.000 dòng × ~5 node/dòng = 50.000 node. Virtualize còn ~15 dòng × 5 = 75 node — giảm ~600 lần. RAM, layout, paint đều giảm tương ứng. Ví von: thay vì mời cả hội trường 10.000 người vào để ai đó chỉ xem 15 hàng đầu, bạn chỉ cho 15 người vào cửa và thay người theo lượt. Bằng chứng: DevTools Performance → DOM Nodes ổn định khi cuộn qua hàng nghìn dòng (không virtualize thì tăng vọt).

### 3. Nắm API `useVirtualizer`: `count`, `getScrollElement`, `estimateSize`, `overscan`, `measureElement`

`count` là tổng item; `getScrollElement` trả scroll container (ref); `estimateSize` ước cao mỗi row trước khi đo; `overscan` là đệm 2 đầu viewport (tránh trắng khi scroll nhanh); `measureElement` tự đo row cao động sau render. Nắm 5 cái này là dùng được 90% case; còn lại (`scrollToIndex`, `getItemKey`, grid/horizontal) là mở rộng.

> **Tóm gọn 1 câu:** Virtualization là "chỉ mời đúng khán giả đang ngồi ở hàng ghế nhìn thấy vào sân khấu" — DOM nhỏ cố định dù data có to cỡ nào.

## Tổng quan

Render 50.000 dòng `<li>` đồng nghĩa 50.000 node DOM — trình duyệt tính layout + paint mỗi lần scroll đều nặng, bộ nhớ phình, React cũng tốn khi diff. **Virtualization** (windowing) vẽ *chỉ* vài chục dòng vừa khớp viewport + một phần "vùng đệm", đổ đúng nội dung khi scroll bằng cách **định vị tuyệt đối** theo offset đã tính.

`@tanstack/react-virtual` (kế thừa react-window hiện đại) không phụ thuộc layout UI — tự đo, hỗ trợ row cao động, grid, cột dính, RTL, `scrollToIndex`. Áp dụng khi: list dài (hàng nghìn), log/feed vô hạn, table lớn, dropdown hàng ngàn option. Không dùng cho list ngắn (< 200 dòng) — chi phí đo + absolute positioning không có lợi.

## Khái niệm cốt lõi

Mục này giải nghĩa từng mảnh ghép của `useVirtualizer`: 4 option sống còn, cách tính "cửa sổ" cần vẽ, vì sao dùng `translateY` thay `top`, và xử lý row cao không đều. Đọc xong bạn sẽ tự đọc được mọi config virtualization.

### 1. `useVirtualizer(options)` — 4 option sống còn

**Vì sao từng option:** `count` cho biết tổng để tính scroll range; `getScrollElement` cho biết đọc `scrollTop`/`clientHeight` ở đâu; `estimateSize` cho chiều cao khởi đầu khi chưa đo (sai nhiều thì scroll lệch tạm rồi hiệu chỉnh); `overscan` cho đệm để scroll nhanh không trắng (quá lớn thì mất lợi ích, quá nhỏ thì chớp). Ví von: `estimateSize` như sơ đồ chỗ ngồi in trước khi khách vào — chưa chuẩn nhưng đủ để sắp hàng, khách thật vào rồi mới đo lại chỗ ngồi chính xác.

> 📄 **Code ví dụ:** [`examples/02-1-usevirtualizer-options-4-option-song-con.tsx`](examples/02-1-usevirtualizer-options-4-option-song-con.tsx)

**Sai thì sao:**

> 📄 **Code ví dụ:** [`examples/03-1-usevirtualizer-options-4-option-song-con.tsx`](examples/03-1-usevirtualizer-options-4-option-song-con.tsx)

### 2. `getVirtualItems()` + `getTotalSize()` — cửa sổ đang vẽ + thước toàn list

`getVirtualItems()` trả mảng item ảo cần render, mỗi item có `index` (vị trí data), `key` (key ổn định), `start` (offset Y), `size` (cao đã đo/ước). `getTotalSize()` là tổng cao ảo — canvas phải cao đúng bằng nó thì thanh cuộn mới dài đúng như list thật.

### 3. Cơ chế windowing — canvas ảo + absolute + translateY

Container ngoài cuộn; canvas trong cao `getTotalSize()` + `position:relative`; mỗi row `absolute; top:0; translateY(start)`. Dùng `transform` thay `top: start` để browser chỉ composite (nhanh) thay vì layout (chậm) mỗi scroll. Không gắn ref/height cho container → `clientHeight` 0 → trắng.

### 4. Dynamic size — `measureElement` + `getItemKey` cho row cao không đều

`estimateSize` chỉ là ước khởi đầu. Row cao động (text 1–3 dòng) phải đo thật: gắn `ref={v.measureElement}` + `data-index` lên row, đặt `getItemKey={(i) => items[i].id}` ổn định. TanStack đo sau render và hiệu chỉnh offset — scroll không lệch dần. Chỉ `estimateSize` cho row động → tổng cao sai tích lũy, càng cuộn càng lệch.

> 📄 **Code ví dụ:** [`examples/04-4-dynamic-size-measureelement-getitemkey-cho-row-cao.tsx`](examples/04-4-dynamic-size-measureelement-getitemkey-cho-row-cao.tsx)

### 5. `scrollToIndex` — nhảy tới dòng bất kỳ không cần render cả list

Tìm kiếm "nhảy tới #8000", anchor, chat "về tin mới nhất" — virtualizer tính offset từ estimate/đo và cuộn tới, chỉ render cửa sổ đích. Không cần giữ toàn bộ DOM để cuộn được. Giống như thư viện lên danh mục cuốn sách ở kệ số mấy — muốn mượn cuốn #8000 thì đi thẳng tới kệ đó, không cần lội qua cả 7.999 cuốn.

> **Tóm gọn 1 câu:** Virtualizer = thước đo (`getTotalSize`) + cửa sổ vẽ (`getVirtualItems`) + đệm chống trắng (`overscan`) — cả trăm nghìn dòng chỉ tồn tại vài chục node DOM.

## Luồng hoạt động / Cách áp dụng

Mục này là 5 bước dựng một list ảo hoàn chỉnh: chuẩn bị container cuộn được, gọi hook, dựng canvas, map item ảo ra row, và xử lý khi data đổi.

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

> **Tóm gọn 1 câu:** Công thức 4 nhịp: container cao hữu hạn → gọi `useVirtualizer` → canvas cao bằng `getTotalSize()` → map item ảo ra row với key ổn định.

## Ví dụ chi tiết

Mirror 1-1 với `example.tsx` cùng thư mục (không rút gọn):

> 📄 **Code ví dụ:** [`examples/05-vi-du-chi-tiet.tsx`](examples/05-vi-du-chi-tiet.tsx)

## Giải thích từng phần

### `parentRef` — mốc đo scroll

Virtualizer đọc `scrollTop`/`clientHeight` của element này để biết cửa sổ nào đang hiện. Không gắn ref (null) → không tính được → rỗng. Ref phải ổn định, không tạo element mới mỗi render.

### `height: 300; overflow: auto` — điều kiện sinh scroll

Không chiều cao hữu hạn thì container cao bằng nội dung, không có scroll event, virtualizer chỉ vẽ vài dòng đầu. Đây là lỗi "list trắng" phổ biến nhất — fix đầu tiên luôn là kiểm tra height.

### `vi.start` + `translateY` — composite thay layout

`top: start` mỗi scroll bắt browser layout lại canvas (chậm — đúng thứ muốn tránh). `transform` chỉ composite lớp đã vẽ (nhanh, 60fps). Giữ `top: 0` cố định + `translateY` động là pattern chuẩn.

### `estimateSize: () => 32` — đủ cho row đều, thiếu cho row động

Demo mọi row 32px nên ước chính xác là đủ. Row cao động (text dài ngắn khác nhau) phải thêm `measureElement` + `getItemKey`, nếu không tổng cao sai dần, scroll lệch, dòng đè nhau — giống như ghi sơ đồ ghế bằng ước lượng rồi khách cao thấp vào ngồi, càng về sau càng lệch chỗ.

### `overscan: 5` — đệm chống trắng

Scroll nhanh vài trăm px/frame, dòng mới chưa kịp render → trắng. Đệm 5 dòng mỗi đầu (3–10 tùy cao row) để dòng mới đã nằm sẵn trong DOM. Quá lớn (> 20) là render thừa, mất lợi ích.

## So sánh (nếu có)

### Virtualization vs Pagination

Pagination chia API (nhiều click, mất UX "scroll one"), nhưng server nhẹ. Virtualization giữ list liên tục mượt, nhưng cần toàn bộ data ở client memory. Ví von: pagination như đọc sách theo từng chương mượn từ thư viện, virtualization như có cả cuốn sách trên tay nhưng chỉ mở đúng trang đang đọc. Chuẩn mới: server paginate + client virtualize trang đang mở (infinite + virtual).

### Virtualization vs Infinite Scroll (không virtualize)

Infinite nối dần data nhưng mỗi page render hết → DOM vẫn phình theo số page. Virtual + infinite: gần đáy thì fetch thêm page, virtualizer chỉ giữ cửa sổ DOM nhỏ. Không kết hợp là nửa vời.

### TanStack Virtual vs react-window/react-virtualized

react-window đơn giản nhưng row cùng size, grid thủ công, API thập niên trước. TanStack hỗ trợ dynamic measure, grid 2 chiều, RTL, `scrollToIndex`, hooks hiện đại — lựa chọn 2026 cho mọi case mới.

## Lỗi thường gặp / Chống chỉ định

### 1. Container không height → trắng

> 📄 **Code ví dụ:** [`examples/06-1-container-khong-height-trang.tsx`](examples/06-1-container-khong-height-trang.tsx)

### 2. Key dùng index render → sort/filter lệch

> 📄 **Code ví dụ:** [`examples/07-2-key-dung-index-render-sort-filter-lech.tsx`](examples/07-2-key-dung-index-render-sort-filter-lech.tsx)

### 3. `top: start` thay `translateY` → layout mỗi scroll

Giữ `top: 0` + `transform: translateY(start)` để chỉ composite. Đo Performance trước/sau để thấy khác biệt frame time.

### 4. Row động mà chỉ estimate → lệch tích lũy

Thêm `measureElement` + `getItemKey` như mục Khái niệm 4. Với ảnh trong row, chừa `aspect-ratio` để có cao trước khi ảnh tải (tránh nhảy khi ảnh về).

### 5. Chống chỉ định: list < 200 dòng, table dính phức tạp chưa tính kỹ

Chi phí đo + absolute không lợi cho list ngắn — render thường/pagination đủ. Table hàng cao bất định + nhiều cột sticky thì dùng TanStack Table + Virtual kết hợp, không tự bịa.

> **Tóm gọn 1 câu:** 5 lỗi kinh điển: container thiếu height (trắng), key sai (lệch), `top` thay `translateY` (chậm), row động thiếu measure (lệch tích lũy), và virtualize list ngắn (phí công).

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

> **Tóm gọn 1 câu:** Combo chuẩn 2026: Query nạp data, Virtual vẽ cửa sổ, Compiler bớt render thừa — nhớ chìa khóa: key thật + `measureElement` cho row động, overscan 3–10.

## Bài tập nhỏ

1. Thêm input "Nhảy tới dòng 8.000" dùng `scrollToIndex(N, { align: 'center' })` — xác nhận không render cả list mà vẫn tới.
2. Chuyển row cao động (text 1–3 dòng theo index) + `measureElement` + `getItemKey` — cuộn nhanh kiểm tra không lệch/đè.
3. Bọc data bằng `useQuery` giả lập vài nghìn dòng (delay 500ms) — skeleton lúc tải, virtualize khi có data.
4. Đếm DOM nodes (DevTools Elements → đếm, hoặc Performance): so với 10.000 nếu không virtualize — ghi tỉ lệ giảm.

## Reference

- [TanStack Virtual](https://tanstack.com/virtual/latest)
- [TanStack Virtual — dynamic measurement](https://tanstack.com/virtual/latest/docs/framework/react/examples/dynamic)
