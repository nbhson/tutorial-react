# DAY 20: DRAG & DROP

## Mục tiêu bài học
- Hiểu 2 tầng drag & drop: **HTML5 native API** (đủ cho demo, học cơ chế) và **dnd-kit** (chuẩn production 2026: sortable, a11y, touch tốt).
- Đối chiếu với Angular CDK DragDrop (`cdkDropList`, `cdkDrag`, `moveItemInArray`).
- Nắm mấu chốt: kéo thả trong React = **cập nhật state mảng** khi thả (immutable), React re-render theo thứ tự mới.

## Khái niệm cốt lõi (Core)

Mục này nói về hai tầng drag & drop của React 2026: HTML5 native để học cơ chế, dnd-kit để ship prod — đọc để hiểu triết lý chung trước: kéo thả chỉ là đổi state mảng.

### 1. Không directive ma thuật — chỉ events + state
Angular CDK cho `cdkDropList`/`cdkDrag`/`cdkDragHandle` làm sẵn (preview, placeholder,touch). React native chỉ có HTML5 events (`onDragStart/onDragEnter/onDragOver/onDrop/onDragEnd`) + thuộc tính `draggable`. Kéo không di chuyển DOM trực tiếp — nó set state (`dragId`), thả thì **tạo mảng mới** thứ tự mới; React vẽ lại. Đúng nguyên tắc bất biến DAY 2. Ví von: Angular giao cho bạn "cần cẩu dựng sẵn"; React đưa bạn găng tay và bộ ròng rọc — tự lắp, nhưng hiểu rõ cần cẩu chạy thế nào.

> 📄 **Code ví dụ:** [`examples/01-1-khong-directive-ma-thuat-chi-events-state.tsx`](examples/01-1-khong-directive-ma-thuat-chi-events-state.tsx)

Vì sao id mà không index? Vì index dịch khi list thêm/xóa giữa lúc kéo (socket thêm item lúc đang kéo) — nguồn index cũ trỏ sai item. Id ổn định + `findIndex` lúc drop luôn đúng.

> **Tóm gọn 1 câu:** Kéo thả React = nhớ nguồn (id) khi cầm, tạo mảng mới khi thả — không hề đụng tay vào DOM.

### 2. HTML5 native — đủ học, thiếu prod
Mục này về "bộ găng tay cơ bản": đủ để hiểu cơ chế, nhưng thiếu 3 thứ prod cần — đọc để biết giới hạn trước khi chọn.

`draggable` + ghi nguồn + `preventDefault` ở `onDragOver` + đổi chỗ ở `onDrop`. Giới hạn: touch/mobile không chạy (cần Pointer/Touch sensor), a11y không (keyboard/screen reader bó tay), ghost style hạn chế, kéo giữa 2 list tự lo. Demo/học thì đủ; prod (board, kanban, mobile) thì dnd-kit. Ví von: native như xe đạp thập cẩm — chạy được, nhưng mang hàng nặng hay đi mưa thì cần xe khác.

> **Tóm gọn 1 câu:** Native đủ để học và demo — thiếu touch + a11y nên prod phải lên dnd-kit.

### 3. dnd-kit — chuẩn prod 2026
Mục này về "bộ đồ đầy đủ" của drag & drop production: từ keyboard sensor đến DragOverlay — đọc để biết từng mảnh lắp vào đâu.

Headless + keyboard (Space nhấc, arrows di, Space thả) + screen reader announcements + touch/pointer sensor + `DragOverlay` preview + `arrayMove` + `closestCenter`/`verticalListSortingStrategy` + `activationConstraint` (kéo khi đủ distance/delay, tránh nhầm click nút trong). Cấu trúc: `<DndContext>` (quản kéo + `onDragEnd`) + `<SortableContext items strategy>` (list) + `useSortable({ id })` mỗi item (cho `setNodeRef`/`transform`/`listeners`/`attributes`). Ví von: dnd-kit là cần cẩu chính hãng có kiểm định — bốc vác được, người khuyết tật vẫn điều khiển được bằng bảng điều khiển (keyboard).

> 📄 **Code ví dụ:** [`examples/02-3-dnd-kit-chuan-prod-2026.tsx`](examples/02-3-dnd-kit-chuan-prod-2026.tsx)

`arrayMove(arr, from, to)` = `moveItemInArray` CDK (rút + chèn, trả mảng mới). Kéo giữa 2 cột (kanban) thì `onDragEnd` phân biệt container qua `active.data`/`over.data` + setState 2 cột bất biến (tương đương `transferArrayItem`).

> **Tóm gọn 1 câu:** dnd-kit là chuẩn prod: touch, keyboard, a11y, overlay đủ bộ — bạn lắp `DndContext` + `SortableContext` + `useSortable` là chạy.

### 4. Hàm `move` thuần — trái tim test được
`move(list, from, to)` trong example: copy + splice 2 bước, không mutate gốc. Dùng chung cho drop native, nút Lên/Xuống (a11y), `onDragEnd` dnd-kit. Test `expect(move(["a","b","c"], 0, 2)).toEqual(["b","c","a"])` không cần render (DAY 21). Ví von: `move` như công thức hoán vị viết ra giấy — ai làm theo cũng ra cùng kết quả, kiểm tra được mà không cần dựng cả sân khấu.

> **Tóm gọn 1 câu:** Tách hoán vị thành hàm thuần `move` — test không cần render, và drop/nút/dnd-kit cùng dùng một công thức.

### Keyword chính
`draggable`, `onDragStart` (ghi nguồn id), `onDragEnter/Leave` (highlight), `onDragOver` + `preventDefault` (cho drop — quên là liệt), `onDrop` (setState mới), `onDragEnd` (reset cả thả ngoài), `move`/`arrayMove` (hoán vị bất biến), `DndContext`/`SortableContext`/`useSortable`/`setNodeRef`/`transform`/`attributes`/`listeners`, `DragOverlay`, keyboard sensor, `activationConstraint`.

> **Tóm gọn 1 câu:** Thuộc bộ từ này là nắm cả 2 tầng: events native + hệ mảnh dnd-kit — nhớ nhất là `preventDefault` ở `onDragOver` nếu không muốn drop "liệt".

## Luồng hoạt động (Flow)
Mục này đi theo một lượt kéo item A thả lên item C — đọc để thấy thứ tự events và thời điểm state đổi.
1. Render với 3 item id `a/b/c`; mỗi `<li>` `draggable` + 5 handler + `key={id}` + nút ↑/↓ a11y.
2. Bắt đầu kéo A → `onDragStart` → `setDragId("a")` (chỉ nguồn, chưa đổi list). Style nguồn mờ (`opacity 0.5`).
3. Kéo qua B → `onDragEnter` B → `setOverId("b")` → B highlight (`background #e3f2fd`). Rời B → `onDragLeave` xóa (nếu vẫn B).
4. Kéo qua đâu cũng `onDragOver` fire liên tục → `e.preventDefault()` **cho phép** drop. Không gọi là trình duyệt từ chối, `onDrop` không bao giờ chạy (pitfall #1).
5. Thả trên C → `onDrop` C → `dropOn("c")`: nguồn `"a"` ≠ đích `"c"` → `setItems(xs => ...)`: `findIndex` lúc drop (from 0, to 2) → `move` (copy + splice rút + chèn) → mảng mới `[b, c, a]`.
6. `setDragId/overId(null)` reset. React re-render theo thứ tự mới (`key` ổn định nên node di chuyển, không tạo lại — state/focus giữ). Không có `move` tay DOM nào.
7. Thả về A (cùng chỗ) hoặc ra ngoài (`over` null, chỉ `onDragEnd`) → no-op/reset, không setState thừa.
8. Nút ↑/↓: `step(id, ±1)` → `findIndex` + `move` chung — không kéo vẫn reorder (keyboard/screen reader/test).
9. (dnd-kit) `useSortable` cho `transform` (nhấc lên khi kéo) + `listeners` (handle) + `attributes` (role/tabIndex/aria) + `setNodeRef` (đo). `onDragEnd({ active, over })` → index qua id → `arrayMove` → `setItems` mới. `over` null (ra ngoài) thì bỏ qua. `<DragOverlay>` preview bay theo chuột; `layout` Motion trượt về chỗ (DAY 19).

> **Tóm gọn 1 câu:** Một cú kéo là một chuỗi events: start ghi nguồn → enter highlight → over cho phép → drop hoán vị → end reset — DOM không bao giờ bị đụng tay.

## Ví dụ chi tiết
Mục này cho code chạy được từ native tới dnd-kit — copy về chạy thử rồi đọc phần giải thích.
Khớp 1-1 với `example.tsx` (native + id + highlight + nút a11y + `move` thuần):

> 📄 **Code ví dụ:** [`examples/03-vi-du-chi-tiet.tsx`](examples/03-vi-du-chi-tiet.tsx)

dnd-kit sortable đầy đủ (copy vào prod):

> 📄 **Code ví dụ:** [`examples/04-vi-du-chi-tiet.tsx`](examples/04-vi-du-chi-tiet.tsx)

## Giải thích từng phần
Mục này soi từng dòng handler và hook — đọc khi bạn thắc mắc "vì sao phải preventDefault, vì sao id mà không index".
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
Mục này đối chiếu Angular CDK DragDrop với native + dnd-kit — đọc như bảng chuyển đổi linh kiện khi chuyển dự án.

| Angular CDK | React (native / dnd-kit) | Ghi chú |
|---|---|---|
| `cdkDropList` (vùng thả) | `<DndContext>` + `<SortableContext>` (2 tầng) | dnd-kit tách quản kéo + list sortable |
| `cdkDrag` (phần tử kéo) | `draggable` (native) / `useSortable()` + `listeners`/`attributes` | Headless: tự render, gắn behavior |
| `moveItemInArray(arr, from, to)` | `move()` (example) / `arrayMove` (dnd-kit) | Cùng rút + chèn bất biến |
| `transferArrayItem` (2 list) | `setState` 2 cột trong `onDragEnd` (phân biệt qua `active`/`over` data) | Kanban: `columns: { todo, done }` cập nhật cả hai |
| `cdkDropListConnectedTo` (nối list) | `DndContext` bọc nhiều `SortableContext` | Kéo chéo list trong 1 context |
| `cdkDragPreview` (bóng kéo) | `<DragOverlay>` (dnd-kit) | Preview bay theo chuột, gốc giữ chỗ |
| `cdkDragPlaceholder` (giữ chỗ) | item giữ chỗ + `transform` + CSS khi kéo | Giữ layout không sập khi nhấc |
| `cdkDragHandle` (tay cầm) | `listeners` gắn vào handle + `activationConstraint` | Kéo chỉ từ handle, click nút trong không nhầm |
| `enterPredicate` (chặn nhận) | `disabled`/`data` + check trong `onDragOver`/`onDragEnd` | Logic chặn ở event |
| CDK touch + a11y sẵn | native thiếu → dnd-kit sensor/keyboard/announcements | Prod mobile/a11y phải dnd-kit |

> **Cách đọc bảng này:** mỗi dòng là một linh kiện CDK của Angular, cột giữa là mảnh thay thế bằng native hoặc dnd-kit, cột Ghi chú tóm khác biệt — hàng cuối (touch/a11y) là lý do chính để prod chọn dnd-kit.

## Lỗi thường gặp (Common pitfalls)
Mục này là "bản đồ bẫy" của drag & drop — drop liệt im lặng, state nhảy, item rớt mất; đa số lỗi không có console error nên phải biết trước.

### 1. Quên `preventDefault` ở `onDragOver` → drop liệt
> 📄 **Code ví dụ:** [`examples/05-1-quen-preventdefault-o-ondragover-drop-liet.tsx`](examples/05-1-quen-preventdefault-o-ondragover-drop-liet.tsx)
> 📄 **Code ví dụ:** [`examples/06-1-quen-preventdefault-o-ondragover-drop-liet.tsx`](examples/06-1-quen-preventdefault-o-ondragover-drop-liet.tsx)

### 2. `key={index}` cho sortable → nhảy sai
> 📄 **Code ví dụ:** [`examples/07-2-key-index-cho-sortable-nhay-sai.tsx`](examples/07-2-key-index-cho-sortable-nhay-sai.tsx)
> 📄 **Code ví dụ:** [`examples/08-2-key-index-cho-sortable-nhay-sai.tsx`](examples/08-2-key-index-cho-sortable-nhay-sai.tsx)

### 3. Mutate state (`splice` gốc) → không thấy đổi
> 📄 **Code ví dụ:** [`examples/09-3-mutate-state-splice-goc-khong-thay-oi.tsx`](examples/09-3-mutate-state-splice-goc-khong-thay-oi.tsx)
> 📄 **Code ví dụ:** [`examples/10-3-mutate-state-splice-goc-khong-thay-oi.tsx`](examples/10-3-mutate-state-splice-goc-khong-thay-oi.tsx)

### 4. Không reset `dragId`/`overId` → lần sau sai nguồn + highlight kẹt
Mô tả: drop xong quên `setDragId(null)` là kéo B vẫn nguồn A; `overId` kẹt highlight. Fix: reset cả drop thành công + no-op + `onDragEnd` (thả ngoài) như example.

### 5. Nguồn index khi list đổi giữa lúc kéo → trỏ sai
> 📄 **Code ví dụ:** [`examples/11-5-nguon-index-khi-list-oi-giua-luc.tsx`](examples/11-5-nguon-index-khi-list-oi-giua-luc.tsx)
> 📄 **Code ví dụ:** [`examples/12-5-nguon-index-khi-list-oi-giua-luc.tsx`](examples/12-5-nguon-index-khi-list-oi-giua-luc.tsx)

### 6. Native trên mobile/touch không chạy → UX vỡ điện thoại
Mô tả: `draggable` desktop ổn, mobile không fire. Fix: dnd-kit Pointer/Touch/Keyboard sensor (1 code chạy cả 3). Demo học thì native, prod ship thì dnd-kit.

### 7. Không a11y → keyboard/screen reader bó tay
Mô tả: chỉ kéo chuột, Tab không tới, screen reader không biết reorder. Fix: nút ↑/↓ mỗi item (`aria-label`, như example) + dnd-kit `attributes`/`announcements` (đọc "đã di A từ 1 tới 3").

### 8. Quên `setNodeRef` (dnd-kit) → kéo không hít
> 📄 **Code ví dụ:** [`examples/13-8-quen-setnoderef-dnd-kit-keo-khong-hit.tsx`](examples/13-8-quen-setnoderef-dnd-kit-keo-khong-hit.tsx)
> 📄 **Code ví dụ:** [`examples/14-8-quen-setnoderef-dnd-kit-keo-khong-hit.tsx`](examples/14-8-quen-setnoderef-dnd-kit-keo-khong-hit.tsx)

## Best practices / Mẹo
Mục này là "kế hoạch ship prod" cho drag & drop — đọc để biết tầng nào học, tầng nào ship, và những mảnh a11y/perf không được quên.
- **Học native, ship dnd-kit** (hoặc Pragmatic DnD Atlassian cho board lớn). Vì sao 2 tầng? Vì native dạy events + bất biến (hiểu gốc), dnd-kit cho touch/keyboard/a11y/animation (đủ prod).
- `move` thuần riêng file — test không render + tái dùng drop/nút/`onDragEnd`. Vì sao riêng? Vì hoán vị là logic thuần, không thuộc component nào.
- `<DragOverlay>` + Motion `layout` cho "nhấc + trượt về" cao cấp. Vì sao? Vì native di là nhảy (không nội suy vị trí), overlay + layout là bay/trượt mượt.
- Kanban: state theo cột (`{ todo: [...], done: [...] }`), `onDragEnd` cập nhật 2 cột bất biến (xóa nguồn + chèn đích). Vì sao theo cột? Vì kéo chéo là 2 mảng đổi cùng lúc — 1 mảng phẳng không biểu diễn được.
- **Luôn nút Lên/Xuống** (a11y + test). Vì sao luôn? Vì kéo khó test E2E (pointer phức tạp) mà click nút ổn định; keyboard user cũng cần.
- **Tách `SortableItem`** riêng — memo + tái dùng + `useSortable` mỗi item. Vì sao? Vì item to (ảnh/nút) mà chung file là list render nặng mỗi lần kéo.
- `activationConstraint: { distance: 5, delay: 100 }` khi item có nút trong. Vì sao? Để click nút không thành kéo (đủ 5px/delay mới nhấc), kéo thật vẫn nhạy.

## Bài tập nhỏ
Làm tay để nhớ — mỗi bài là một thí nghiệm kéo thả thật hoặc đo perf giữa native và dnd-kit.

1. Native dùng **id** (như example) + `onDragEnter` highlight — kiểm tra socket thêm đầu lúc đang kéo không sai nguồn (so với bản index cũ).
2. dnd-kit sortable + keyboard sensor (Space nhấc, arrows di, Space thả) + `<DragOverlay>` — Tab/Enter chỉ bàn phím reorder được. Ghi khác biệt a11y với native?
3. Nút Lên/Xuống (như example) dùng chung `move` — test click nút (không kéo) vẫn reorder. Vì sao test nút ổn định hơn kéo E2E?
4. `<DragOverlay>` preview + list 50 item — đo perf kéo (fps) native vs dnd-kit + `layout`. Khi nào cần virtualize?
5. Kanban 2 cột (todo/done) kéo chéo — `onDragEnd` cập nhật 2 mảng bất biến. Thả ra ngoài (`over` null) thì sao (no-op)?

> **Tóm gọn 1 câu:** Ghi nhớ cả bài trong 1 nhịp: kéo chỉ là đổi state theo id ổn định, thả là tạo mảng mới bất biến — prod thì dnd-kit lo touch/keyboard/a11y.

## Reference
- https://docs.dndkit.com/
- https://developer.mozilla.org/en-US/docs/Web/API/HTML_Drag_and_Drop_API
- https://github.com/atlassian/pragmatic-drag-and-drop
