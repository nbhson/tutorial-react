# DAY 20: DRAG & DROP

## Mục tiêu bài học
- Hiểu 2 tầng drag & drop: **HTML5 native API** (đủ cho demo, học cơ chế) và **dnd-kit** (chuẩn production 2026: sortable, a11y, touch tốt).
- Đối chiếu với Angular CDK DragDrop (`cdkDropList`, `cdkDrag`, `moveItemInArray`).
- Nắm mấu chốt: kéo thả trong React = **cập nhật state mảng** khi thả (immutable), React re-render theo thứ tự mới.

## Khái niệm cốt lõi (Core)

### 1. Không directive ma thuật — chỉ events + state
Angular CDK cho `cdkDropList`/`cdkDrag`/`cdkDragHandle` làm sẵn (preview, placeholder,touch). React native chỉ có HTML5 events (`onDragStart/onDragEnter/onDragOver/onDrop/onDragEnd`) + thuộc tính `draggable`. Kéo không di chuyển DOM trực tiếp — nó set state (`dragId`), thả thì **tạo mảng mới** thứ tự mới; React vẽ lại. Đúng nguyên tắc bất biến DAY 2.

```tsx
// example.tsx: 4 events + 1 state là đủ demo
<li draggable // bật kéo
  onDragStart={() => setDragId(it.id)} // ghi nguồn (id, không index)
  onDragOver={(e) => e.preventDefault()} // CHO PHÉP drop (quên là onDrop không chạy)
  onDrop={() => dropOn(it.id)} // setState mảng mới bất biến
  onDragEnd={reset} // thả ra ngoài cũng reset
>
```

Vì sao id mà không index? Vì index dịch khi list thêm/xóa giữa lúc kéo (socket thêm item lúc đang kéo) — nguồn index cũ trỏ sai item. Id ổn định + `findIndex` lúc drop luôn đúng.

### 2. HTML5 native — đủ học, thiếu prod
`draggable` + ghi nguồn + `preventDefault` ở `onDragOver` + đổi chỗ ở `onDrop`. Giới hạn: touch/mobile không chạy (cần Pointer/Touch sensor), a11y không (keyboard/screen reader bó tay), ghost style hạn chế, kéo giữa 2 list tự lo. Demo/học thì đủ; prod (board, kanban, mobile) thì dnd-kit.

### 3. dnd-kit — chuẩn prod 2026
Headless + keyboard (Space nhấc, arrows di, Space thả) + screen reader announcements + touch/pointer sensor + `DragOverlay` preview + `arrayMove` + `closestCenter`/`verticalListSortingStrategy` + `activationConstraint` (kéo khi đủ distance/delay, tránh nhầm click nút trong). Cấu trúc: `<DndContext>` (quản kéo + `onDragEnd`) + `<SortableContext items strategy>` (list) + `useSortable({ id })` mỗi item (cho `setNodeRef`/`transform`/`listeners`/`attributes`).

```tsx
// dnd-kit sortable (npm i @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities):
import { DndContext, closestCenter } from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

function Item({ id }: { id: string }) {
  // useSortable tách behavior (ref/listeners/attributes/transform) khỏi UI — bạn tự render
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  return (
    <li ref={setNodeRef} // BẮT BUỘC: không gắn là không đo vị trí, kéo không chạy
      style={{ transform: CSS.Transform.toString(transform), transition }}
      {...attributes} {...listeners}> {/* a11y + handle kéo */}
      {id}
    </li>
  );
}
// Cha:
<DndContext collisionDetection={closestCenter} onDragEnd={({ active, over }) => {
  if (!over || active.id === over.id) return; // thả ra ngoài/về chỗ cũ -> no-op
  setItems((xs) => arrayMove(xs, xs.findIndex((x) => x.id === active.id), xs.findIndex((x) => x.id === over.id)));
}}>
  <SortableContext items={items.map((x) => x.id)} strategy={verticalListSortingStrategy}>
    {items.map((x) => <Item key={x.id} id={x.id} />)}
  </SortableContext>
</DndContext>
```

`arrayMove(arr, from, to)` = `moveItemInArray` CDK (rút + chèn, trả mảng mới). Kéo giữa 2 cột (kanban) thì `onDragEnd` phân biệt container qua `active.data`/`over.data` + setState 2 cột bất biến (tương đương `transferArrayItem`).

### 4. Hàm `move` thuần — trái tim test được
`move(list, from, to)` trong example: copy + splice 2 bước, không mutate gốc. Dùng chung cho drop native, nút Lên/Xuống (a11y), `onDragEnd` dnd-kit. Test `expect(move(["a","b","c"], 0, 2)).toEqual(["b","c","a"])` không cần render (DAY 21).

### Keyword chính
`draggable`, `onDragStart` (ghi nguồn id), `onDragEnter/Leave` (highlight), `onDragOver` + `preventDefault` (cho drop — quên là liệt), `onDrop` (setState mới), `onDragEnd` (reset cả thả ngoài), `move`/`arrayMove` (hoán vị bất biến), `DndContext`/`SortableContext`/`useSortable`/`setNodeRef`/`transform`/`attributes`/`listeners`, `DragOverlay`, keyboard sensor, `activationConstraint`.

## Luồng hoạt động (Flow)
1. Render với 3 item id `a/b/c`; mỗi `<li>` `draggable` + 5 handler + `key={id}` + nút ↑/↓ a11y.
2. Bắt đầu kéo A → `onDragStart` → `setDragId("a")` (chỉ nguồn, chưa đổi list). Style nguồn mờ (`opacity 0.5`).
3. Kéo qua B → `onDragEnter` B → `setOverId("b")` → B highlight (`background #e3f2fd`). Rời B → `onDragLeave` xóa (nếu vẫn B).
4. Kéo qua đâu cũng `onDragOver` fire liên tục → `e.preventDefault()` **cho phép** drop. Không gọi là trình duyệt từ chối, `onDrop` không bao giờ chạy (pitfall #1).
5. Thả trên C → `onDrop` C → `dropOn("c")`: nguồn `"a"` ≠ đích `"c"` → `setItems(xs => ...)`: `findIndex` lúc drop (from 0, to 2) → `move` (copy + splice rút + chèn) → mảng mới `[b, c, a]`.
6. `setDragId/overId(null)` reset. React re-render theo thứ tự mới (`key` ổn định nên node di chuyển, không tạo lại — state/focus giữ). Không có `move` tay DOM nào.
7. Thả về A (cùng chỗ) hoặc ra ngoài (`over` null, chỉ `onDragEnd`) → no-op/reset, không setState thừa.
8. Nút ↑/↓: `step(id, ±1)` → `findIndex` + `move` chung — không kéo vẫn reorder (keyboard/screen reader/test).
9. (dnd-kit) `useSortable` cho `transform` (nhấc lên khi kéo) + `listeners` (handle) + `attributes` (role/tabIndex/aria) + `setNodeRef` (đo). `onDragEnd({ active, over })` → index qua id → `arrayMove` → `setItems` mới. `over` null (ra ngoài) thì bỏ qua. `<DragOverlay>` preview bay theo chuột; `layout` Motion trượt về chỗ (DAY 19).

## Ví dụ chi tiết
Khớp 1-1 với `example.tsx` (native + id + highlight + nút a11y + `move` thuần):

```tsx
// example.tsx — DAY 20: native DnD (học) + id ổn định + highlight + nút a11y + dnd-kit ý tưởng
// Mục đích: kéo thả = setState mảng bất biến khi drop; prod dùng dnd-kit (touch/keyboard).
import { useState } from "react"; // (1) items (thứ tự) + dragId (nguồn) + overId (highlight đích)

type Item = { id: string; label: string }; // (2) id ỔN ĐỊNH làm key + định danh kéo (không index — index dịch khi list đổi giữa lúc kéo)

const INITIAL: Item[] = [ // (3) Dữ liệu id ổn định — key={it.id} để reorder giữ đúng state (DAY 2)
  { id: "a", label: "Mục A" },
  { id: "b", label: "Mục B" },
  { id: "c", label: "Mục C" },
];

// (4) Hàm thuần hoán vị — dễ test (DAY 21), tái dùng cho nút Lên/Xuống (a11y) + dnd-kit onDragEnd.
export function move<T>(list: T[], from: number, to: number): T[] {
  if (from === to) return list; // no-op thả về chỗ cũ
  const next = [...list]; // bất biến: copy, không splice gốc (splice gốc là mutate state)
  const [m] = next.splice(from, 1); // rút khỏi cũ
  next.splice(to, 0, m); // chèn vào mới — chính là arrayMove của dnd-kit
  return next;
}

export default function App() {
  const [items, setItems] = useState(INITIAL);
  const [dragId, setDragId] = useState<string | null>(null); // (5) Nguồn là id (không index) — an toàn khi mảng đổi giữa lúc kéo
  const [overId, setOverId] = useState<string | null>(null); // (6) Đích để highlight khi kéo qua (onDragEnter/Leave)

  const dropOn = (toId: string) => {
    // (7) No-op khi không nguồn hoặc về chỗ cũ — không setState thừa
    if (dragId === null || dragId === toId) { setOverId(null); return; }
    setItems((xs) => {
      const from = xs.findIndex((x) => x.id === dragId); // tìm index lúc drop (không tin index lúc drag)
      const to = xs.findIndex((x) => x.id === toId);
      if (from === -1 || to === -1) return xs;
      return move(xs, from, to); // mảng mới -> React re-render thứ tự mới, không đụng DOM tay
    });
    setDragId(null); setOverId(null); // (8) Reset nguồn/highlight sau drop
  };

  // (9) Phương án không kéo (a11y + test ổn định): nút Lên/Xuống dùng chung move().
  const step = (id: string, dir: -1 | 1) => {
    setItems((xs) => {
      const i = xs.findIndex((x) => x.id === id);
      const j = i + dir;
      if (i === -1 || j < 0 || j >= xs.length) return xs;
      return move(xs, i, j);
    });
  };

  return (
    <ul>
      {items.map((it) => (
        <li
          key={it.id} // (10) Key ổn định — KHÔNG key={index} (reorder là index dịch, state nhảy sai)
          draggable // (11) Bật kéo HTML5 — không có là drag không bắt đầu
          onDragStart={() => setDragId(it.id)} // (12) Ghi nguồn là id (dataTransfer string cũng được nhưng id state gọn demo)
          onDragEnter={() => setOverId(it.id)} // highlight đích khi kéo qua
          onDragLeave={() => setOverId((o) => (o === it.id ? null : o))}
          onDragOver={(e) => e.preventDefault()} // (13) BẮT BUỘC: mặc định trình duyệt từ chối drop; không gọi là onDrop không chạy (pitfall #1)
          onDrop={() => dropOn(it.id)} // (14) Thả là setState mảng mới (bất biến), React vẽ thứ tự mới
          onDragEnd={() => { setDragId(null); setOverId(null); }} // thả ra ngoài (over null) cũng reset
          style={{
            padding: 8, margin: 4, border: "1px solid #999", cursor: "grab",
            background: overId === it.id ? "#e3f2fd" : "#fff", // highlight đích
            opacity: dragId === it.id ? 0.5 : 1, // mờ nguồn đang kéo
          }}
        >
          {it.label}
          {/* (15) Nút a11y: keyboard/screen reader + test ổn định hơn kéo */}
          <button onClick={() => step(it.id, -1)} aria-label={`Di chuyển ${it.label} lên`}>↑</button>
          <button onClick={() => step(it.id, 1)} aria-label={`Di chuyển ${it.label} xuống`}>↓</button>
        </li>
      ))}
    </ul>
  );
}

// Ghi chú dnd-kit prod (xem README copy):
// DndContext + SortableContext + useSortable({ id }) -> attributes/listeners/setNodeRef/transform +
// arrayMove(items, from, to) trong onDragEnd({ active, over }) + DragOverlay preview +
// keyboard sensor (Space nhấc, arrows di, Space thả) + activationConstraint (tránh kéo nhầm khi click nút trong).
```

dnd-kit sortable đầy đủ (copy vào prod):

```tsx
// npm i @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

function Item({ id }: { id: string }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  return (
    <li ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }} {...attributes} {...listeners}>
      {id} <button>Theo handle dưới sẽ kéo từ tay cầm</button>
    </li>
  );
}
// Cha: sensors (pointer + keyboard) + onDragEnd arrayMove + DragOverlay + SortableContext strategy
```

## Giải thích từng phần
- Dòng `type Item = { id: string; label: string }`: id ổn định vừa key vừa định danh kéo. Vì sao string id mà không index? Vì index là vị trí (đổi khi reorder), id là danh tính (giữ khi reorder) — kéo cần danh tính.
- Khối `move(list, from, to)`: thuần (cùng input → cùng output, không đụng ngoài) nên test không render. `from === to` trả mảng gốc (không set mới thừa). `[...list]` copy rồi mới splice — splice gốc là mutate state (cùng tham chiếu, React không thấy). Đây chính `arrayMove` (dnd-kit) / `moveItemInArray` (CDK).
- Dòng `dragId: string | null` (không number index): null khi không kéo. Vì sao id? Để `findIndex` lúc drop (mảng có thể đổi giữa lúc kéo — socket thêm item). Index lúc drag + mảng đổi = trỏ sai.
- Dòng `overId` + `onDragEnter/Leave`: highlight đích (UX biết thả vào đâu). Vì sao 2 events? Vì Enter (vào) bật, Leave (ra) tắt — chỉ Enter mà không Leave là highlight kẹt khi kéo nhanh qua nhiều item.
- Dòng `onDragOver={(e) => e.preventDefault()}`: **bắt buộc duy nhất**. Mặc định HTML5 từ chối drop (trừ input/textarea). `preventDefault` là "tôi cho thả ở đây". Quên là `onDrop` im lặng không chạy — không lỗi console để tìm (pitfall #1 mọi người gặp 1 lần).
- Khối `dropOn(toId)`: no-op khi `dragId null` (drop không từ drag mình) hoặc `=== toId` (về chỗ). `findIndex` cả hai đầu lúc drop (không tin index cũ). `from/to === -1` (id lạ) trả mảng gốc. `move` trả mảng mới → re-render. Reset cả hai state sau (kể cả no-op cũng xóa highlight).
- Dòng `onDragEnd={reset}`: thả ra ngoài (không `onDrop` nào) thì chỉ `dragEnd` chạy — không reset là `dragId` kẹt, lần sau drop sai nguồn. `dragEnd` luôn chạy dù drop đâu (khác `drop` chỉ trên đích).
- Dòng `key={it.id}`: reorder mà key index là node tái sai (input dòng 2 nhảy lên 1, DAY 2). Id ổn định là node di chuyển giữ state (focus/animation).
- Khối `step(id, dir)`: nút ↑/↓ dùng chung `move` — a11y (keyboard Tab + Enter, screen reader `aria-label`), test ổn định (click nút thay kéo — kéo khó test E2E). Biên (`j < 0`/`>= length`) trả gốc (không làm gì).
- dnd-kit `setNodeRef`: ref đo vị trí/kích thước để tính va chạm (`closestCenter`). Quên gắn là item "vô hình" với hệ thống (kéo không hít, `over` null). `transform`/`transition` từ hook (không tự tính) + `CSS.Transform.toString`.
- dnd-kit `attributes`/`listeners`: `attributes` (role/tabIndex/aria-describedby) + `listeners` (pointer/keyboard handlers). Tách để gắn `listeners` vào tay cầm riêng (`cdkDragHandle`): kéo chỉ từ handle, nút trong không bị kéo nhầm (+ `activationConstraint: { distance: 5 }`).

## Bảng so sánh Angular ↔ React
| Angular CDK | React (native / dnd-kit) | Ghi chú |
|---|---|---|
| `cdkDropList` (vùng thả) | `<DndContext>` + `<SortableContext>` (2 tầng) | dnd-kit tách quản kéo + list sortable |
| `cdkDrag` (phần tử kéo) | `draggable` (native) / `useSortable()` + `listeners`/`attributes` | Headless: tự render, gắn behavior |
| `moveItemInArray(arr, from, to)` | `move()` (example) / `arrayMove` (dnd-kit) | Cùng rút + chèn bất biến |
| `transferArrayItem` (2 list) | `setState` 2 cột trong `onDragEnd` (phân biệt qua `active`/`over` data) | Kanban: `columns: { todo, done }` cập nhật cả hai |
| `cdkDropListConnectedTo` (nối list) | `DndContext` bọc nhiều `SortableContext` | Kéo chéo list trong 1 context |
| `cdkDragPreview` (bóng kéo) | `<DragOverlay>` (dnd-kit) | Preview bay theo chuột, gốc giữ chỗ |
| `cdkDragPlaceholder` (giữ chỗ) |fluido `transform` + CSS khi kéo | Giữ layout không sập khi nhấc |
| `cdkDragHandle` (tay cầm) | `listeners` gắn vào handle + `activationConstraint` | Kéo chỉ từ handle, click nút trong không nhầm |
| `enterPredicate` (chặn nhận) | `disabled`/`data` + check trong `onDragOver`/`onDragEnd` | Logic chặn ở event |
| CDK touch + a11y sẵn | native thiếu → dnd-kit sensor/keyboard/announcements | Prod mobile/a11y phải dnd-kit |

## Lỗi thường gặp (Common pitfalls)

### 1. Quên `preventDefault` ở `onDragOver` → drop liệt
```tsx
// ❌ SAI: onDrop không bao giờ chạy, không lỗi console — tưởng code sai chỗ khác
<li onDragStart={...} onDrop={() => drop(i)}>{it}</li>
```
```tsx
// ✅ ĐÚNG: luôn preventDefault để cho drop (như example)
<li onDragStart={...} onDragOver={(e) => e.preventDefault()} onDrop={() => drop(i)}>{it}</li>
// dnd-kit không cần (tự lo va chạm) — 1 lý do chuyển prod
```

### 2. `key={index}` cho sortable → nhảy sai
```tsx
// ❌ SAI: kéo A xuống C, input/focus/animation nhảy theo index, không theo item
{items.map((it, i) => <li key={i}>{it}</li>)}
```
```tsx
// ✅ ĐÚNG: key id ổn định (như example) — node di chuyển giữ state
{items.map((it) => <li key={it.id}>{it}</li>)}
```

### 3. Mutate state (`splice` gốc) → không thấy đổi
```tsx
// ❌ SAI: cùng tham chiếu, React bỏ qua (hoặc thấy nửa vời)
setItems((xs) => { const [m] = xs.splice(from, 1); xs.splice(to, 0, m); return xs; });
```
```tsx
// ✅ ĐÚNG: copy rồi splice (như move trong ví dụ)
setItems((xs) => move(xs, from, to)); // move copy [...list] bên trong
```

### 4. Không reset `dragId`/`overId` → lần sau sai nguồn + highlight kẹt
Mô tả: drop xong quên `setDragId(null)` là kéo B vẫn nguồn A; `overId` kẹt highlight. Fix: reset cả drop thành công + no-op + `onDragEnd` (thả ngoài) như example.

### 5. Nguồn index khi list đổi giữa lúc kéo → trỏ sai
```tsx
// ❌ SAI: drag index 0, socket thêm đầu lúc đang kéo -> drop index 0 là item khác
onDragStart={() => setDragIdx(i)} ... drop: move(xs, dragIdx, to)
```
```tsx
// ✅ ĐÚNG: nguồn id + findIndex lúc drop (như example)
onDragStart={() => setDragId(it.id)} ... drop: move(xs, find(id), find(toId))
```

### 6. Native trên mobile/touch không chạy → UX vỡ điện thoại
Mô tả: `draggable` desktop ổn, mobile không fire. Fix: dnd-kit Pointer/Touch/Keyboard sensor (1 code chạy cả 3). Demo học thì native, prod ship thì dnd-kit.

### 7. Không a11y → keyboard/screen reader bó tay
Mô tả: chỉ kéo chuột, Tab không tới, screen reader không biết reorder. Fix: nút ↑/↓ mỗi item (`aria-label`, như example) + dnd-kit `attributes`/`announcements` (đọc "đã di A từ 1 tới 3").

### 8. Quên `setNodeRef` (dnd-kit) → kéo không hít
```tsx
// ❌ SAI: useSortable nhưng không gắn ref — không đo được, over luôn null
const { setNodeRef, ...rest } = useSortable({ id }); return <li {...rest.attributes}>Hi</li>;
```
```tsx
// ✅ ĐÚNG: luôn ref={setNodeRef} vào element gốc
return <li ref={setNodeRef} {...attributes} {...listeners}>Hi</li>;
```

## Best practices / Mẹo
- **Học native, ship dnd-kit** (hoặc Pragmatic DnD Atlassian cho board lớn). Vì sao 2 tầng? Vì native dạy events + bất biến (hiểu gốc), dnd-kit cho touch/keyboard/a11y/animation (đủ prod).
- `move` thuần riêng file — test không render + tái dùng drop/nút/`onDragEnd`. Vì sao riêng? Vì hoán vị là logic thuần, không thuộc component nào.
- `<DragOverlay>` + Motion `layout` cho "nhấc + trượt về" cao cấp. Vì sao? Vì native di là nhảy (không nội suy vị trí), overlay + layout là bay/trượt mượt.
- Kanban: state theo cột (`{ todo: [...], done: [...] }`), `onDragEnd` cập nhật 2 cột bất biến (xóa nguồn + chèn đích). Vì sao theo cột? Vì kéo chéo là 2 mảng đổi cùng lúc — 1 mảng phẳng không biểu diễn được.
- **Luôn nút Lên/Xuống** (a11y + test). Vì sao luôn? Vì kéo khó test E2E (pointer phức tạp) mà click nút ổn định; keyboard user cũng cần.
- **Tách `SortableItem`** riêng — memo + tái dùng + `useSortable` mỗi item. Vì sao? Vì item to (ảnh/nút) mà chung file là list render nặng mỗi lần kéo.
- `activationConstraint: { distance: 5, delay: 100 }` khi item có nút trong. Vì sao? Để click nút không thành kéo (đủ 5px/delay mới nhấc), kéo thật vẫn nhạy.

## Bài tập nhỏ
1. Native dùng **id** (như example) + `onDragEnter` highlight — kiểm tra socket thêm đầu lúc đang kéo không sai nguồn (so với bản index cũ).
2. dnd-kit sortable + keyboard sensor (Space nhấc, arrows di, Space thả) + `<DragOverlay>` — Tab/Enter chỉ bàn phím reorder được. Ghi khác biệt a11y với native?
3. Nút Lên/Xuống (như example) dùng chung `move` — test click nút (không kéo) vẫn reorder. Vì sao test nút ổn định hơn kéo E2E?
4. `<DragOverlay>` preview + list 50 item — đo perf kéo (fps) native vs dnd-kit + `layout`. Khi nào cần virtualize?
5. Kanban 2 cột (todo/done) kéo chéo — `onDragEnd` cập nhật 2 mảng bất biến. Thả ra ngoài (`over` null) thì sao (no-op)?

## Reference
- https://docs.dndkit.com/
- https://developer.mozilla.org/en-US/docs/Web/API/HTML_Drag_and_Drop_API
- https://github.com/atlassian/pragmatic-drag-and-drop
