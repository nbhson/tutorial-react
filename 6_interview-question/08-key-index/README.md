# Q8: Em đã bao giờ render danh sách mà lấy index làm key rồi gặp bug chưa? Lúc nào nó gây lỗi thấy rõ?

## Câu hỏi

> Trong list động (thêm/xóa/di chuyển item), dùng `key={index}` thì có sao không?
> Khi nào được dùng index, khi nào bắt buộc phải dùng id?
> Nêu vài hậu quả cụ thể để thấy tại sao index làm key gây lỗi?

## Trả lời ngắn (elevator pitch, 30 giây)

- `key` là **"căn cước"** (identity) React dùng để so phần tử cũ/mới giữa 2 lần render (reconciliation — xem [`05-virtual-dom`](../05-virtual-dom)).
- `key={index}` = "phần tử ở **vị trí thứ i**". Khi list **thêm/xóa/di chuyển**, mọi index phía sau **dịch** 1 → React tưởng "cùng một phần tử đổi nội dung" (mà thật ra là phần tử khác) → **giữ nhầm node DOM + state nội bộ** của phần tử bên cạnh.
- **Hậu quả cụ thể, nhìn được bằng mắt**: input đang gõ "ở dòng 2" mất focus, text nhảy lên dòng 1; checkbox tick sai dòng; animation chạy lại từ đầu; form 2 trường lệch nhau.
- **Được dùng index khi**: list **thật sự tĩnh** — không bao giờ thêm/xóa/đổi thứ tự (ví dụ danh sách icon cố định, menu navigation). Khi list **động** (CRUD, filter, sort) → **cấm**, dùng `id` ổn định.

## Trả lời chi tiết

### 1. `key` là identity, không phải "gợi ý thứ tự"

Reconciliation (xem [`05-virtual-dom`](../05-virtual-dom)) so cây cũ với cây mới **theo vị trí + key**:

| Hành động | Với `key={id}` (đúng) | Với `key={index}` (sai khi list động) |
|---|---|---|
| Xóa item đầu | "item id=1 biến mất" → unmount đúng node, còn lại giữ state | index tất cả **dịch 1** → React "giữ" node cũ (vị trí 0) nhưng với **nội dung item mới** → lệch |
| Chèn item mới | "key mới" → mount node mới, còn lại giữ | mọi index phía sau đổi → React "đổi nội dung" hàng loạt, state "nhảy" |
| Đảo/sắp xếp | node **di chuyển** (giữ state: input đang gõ, animation) | React "cập nhật nội dung" tại chỗ → state không theo node → sai |

### 2. Hậu quả **cụ thể** (4 triệu chứng "nhìn thấy được")

Với một list có **state nội bộ** (input, checkbox, focus, animation), `key={index}` + xóa/dịch → 4 lỗi điển hình:

```tsx
// ❌ SAI — list động dùng index làm key
type Todo = { id: number; text: string };
function TodoList({ todos }: { todos: Todo[] }) {
  return (
    <ul>
      {todos.map((t, i) => (
        <li key={i}>
          <input defaultValue={t.text} /> {/* state nội bộ của input */}
        </li>
      ))}
    </ul>
  );
}
```

1. **Focus/input nhảy hàng**: đang gõ ở item thứ 2 (index=1) → xóa item đầu → list dịch → React "giữ" node ở index=1 nhưng giờ là **item thứ 3** → focus/text gõ dở "trôi" lên item sai.
2. **Checkbox tick sai dòng**: tick "item 2" → xóa item đầu → tick "mắc" lên item 3 (node cũ, state "đã tick" giữ lại dù nội dung đã đổi).
3. **Animation chạy lại / reset**: item có animation mount (fade-in, slide) → với `key={index}`, xóa item làm animation của phần tử "cũ" mất (nhưng node không đổi) → không "mượt" như khi dùng id.
4. **2 input/field "lẫn" vào nhau**: form nhiều trường trong list (ví dụ mỗi item có 2 input: "name" + "email") → xóa item đầu → "input name" của item 2 hiện text "của input email item 2" → **lỗi dữ liệu nghiêm trọng** (khác "lỗi focus").

**Nguyên nhân gốc**: khi list động, `index` **không phải identity ổn định** — nó "dịch" theo vị trí. React dùng index làm "chữ ký" → chữ ký "đội" → giữ nhầm node.

### 3. Khi nào `key={index}` **được** (trường hợp hợp lệ)

| Dùng được index | Lý do |
|---|---|
| List **thật sự tĩnh** (không thêm/xóa/đổi thứ tự) — ví dụ danh sách icon cố định, menu nav có N item luôn | index "không bao giờ đổi" → không có "dịch" → không "sai state" |
| Render **nhiều lần** nhưng list **không bao giờ đổi thứ tự/dài ngắn** | Cùng điều kiện trên |

> **Quy tắc thực chiến**: nếu list liên quan đến **filter/sort/CRUD/động** → **không bao giờ index**. Nếu dữ liệu **không có id**, **sinh id ổn định** khi nhận dữ liệu (một lần, ví dụ `crypto.randomUUID()`) — không "đổi" mỗi render.

### 4. So sánh với Angular (điểm "ăn điểm")

| React | Angular | Cùng vấn đề |
|---|---|---|
| `key` trong `.map()` | `trackBy` trong `*ngFor` (hoặc `@for`) | **Cùng** là "identity" cho diff — cùng hậu quả khi dùng index |
| `key={t.id}` | `trackBy: (index, item) => item.id` | "Ổn định" |
| `key={i}` | `trackBy: index` (hay mặc định "undefined") | **Sai khi list động** |

> Nói với interviewer: "Đây là vấn đề **cùng cơ chế** giữa 2 framework — 'trackBy' của Angular chính là 'key' của React, và cùng 'quy tắc' (không dùng index cho list động)."

### 5. "Phá" diff bằng ref (một dạng khác của cùng lỗi)

Nếu bạn **viết DOM bằng ref** (`ref.current.textContent = count`) thay vì state/props (xem [`05-virtual-dom`](../05-virtual-dom) — "sai DOM bằng ref trong render"), reconciliation **không biết** thay đổi đó (cây Virtual DOM "sạch") → lần render sau "mất" thay đổi → **lỗi tương tự "state nhảy"** nhưng ở cấp DOM. **Quy tắc**: "không sửa DOM tay trong render — cập nhật UI qua state/props".

## Bẫy khi phỏng vấn

1. **"key chỉ để 'thông báo thứ tự'"** (nói suông) → **sai**: key là **identity**, dùng cho diff (giữ/tạo/unmount node + state). Hiểu "chỉ là thứ tự" → dùng index, "sai ngay khi list động".
2. **"Tôi test không thấy lỗi (vì list chỉ 3 item, không gõ input trong list)"** → **sai**: lỗi **chỉ hiện** khi có **state nội bộ** (input, focus, animation) + **list động**. Test "không thấy" ≠ "không có".
3. **"Tôi sẽ 'bổ sung' key={index} vào 'cho chắc'"** → ngược lại, index là **lựa chọn sai** khi list động (đây là "cạm bẫy", không phải "phương án an toàn").
4. **"key không truyền được vào component con (props.key)"** → **đúng**: React "tiêu thụ" key cho diff, component con **không đọc** `props.key`. Muốn con biết id → **truyền thêm prop `id`** (không phải key).
5. **Đừng "quá" lo key**: với list **thật sự tĩnh** (không bao giờ đổi), `key={index}` **vẫn đúng** (không "dịch") — nhưng "quy tắc thực chiến" là **không** index khi có filter/sort/CRUD.

## Gợi ý câu chốt

> "key là 'căn cước' cho reconciliation (diff) — giữ/tạo/unmount đúng node + state nội bộ. `key={index}` chỉ 'an toàn' khi list **thật sự tĩnh** (không thêm/xóa/đổi thứ tự). Khi list **động** (filter, sort, CRUD), index **dịch** → React 'giữ nhầm' node → hậu quả: input focus nhảy hàng, checkbox tick sai, animation reset, 2 field 'lẫn' dữ liệu. Cách sửa: dùng `id` ổn định; nếu không có id, **sinh** (một lần) `crypto.randomUUID()`. Đây cùng cơ chế với `trackBy` trong Angular — 'quy tắc' giống nhau."

## Reference

- [React: Preserving & Resetting State](https://react.dev/learn/preserving-and-resetting-state) — "why key matters, when to use index"
- [`3_react-tutorial/2-conditional-list-rendering`](../../3_react-tutorial/2-conditional-list-rendering) — "key là identity cho reconciliation", "key={index} cấm khi list động"
- Q5 (Virtual DOM) — diff theo type + key, "key là căn cước"
- Q3 (StrictMode) — render pure, không "sai DOM bằng ref"

## Câu hỏi liên quan

- **Hỏi tiếp (liên tục)**: [Q5 — Virtual DOM?](../05-virtual-dom/README.md) · [Q30 — pipeline render, key ảnh hưởng pha nào?](../30-rerender-pipeline/README.md)
- **Đào sâu (xuyên nhóm)**: [Q34 — giữ ref cho N phần tử (Map key = id)](../34-ref-callback-n-items/README.md) · [Q31 — list 50.000 item, virtualize?](../31-virtualization/README.md)
