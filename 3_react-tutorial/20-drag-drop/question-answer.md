# DAY 20 — Hỏi & Đáp: Drag & Drop

> File hỏi–đáp chi tiết cho `3_react-tutorial/20-drag-drop`.
> Đọc kèm: `README.md` (lý thuyết) + `example.tsx` (HTML5 native chạy được; prod dùng dnd-kit).

---

## 1. Kéo thả trong React khác CDK DragDrop ở đâu?

**Hỏi:** Angular có `cdkDropList`/`cdkDrag` làm sẵn, React có gì?

**Đáp:**
- **Không có directive magic.** React có 2 tầng: **HTML5 native API** (đủ demo + học cơ chế) và
  **dnd-kit** (chuẩn prod 2026). Không có `cdkDropList` gắn là xong.
- Triết lý chung cả hai tầng: kéo **không di chuyển DOM trực tiếp** — chỉ `setState` nguồn/đích,
  lúc thả **tạo mảng mới** theo thứ tự mới; React render lại list. Bất biến (immutability) như DAY 2.

---

## 2. Ba sự kiện `onDragStart` / `onDragOver` / `onDrop` làm gì?

**Hỏi:** Mỗi handler trong example đảm nhiệm khâu nào?

**Đáp:**
- `onDragStart` — ghi **nguồn**: `setDragIdx(i)`. Chưa đổi list, chỉ nhớ "đang cầm item nào".
- `onDragOver` — chạy liên tục trên item đích khi kéo qua; **phải `e.preventDefault()`** thì trình duyệt
  mới cho drop. Quên dòng này là `onDrop` **không bao giờ chạy** — lỗi #1 bài này.
- `onDrop` — chốt: gọi `drop(to)` hoán vị (copy mảng → `splice` lấy ra → `splice` chèn vào → mảng mới),
  reset `dragIdx`. Nguồn trùng đích (`dragIdx === to`) thì bỏ qua.

---

## 3. Vì sao `key={it}` (giá trị) mà không phải index?

**Hỏi:** Example dùng `key={it}` — liên quan gì đến DAY 2?

**Đáp:**
- Chính là quy tắc DAY 2 áp dụng thực tế: reorder **đổi thứ tự liên tục**, `key={index}` sẽ giữ nhầm DOM/state
  mỗi lần thả (index dịch mà React tưởng cùng item). Key theo **giá trị/id ổn định** thì React di chuyển
  đúng node, giữ đúng state nội bộ từng item.

---

## 4. HTML5 native thiếu gì? Khi nào sang dnd-kit?

**Hỏi:** Native chạy được rồi, cần lib làm gì?

**Đáp:**
- Native thiếu 3 thứ prod cần: **touch/mobile** (kéo trên điện thoại kém), **a11y** (không keyboard/screen reader),
  **ghost styling** hạn chế.
- **dnd-kit** bù cả ba: headless + keyboard (Space + mũi tên) + touch; cấu trúc
  `<DndContext>` (quản lý kéo) + `<SortableContext>` (list) + `useSortable` (mỗi item: `transform` nhấc lên,
  `listeners` + `attributes` cho a11y) + `arrayMove(arr, from, to)` (≈ `moveItemInArray` CDK).
- Kéo **giữa 2 list**: phân biệt container qua `active`/`over` trong `onDragEnd` (≈ `transferArrayItem`);
  thả ra ngoài (`over` null) thì bỏ qua.

---

## 5. So nhanh CDK ↔ React cho drag & drop?

**Hỏi:** Từng khái niệm CDK tương đương gì?

**Đáp:**

| Angular CDK | React | Ghi chú |
|---|---|---|
| `cdkDropList` / `cdkDrag` | `draggable` + 3 handler / `DndContext` + `useSortable` | Không directive, tự ráp |
| `moveItemInArray` | `arrayMove` (dnd-kit) / `splice` trên copy | Luôn mảng mới |
| `transferArrayItem` | `onDragEnd` phân biệt `active`/`over` | Kéo liên list |
| CDK tự lo a11y cơ bản | dnd-kit `attributes` + keyboard | Native không có |

---

## 6. Tách hàm `move` thuần: vì sao reorder phải là hàm test được, không nằm trong handler?

**Hỏi:** Logic `splice` 2 bước viết thẳng trong `drop` thì sao, tách ra được gì?

**Đáp:**
- Viết thẳng trong handler thì logic dính `setState` — muốn test phải render component + giả drag event, chậm và giòn. Tách thành hàm thuần `move(list, from, to)` (vào mảng cũ, ra mảng mới, không mutate) thì test bằng Vitest gọi hàm thường (như DAY 21): `expect(move(["A","B","C"], 0, 2)).toEqual(["B","C","A"])` — nhanh, bao được biên (from==to, index âm, mảng rỗng).
- Cơ chế bất biến giữ nguyên: `move` copy `[...list]`, `splice(from,1)` rút ra, `splice(to,0,m)` chèn vào, trả mảng mới. Handler `drop` chỉ còn `setItems(xs => move(xs, dragIdx, to))` — mỏng, khó sai. Cùng hàm này tái dùng cho nút "Lên/Xuống" (a11y, câu 10) và cho dnd-kit `onDragEnd` (câu 8).
- Sai thì sao: mutate mảng gốc (`list.splice` trực tiếp trên state) thì React thấy cùng tham chiếu, không re-render — list đứng yên dù đã kéo. Fix: luôn copy trước, hàm thuần ép điều này vì không giữ tham chiếu ngoài.

```tsx
// Hàm thuần: vào mảng cũ + from/to, ra mảng mới — không mutate, dễ test
function move<T>(list: T[], from: number, to: number): T[] {
  if (from === to) return list; // thả về chỗ cũ: no-op, giữ tham chiếu cũ
  const next = [...list]; // bất biến: copy trước khi sửa
  const [m] = next.splice(from, 1); // rút item khỏi vị trí cũ
  next.splice(to, 0, m); // chèn vào vị trí mới
  return next; // mảng mới cho React re-render
}

// Test unit mẫu (Vitest): không cần render, không cần giả drag event
// expect(move(["A", "B", "C"], 0, 2)).toEqual(["B", "C", "A"]);
// expect(move(["A", "B"], 1, 1)).toEqual(["A", "B"]); // no-op giữ nguyên
```

---

## 7. Lưu `id` thay `index`: khi nào index trỏ sai nguồn giữa lúc kéo?

**Hỏi:** Example lưu `dragIdx` (index) chạy tốt với 3 mục — list thật thêm/xóa thì sao?

**Đáp:**
- Index là **vị trí tại thời điểm bắt đầu kéo**, không phải danh tính item. Giữa lúc đang kéo mà list đổi (poll thêm item đầu, user khác xóa, filter gõ) thì index cũ trỏ sang item khác — thả là reorder nhầm, bug "kéo A mà B nhảy" rất khó tái hiện vì phụ thuộc timing.
- Cơ chế fix: mỗi item có `id` ổn định (`{ id: "a", label: "Mục A" }`), `onDragStart` lưu `dragId`, `onDrop` tìm `from = items.findIndex(x => x.id === dragId)` **tại thời điểm thả** — vị trí tươi, không sợ list dịch giữa chừng. `key={it.id}` (không `key={index}`) để React cũng theo danh tính, đúng DAY 2.
- Quy tắc nhận diện: list tĩnh demo thì index đủ; list có thêm/xóa/filter/realtime thì bắt buộc id. Sai thì sao: giữ index cho list động là bug timing — test đơn không lộ, prod đông user mới lộ.

```tsx
import { useState } from "react";

type Item = { id: string; label: string }; // danh tính ổn định, không phải vị trí

function IdList() {
  const [items, setItems] = useState<Item[]>([
    { id: "a", label: "Mục A" }, { id: "b", label: "Mục B" }, { id: "c", label: "Mục C" },
  ]);
  const [dragId, setDragId] = useState<string | null>(null); // lưu id, không lưu index
  const drop = (toId: string) => {
    if (!dragId || dragId === toId) return; // không nguồn hoặc về chỗ cũ -> bỏ qua
    setItems((xs) => {
      const from = xs.findIndex((x) => x.id === dragId); // vị trí tươi lúc thả
      const to = xs.findIndex((x) => x.id === toId); // đích cũng tìm tươi
      const next = [...xs]; // copy bất biến
      const [m] = next.splice(from, 1); // rút ra
      next.splice(to, 0, m); // chèn vào
      return next;
    });
    setDragId(null); // reset nguồn sau thả
  };
  return (
    <ul>
      {items.map((it) => (
        <li key={it.id} draggable
          onDragStart={() => setDragId(it.id)} // ghi danh tính nguồn
          onDragOver={(e) => e.preventDefault()} // bắt buộc để cho drop
          onDrop={() => drop(it.id)}>{it.label}</li>
      ))}
    </ul>
  );
}
```

---

## 8. dnd-kit `SortableItem` đầy đủ: `setNodeRef` + `transform` + `listeners` mỗi cái làm gì?

**Hỏi:** Bốn giá trị `useSortable` trả về mà thiếu một thì hỏng thế nào?

**Đáp:**
- `useSortable({ id })` là headless — nó không render gì, chỉ trả "nguyên liệu hành vi", bạn tự ráp vào element. `setNodeRef` gắn vào `ref` để dnd-kit đo vị trí/kích thước item (thiếu là kéo không hoạt động — sensor không biết node nào). `transform` là độ dịch khi đang nhấc (thiếu là item không "bay theo chuột", cảm giác chết). `attributes` mang ARIA + role cho screen reader/keyboard (thiếu là mất a11y). `listeners` mang pointer/keyboard handler (thiếu là không bắt được kéo, hoặc chỉ kéo được mà không dùng bàn phím được).
- Cơ chế `onDragEnd({ active, over })`: `active.id` là nguồn, `over?.id` là đích — tìm index hai bên rồi `arrayMove(items, from, to)` (bản lib của hàm `move` câu 6). `over` null (thả ra ngoài list) thì bỏ qua, không đổi gì.
- Sai thì sao: gắn `listeners` vào cả item có nút bên trong mà không `activationConstraint` thì click nút cũng kích kéo. Fix: `useSensor(PointerSensor, { activationConstraint: { distance: 5 } })` — di quá 5px mới tính là kéo (câu 10).

```tsx
import { DndContext, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useState } from "react";

function SortableItem({ id }: { id: string }) {
  // Lấy đủ 4 nguyên liệu hành vi từ hook headless
  const { attributes, listeners, setNodeRef, transform } = useSortable({ id });
  return (
    <li
      ref={setNodeRef} // bắt buộc: để dnd-kit đo vị trí, thiếu là kéo chết
      style={{ transform: CSS.Transform.toString(transform) }} // item "nhấc lên" theo chuột
      {...attributes} // ARIA + role cho screen reader/keyboard
      {...listeners} // handler kéo (chuột + bàn phím Space/mũi tên)
    >
      {id}
    </li>
  );
}
```

---

## 9. Kéo giữa 2 cột Kanban (`transferArrayItem`): `active`/`over` phân biệt cột thế nào?

**Hỏi:** Todo → Done khác list thì `arrayMove` một mảng không đủ — state tổ chức sao?

**Đáp:**
- Cơ chế: state tách theo cột (`columns: { todo: [...], done: [...] }`), mỗi cột một `<SortableContext items={cột}>` trong cùng một `<DndContext>`. `onDragEnd({ active, over })` cho biết nguồn (`active.id`) và đích (`over.id` + cột chứa nó) — cùng cột thì `arrayMove` trong cột đó (≈ `moveItemInArray` CDK), khác cột thì rút khỏi cột nguồn + chèn vào cột đích (≈ `transferArrayItem` CDK).
- Vì sao cần `over` null check: thả ra ngoài mọi cột (khoảng trắng) thì `over` null — phải bỏ qua, không xóa item. Quên là kéo rớt ra ngoài mất item, bug mất dữ liệu hiển thị.
- Sai thì sao: giữ 1 mảng phẳng cho cả board thì không biết item thuộc cột nào sau khi kéo — render sai cột. Fix: state theo cột từ đầu, `onDragEnd` cập nhật **bất biến cả 2 cột** (copy object + copy mảng liên quan).

| CDK Angular | dnd-kit React | Ghi chú |
|---|---|---|
| `moveItemInArray` (cùng list) | `arrayMove(cột, from, to)` | Cùng cột |
| `transferArrayItem` (khác list) | Rút nguồn + chèn đích, setState 2 cột | Đọc cột qua `over`/`active` |
| `cdkDropListConnectedTo` | Một `DndContext` bao nhiều `SortableContext` | Kéo chéo cột |
| `cdkDragPreview` | `<DragOverlay>` | Bóng item khi kéo (câu 10) |

---

## 10. A11y + cảm giác prod: nút Lên/Xuống, `DragOverlay`, `activationConstraint`?

**Hỏi:** Ba mảnh này giải quyết 3 nỗi đau nào của native (bàn phím, cảm giác, click nhầm)?

**Đáp:**
- **Nút Lên/Xuống** (phương án không kéo): mỗi item có 2 nút gọi chung hàm `move` (câu 6) — user bàn phím/screen reader reorder được mà không cần kéo, test cũng ổn định hơn giả drag event. Đây là yêu cầu a11y tối thiểu nếu giữ native; dnd-kit thì có keyboard sensor (Space nhấc + mũi tên di + Space thả) + `announcements` đọc cho screen reader.
- **`DragOverlay`** (bóng khi kéo): item gốc giữ chỗ (tránh list nhảy), overlay bay theo chuột — cảm giác "nhấc lên" như CDK `cdkDragPreview`. Kết hợp Motion `layout` (DAY 19) thì item còn lại trượt mượt về chỗ mới.
- **`activationConstraint`**: item có nút/link bên trong mà kéo nhạy quá thì click cũng thành kéo. Đặt `distance: 5` (di 5px mới kéo) hoặc `delay` cho touch — click thường an toàn, kéo thật vẫn mượt.
- Sai thì sao: không có phương án bàn phím là rớt audit a11y; không overlay thì ghost mặc định của trình duyệt xấu + hạn chế style; không constraint thì user kêu "bấm nút mà nó kéo". Fix: cả ba từ đầu khi lên prod.

```tsx
// Nút Lên/Xuống dùng chung hàm move thuần: a11y + test ổn định, không cần giả drag
function MoveButtons({ index, total, onMove }: {
  index: number; total: number; onMove: (from: number, to: number) => void;
}) {
  return (
    <span>
      {/* Disabled ở biên: đầu không lên, cuối không xuống */}
      <button disabled={index === 0} onClick={() => onMove(index, index - 1)}>Lên</button>
      <button disabled={index === total - 1} onClick={() => onMove(index, index + 1)}>Xuống</button>
    </span>
  );
}
```

---

## Reference

- `README.md` + `example.tsx` trong cùng thư mục (DAY 20)
- https://docs.dndkit.com/ (`DndContext`, `useSortable`, `arrayMove`)
- https://developer.mozilla.org/en-US/docs/Web/API/HTML_Drag_and_Drop_API
