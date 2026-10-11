# Virtualization (TanStack Virtual)

> Nguồn: https://tanstack.com/virtual/latest

## Mục tiêu
- Render **chỉ các dòng trong viewport** thay vì toàn bộ list 10k+ dòng (windowing/virtualization).
- Giảm số node DOM và bộ nhớ hàng trăm lần → scroll mượt ngay cả khi dữ liệu khổng lồ.
- Nắm API `useVirtualizer`: `count`, `getScrollElement`, `estimateSize`, `overscan`, `measureElement`.

## Tổng quan
Render 50.000 dòng `<li>` đồng nghĩa 50.000 node DOM — trình duyệt tính layout + paint mỗi lần scroll đều nặng, bộ nhớ phình, React cũng tốn khi diff. **Virtualization** (windowing) vẽ *chỉ* vài chục dòng vừa khớp viewport + một phần "vùng đệm", đổ đúng nội dung khi scroll bằng cách **định vị tuyệt đối** theo offset đã tính. `@tanstack/react-virtual` (thành viên họ TanStack, bản kế thừa react-window hiện đại) không phụ thuộc UI framework layout — tự đo, tự hỗ trợ row cao động, grid, cột dính. Áp dụng khi: list dài (hàng nghìn), log/feed vô hạn, table lớn, hoặc dropdown chứa hàng ngàn option. Không dùng cho list ngắn (< 200 dòng).

## Khái niệm cốt lõi
- **`useVirtualizer(options)`**: options cốt lõi — `count` (tổng số item), `getScrollElement` (trả scroll container ref), `estimateSize` (ước lượng chiều cao mỗi row khi chưa đo), `overscan` (số dòng render thêm 2 bên viewport để tránh "trắng màn" khi scroll nhanh).
- **`getVirtualItems()`**: mảng item ảo đang cần render, mỗi item có `index`, `key`, `start`, `size`, `measureElement`; **`getTotalSize()`**: tổng chiều cao ảo = scroll range để container cuộn đúng.
- **Cơ chế windowing**: container ngoài `overflow:auto` + `position:relative`; bên trong là "canvas" cao bằng `getTotalSize()`, mỗi row nằm `position:absolute; top:0; transform: translateY(start)` — định vị theo thước đo chứ không theo flow, nên browser không cần layout toàn bộ.
- **Dynamic size**: nếu row cao không cố định, dùng `measureElement` trong row để tự đo sau khi render (và `getItemKey` ổn định); `estimateSize` chỉ là "ước lượng khởi đầu", TanStack tự hiệu chỉnh khi đo.
- **`scrollToIndex`**: điều hướng tới một row bất kỳ (anchor, tìm kiếm) không cần render cả list.

## Luồng hoạt động / Cách áp dụng
1. Xác định scroll container: `useRef<HTMLDivElement>` gắn vào div có `height` + `overflow:auto`.
2. Gọi `useVirtualizer({ count, getScrollElement, estimateSize, overscan })`.
3. Render "canvas": div trong có chiều cao `getTotalSize()`, `position:relative`.
4. Map `getVirtualItems()` → từng row `position:absolute; translateY(start)` + key ổn định.
5. Dữ liệu thay đổi (filter/append) → `count` cập nhật, virtualizer tự tính lại.

## Ví dụ chi tiết
```tsx
import { useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';

export function VirtualDemo() {
  // 10.000 phần tử — đủ thấy khác biệt so với render tất cả
  const items = Array.from({ length: 10_000 }, (_, i) => `Dòng #${i + 1}`);
  const parentRef = useRef<HTMLDivElement>(null); // scroll container

  // useVirtualizer: tính toán "cửa sổ hiển thị" dựa trên scroll position
  const v = useVirtualizer({
    count: items.length,                    // tổng số dòng
    getScrollElement: () => parentRef.current, // lấy container cuộn
    estimateSize: () => 32,                 // ước lượng 32px/row trước khi đo
    overscan: 5,                            // render thêm 5 dòng 2 đầu cho mượt
  });

  return (
    <div ref={parentRef} style={{ height: 300, overflow: 'auto', border: '1px solid #ccc' }}>
      {/* "canvas" ảo: cao đúng tổng, cuộn được như list thật */}
      <div style={{ height: v.getTotalSize(), position: 'relative' }}>
        {/* chỉ render đúng số dòng đang trong viewport + overscan */}
        {v.getVirtualItems().map((vi) => (
          <div
            key={vi.key}                     // key ổn định từ virtualizer
            style={{
              position: 'absolute', top: 0, left: 0, width: '100%',
              height: 32,                    // khớp estimateSize (hoặc dùng vi.size)
              transform: `translateY(${vi.start}px)`, // định vị theo offset đã tính
            }}
          >
            {items[vi.index]}                // lấy nội dung theo index ảo
          </div>
        ))}
      </div>
    </div>
  );
}
```

## Giải thích từng phần
- `parentRef` — điểm mốc scroll: virtualizer đọc `scrollTop`/`clientHeight` của nó để tính "cửa sổ" nào cần render. Không gắn ref → mọi thứ rỗng.
- `height: 300; overflow: auto` — container BẮT BUỘC có chiều cao hữu hạn để cuộn; thiếu nó thì không có scroll event và chỉ vẽ vài dòng mặc định.
- Trong block map, `vi.start` là offset Y đã cộng dồn; dùng `translateY` thay cho `top: start` để trình duyệt chỉ re-composite (nhanh hơn layout) khi scroll.
- `estimateSize: () => 32` — nếu tất cả row cùng cao, ước lượng chính xác là đủ; nếu cao động, ta cần `measureElement` (xem mẹo) để tự đo.
- `overscan: 5` — "đệm" 2 phía viewport: khi scroll nhanh, dòng mới đã có sẵn trong DOM thay vì chớp trắng rồi render.

## So sánh (nếu có)
- **Virtualization vs Pagination**: pagination chia API → nhiều click, mất "scroll one" UX; virtualization giữ một list liên tục, nhưng *cần toàn bộ dữ liệu trong memory* (client-side). Kết hợp: server paginate + virtualize trang đang mở.
- **Virtualization vs Infinite Scroll**: infinite scroll nối dần dữ liệu; virtualization + infinite scroll là combo chuẩn mới (khi gần chạm đáy thì gọi thêm page, virtualizer render cửa sổ). Nếu tự render tất cả mỗi page → DOM vẫn phình; nên kết hợp.
- **TanStack Virtual vs react-window/react-virtualized**: react-window đơn giản nhưng kém linh hoạt (row cùng size, grid thủ công); TanStack Virtual hỗ trợ dynamic measurement, grid, RTL, `scrollToIndex`, hooks React-native — là lựa chọn hiện đại, không giữ "thập niên trước" API.

## Lỗi thường gặp / Chống chỉ định
- **Container không có chiều cao** → `clientHeight` = 0, không scroll, list "trắng". Fix: đặt height hữu hạn (hoặc `max-height: 100%` cho scroll màn hình).
- **`key` dùng index thay vì `vi.key`** → khi sort/filter giữa chừng, React nhầm node → row động sai vị trí/đo sai. Fix: luôn dùng `vi.key` (hoặc `getItemKey` với id thật).
- **Quên `translateY` hoặc set `top: start`** → browser layout toàn bộ canvas mỗi scroll (chậm lại đúng thứ định tránh). Fix: giữ `transform: translateY(start)`.
- **Hàng cao động mà chỉ `estimateSize`** → tổng chiều cao sai dần sau nhiều row → scroll sai vị trí, "lệch dòng". Fix: dùng `measureElement` + `getItemKey` ổn định.
- **Chống chỉ định**: list < 200 dòng — virtualization thêm chi phí (đo, absolute positioning) không có lợi; dữ liệu nhỏ dùng phân trang hoặc render bình thường. Cũng đừng virtualize table có hàng cao bất định + nhiều cột dính phức tạp nếu chưa tính toán overlay thật kỹ — dùng thư viện table chuyên dụng (TanStack Table) kết hợp.

## Câu hỏi thường gặp
- **Virtualization dùng được với table không?** Có — TanStack Table kết hợp TanStack Virtual cho table lớn; xử lý cột dính bằng CSS sticky ngoài vùng ảo.
- **Row cao động thì sao?** Dùng `measureElement` + `getItemKey`; TanStack tự đo và hiệu chỉnh offset sau render.
- **Có cần toàn bộ data trong memory không?** Client-side virtualization cần — với dữ liệu vô hạn dùng `useInfiniteQuery` + virtualizer để nạp dần.
- **`overscan` nên đặt bao nhiêu?** 3–10 tùy chiều cao row và tốc độ scroll; quá lớn làm mất lợi ích, quá nhỏ gây chớp trắng.
- **Có thể `scrollToIndex` tới dòng chưa render?** Có — virtualizer tính offset từ `estimateSize`/đo trước đó và cuộn tới, không cần render cả list.

## Ghi chú 2026
- `@tanstack/react-virtual` v3 là lựa chọn hiện đại thay react-window/react-virtualized; hỗ trợ grid, RTL, dynamic size.
- Kết hợp React Compiler: row component ít render dư, nhưng virtualizer vẫn là thứ quyết định DOM nodes.
- Với React 19, có thể dùng `useSyncExternalStore`-style đo lường từ virtualizer mà không lo concurrent tearing.

## Best practices / Mẹo
- Với chiều cao động: đặt `getItemKey` (ví dụ `item.id`), gắn `ref={virtualizer.measureElement}` lên row + `data-index={vi.index}` — TanStack tự đo và hiệu chỉnh offset.
- `overscan` quanh 3–10 tùy chiều row; quá lớn (`>20`) lại render thừa, mất lợi ích.
- Kết hợp **TanStack Query + Virtual**: `useQuery(['rows'])` bơm mảng vào, kết hợp infinite scroll (`useInfiniteQuery` + `scrollToIndex`) cho feed dài.
- `useVirtualizer({ horizontal: true })` cho dòng dài / timeline ngang; `useGridVirtualizer` cho grid 2 chiều (cells dính).
- Khi cần "Nhảy tới phần tử #N": `virtualizer.scrollToIndex(N, { align: 'center' })` — không render cả list.
- Thêm `contain: strict` hoặc `content-visibility: auto` cho row để tăng tốc paint.
- Dùng `getItemKey` (id thật) khi list có thể reorder (kéo thả, sort động).
- Với grid/horizontal, dùng đúng cấu hình (`horizontal: true`, `useGridVirtualizer`) thay vì tự bịa.
- Lazy-load nội dung nặng trong row (ảnh, iframe) để scroll vẫn mượt khi cuộn nhanh.
- Đảm bảo `getScrollElement` trả element ổn định (ref), không tạo mới mỗi render.
- Với row có ảnh, chừa chỗ bằng `aspect-ratio` để đo chiều cao trước khi ảnh tải.
- Reset scroll khi đổi dataset: `virtualizer.scrollToOffset(0)`.
- Virtualize cả sub-list lớn nằm bên trong row nếu cấu trúc lồng phức tạp.
- Test bằng DevTools Performance: số DOM node phải ổn định khi cuộn qua hàng nghìn dòng.
- Đặt `overflow-anchor` hợp lý để tránh nhảy vị trí khi ảnh trong row tải xong.
- Kết hợp `useInfiniteQuery` nạp thêm khi gần đáy, giữ cửa sổ DOM luôn nhỏ.

## Bài tập nhỏ
Nâng `VirtualDemo`: (1) thêm input "Nhảy tới dòng 8.000" dùng `scrollToIndex`; (2) chuyển sang row cao động: mỗi dòng có text dài 1–3 dòng tùy index, dùng `measureElement` — kiểm tra scroll không lệch; (3) bọc data bằng `useQuery` giả lập vài nghìn dòng; (4) đếm node DOM = bao nhiêu sau khi render (DevTools) vs 10.000 nếu không virtualize.

## Reference
- [TanStack Virtual](https://tanstack.com/virtual/latest)
- [TanStack Virtual — dynamic measurement](https://tanstack.com/virtual/latest/docs/framework/react/examples/dynamic)