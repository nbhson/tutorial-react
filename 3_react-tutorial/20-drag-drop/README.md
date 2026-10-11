# DAY 20: DRAG & DROP

## Mục tiêu bài học
- Hiểu 2 tầng drag & drop: **HTML5 native API** (đủ cho demo, học cơ chế) và **dnd-kit** (chuẩn production 2026: sortable, a11y, touch tốt).
- Đối chiếu với Angular CDK DragDrop (`cdkDropList`, `cdkDrag`, `moveItemInArray`).
- Nắm mấu chốt: kéo thả trong React = **cập nhật state mảng** khi thả (immutable), React re-render theo thứ tự mới.

## Khái niệm cốt lõi (Core)
- **Drag & drop trong React không có "magic directive".** Angular CDK cho bạn `cdkDropList`/`cdkDrag` làm sẵn; React dùng HTML5 events (`onDragStart/onDragOver/onDrop`) hoặc thư viện như dnd-kit.
- **State-driven reorder:** kéo không di chuyển DOM trực tiếp — nó chỉ set state (`dragIdx`), khi drop thì **tạo mảng mới** theo thứ tự mới; React render lại list. Đây là nguyên tắc bất biến (immutability) đã quen từ DAY 2.
- **HTML5 native API:** `draggable` + `onDragStart` (ghi index), `onDragOver` (phải `preventDefault` mới cho drop), `onDrop` (đổi chỗ). Chỉ giới hạn: touch/mobile kém, a11y không có, styling ghost hạn chế.
- **dnd-kit — khuyến nghị 2026:** headless, hỗ trợ keyboard (Space + mũi tên), screen reader, cảm ứng. Cấu trúc: `<DndContext>` (quản lý kéo) + `<SortableContext>` (list) + `useSortable` (mỗi item) + `arrayMove`.
- **`arrayMove(arr, from, to)`:** helper dnd-kit trả mảng mới đã hoán vị — chính là tương đương `moveItemInArray` của CDK.
- **Kéo giữa 2 list:** dùng `onDragEnd` + phân biệt container theo `active`/`over` (tương đương `transferArrayItem`).
- **Keyword chính:** `draggable`, `onDragStart`, `onDragOver` + `preventDefault`, `onDrop`, `DndContext`, `SortableContext`, `useSortable`, `arrayMove`, `closestCenter`, `verticalListSortingStrategy`.

## Luồng hoạt động (Flow)
1. Render `App` với `items = ["Mục A","Mục B","Mục C"]`; mỗi `<li>` có `draggable` + handler.
2. Người dùng bắt đầu kéo item index `i` → `onDragStart` chạy → `setDragIdx(i)` (chỉ lưu nguồn, chưa đổi list).
3. Kéo qua item đích → `onDragOver` fire liên tục trên item đích → gọi `e.preventDefault()` để **cho phép drop** (nếu không gọi, `onDrop` sẽ không chạy).
4. Thả → `onDrop` fire trên item đích (index `to`) → gọi `drop(to)`.
5. `drop(to)`: nếu `dragIdx === null` hoặc bằng `to` → bỏ qua; ngược lại `setItems(xs => ...)`:
   - copy mảng `next = [...xs]`;
   - `splice(dragIdx,1)` lấy item ra;
   - `splice(to,0,m)` chèn vào vị trí mới;
   - trả `next` (mảng mới).
6. `setDragIdx(null)` reset; React re-render list theo thứ tự mới — không cần thao tác DOM thủ công.
7. (dnd-kit) `useSortable` cung cấp `transform` để item "nhấc lên", `listeners` gắn vào handle, `attributes` cho a11y; `arrayMove` lo hoán vị.
8. `DndContext` gọi `onDragEnd({ active, over })` → tìm index nguồn/đích → `arrayMove` → `setItems` mảng mới; nếu `over` null (thả ra ngoài) thì bỏ qua.

## Ví dụ chi tiết
```tsx
// example.tsx — DAY 20: HTML5 drag native tối giản (học cơ chế; prod dùng dnd-kit)
import { useState } from "react";

export default function App() {
  const [items, setItems] = useState(["Mục A", "Mục B", "Mục C"]);
  const [dragIdx, setDragIdx] = useState<number | null>(null); // nguồn đang kéo

  const drop = (to: number) => {
    // Không có nguồn hoặc thả về chính chỗ của nó -> no-op
    if (dragIdx === null || dragIdx === to) return;
    setItems((xs) => {
      const next = [...xs];          // bất biến: tạo mảng mới
      const [m] = next.splice(dragIdx, 1); // lấy item ra khỏi vị trí cũ
      next.splice(to, 0, m);         // chèn vào vị trí mới
      return next;
    });
    setDragIdx(null); // reset nguồn
  };

  return (
    <ul>
      {items.map((it, i) => (
        <li
          key={it}                                // key ổn định (DAY 2)
          draggable                               // bật kéo HTML5
          onDragStart={() => setDragIdx(i)}       // ghi nguồn
          onDragOver={(e) => e.preventDefault()}  // BẮT BUỘC để cho drop
          onDrop={() => drop(i)}                  // cập nhật thứ tự
          style={{ padding: 8, margin: 4, border: "1px solid #999", cursor: "grab" }}
        >
          {it}
        </li>
      ))}
    </ul>
  );
}
```

```tsx
// dnd-kit sortable (chuẩn prod) — `npm i @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities`
import { DndContext, closestCenter } from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

function Item({ id }: { id: string }) {
  const { attributes, listeners, setNodeRef, transform } = useSortable({ id });
  return (
    <li ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform) }} {...attributes} {...listeners}>
      {id}
    </li>
  );
}
// onDragEnd: dùng arrayMove(items, from, to) — tương đương moveItemInArray
```

## Giải thích từng phần
- `draggable`: thuộc tính HTML5 cho phép element bị kéo — không có nó, drag không bắt đầu.
- `onDragStart={() => setDragIdx(i)}`: HTML5 API chỉ đưa `dataTransfer` (string), nên ta dùng closure index `i` cho gọn. Trong list động lớn, lưu id thay index an toàn hơn.
- `onDragOver={(e) => e.preventDefault()}`: **chi tiết bắt buộc** — mặc định trình duyệt từ chối drop; gọi `preventDefault` "cho phép" mới nhận `onDrop`. Quên = drop không chạy (pitfall số 1).
- `const next = [...xs]`: bất biến — không mutate mảng state cũ; React cần tham chiếu mới để cập nhật.
- `splice` 2 bước: rút item khỏi vị trí cũ rồi chèn vào vị trí mới — chính là logic `arrayMove`.
- `key={it}`: dùng chính nội dung/ID làm key để React theo dõi item khi thứ tự đổi; tránh `key={index}` (DAY 2).
- dnd-kit: `useSortable` tách "behavior" (ref, listeners, attributes, transform) khỏi render — bạn tự render UI, gắn đủ prop.
- **`useSortable` vs `useDraggable`:** `useSortable` thêm `transform`/`transition` cho list; `useDraggable` thuần cho kéo tự do không sắp xếp.

## Bảng so sánh Angular ↔ React
| Angular CDK | React | Ghi chú |
|---|---|---|
| `cdkDropList` | `<DndContext>` + `<SortableContext>` | dnd-kit cần 2 context |
| `cdkDrag` | `useSortable()` + `listeners`/`attributes` | Headless, tự render |
| `moveItemInArray` | `arrayMove` | Cùng helper hoán vị |
| `transferArrayItem` | tự setState 2 list trong `onDragEnd` | Phân biệt list qua over/active |
| `cdkDropListConnectedTo` | `DndContext` bao nhiều list | Kéo chéo list |
| `cdkDragPreview` | `<DragOverlay>` (dnd-kit) | Preview khi kéo |
| CDK drag built-in | HTML5 native hoặc dnd-kit | React chọn thư viện |
| `cdkDragHandle` | `listeners` gắn vào handle | Kéo chỉ từ handle |
| `enterPredicate` (chặn nhận) | `disabled`/`data` trên sortable | Logic trong `onDragOver` |

## Lỗi thường gặp (Common pitfalls)
- **Quên `onDragOver` `preventDefault`** → thả không có tác dụng. → Fix: luôn gọi `e.preventDefault()` trong `onDragOver` (native), hoặc dùng dnd-kit (tự lo).
- **`key={index}`** cho list sortable → React nhầm item, nội dung nhảy sai / animation loạn. → Fix: key theo id ổn định.
- **Mutate state** (`items.splice(...)`) → React không thấy đổi (cùng tham chiếu). → Fix: tạo mảng mới (`[...items]`).
- **Không reset `dragIdx`** sau drop → kéo lần sau trỏ sai nguồn. → Fix: `setDragIdx(null)` sau update.
- **Dùng index làm định danh khi list có thể thêm/xóa song song** → nguồn sai khi mảng đổi giữa lúc kéo. → Fix: lưu id, tìm index khi drop.
- **HTML5 DnD trên mobile/touch không chạy** → UX vỡ trên điện thoại. → Fix: dùng dnd-kit (hỗ trợ Pointer/Touch/Keyboard sensor).
- **Thiếu a11y cho kéo thả** → người dùng bàn phím/screen reader không dùng được. → Fix: dnd-kit `attributes`/`listeners` + `announcements` (hoặc ít nhất nút "lên/xuống").
- **Quên `setNodeRef`** trong `useSortable` → item không đo được vị trí, kéo không hoạt động. → Fix: luôn gắn `ref={setNodeRef}` vào element gốc.

## Best practices / Mẹo
- **Demo/học:** HTML5 native đủ để hiểu event flow. **Prod:** luôn dùng dnd-kit (hoặc Pragmatic D&D của Atlassian cho board lớn) — a11y, touch, animation sẵn.
- Giữ logic hoán vị trong **hàm thuần** `move(list, from, to)` — dễ test (DAY 21) và tái dùng cho keyboard reorder.
- Kết hợp Motion/`<DragOverlay>` cho cảm giác "nhấc lên"; `layout` animation làm item trượt mượt về vị trí mới.
- Với Kanban (kéo giữa cột), tách state theo cột (`columns: {todo: [...], done: [...]}`) và xử lý `onDragEnd` cập nhật cả 2 cột bất biến.
- Luôn cung cấp **phương án không kéo** (nút "Di chuyển lên/xuống") cho a11y và để test ổn định hơn.
- **Tách `SortableItem` component** cho mỗi phần tử — gọn, dễ memo và tái dùng.
- **Bật `activationConstraint` (distance/delay)** khi item có nút bên trong, tránh vô tình kéo khi click.

## Bài tập nhỏ
1. Nâng cấp ví dụ native: dùng **id** thay index (mỗi mục có `id`), hỗ trợ cả kéo từ A sang B bằng cách thêm `onDragEnter` highlight; đảm bảo không sửa state trực tiếp.
2. Cài dnd-kit, chuyển list thành sortable có keyboard sensor (Space để "nhấc", mũi tên để di chuyển, Space để thả) và `<DragOverlay>` hiển thị preview — kiểm tra bằng Tab/Enter bàn phím.
3. Thêm nút "Lên/Xuống" cho mỗi item làm phương án không kéo (a11y), dùng chung hàm `move` thuần.
4. Thêm `<DragOverlay>` hiển thị preview và đo perf khi list 50 item.

## Reference
- https://docs.dndkit.com/
- https://developer.mozilla.org/en-US/docs/Web/API/HTML_Drag_and_Drop_API
- https://github.com/atlassian/pragmatic-drag-and-drop