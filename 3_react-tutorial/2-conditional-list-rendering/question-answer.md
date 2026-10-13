# DAY 2 — Hỏi & Đáp: Render có điều kiện & Danh sách

> File hỏi–đáp chi tiết cho `3_react-tutorial/2-conditional-list-rendering`.
> Đọc kèm: `README.md` (lý thuyết) + `example.tsx` (conditional + list chạy được).

---

## 1. Vì sao React không có `*ngIf` / `*ngFor`? Thay bằng gì?

**Hỏi:** Angular có directive `@if`/`@for`, React dùng cái gì để rẽ nhánh và lặp?

**Đáp:**
- Angular cần directive vì **template không phải JS** — phải "dạy" template cách rẽ nhánh/lặp.
  React thì **JSX chính là JS**, nên rẽ nhánh/lặp dùng đúng cú pháp JS trên *giá trị JSX*: `if`/`return`,
  `&&`, `?:`, `.map()`, `.filter()`. Không cần học cú pháp template riêng.
- Quy tắc chọn (theo README):
  - `&&` → nhánh "có/không" (ẩn/hiện 1 món).
  - `?:` → đủ 2 nhánh đều có nội dung.
  - early `return` → chặn cả component (ví dụ chưa login).
  - `.map()` → mảng dữ liệu thành mảng JSX; `.filter()` trước `.map()` khi cần lọc.

---

## 2. `&&` hoạt động thế nào? Vì sao `{count && <X/>}` in ra "0"?

**Hỏi:** `{unread > 0 && <span/>}` chạy tốt, nhưng `{count && <X/>}` khi `count = 0` lại hiện số 0?

**Đáp:**
- `a && b` trong JS trả về **`a` nếu `a` falsy, ngược lại trả `b`**. React render giá trị đó.
- `unread > 0` luôn là **boolean** (`true`/`false`) — `false` bị bỏ qua, `true` thì render `<span/>`. An toàn.
- `count` là **số**: khi `count = 0`, biểu thức trả về chính số `0`, mà `0` là giá trị **render được**
  (khác `null`/`false`/`undefined` bị bỏ qua) nên React in ra "0" lạc lõng.
- Fix: ép về boolean trước khi `&&` — `{count > 0 && <X/>}`. Cùng lỗi với chuỗi rỗng `{name && <X/>}`.

```tsx
{unread > 0 && <span>Bạn có {unread} tin nhắn</span>} // ✅ boolean
// {count && <X/>}  // ❌ count = 0 → in "0"
{count > 0 && <X/>} // ✅
```

---

## 3. `?:` dùng khi nào? Khác `&&` ở điểm nào?

**Hỏi:** Khi nào dùng ternary thay vì `&&`?

**Đáp:**
- `&&` chỉ lo **1 nhánh** (hiện hoặc không hiện). `?:` lo **đủ 2 nhánh** (rỗng/có dữ liệu, login/guest...).
- Ternary luôn trả về một trong hai giá trị nên không dính bẫy falsy như `&&`.
- Trong example: `pending.length === 0 ? <li>Hoàn thành tất cả!</li> : pending.map(...)` gộp cả
  "empty state" và "có dữ liệu" trong một biểu thức — gọn hơn hai mảnh `&&` rời rạc.

---

## 4. Early `return` là gì? Vì sao sạch hơn ternary lồng?

**Hỏi:** `if (!isLogin) return <p>...</p>` ở đầu function có gì hay hơn viết ternary cả trang?

**Đáp:**
- Early return **chặn cả component**: chưa đủ điều kiện thì return ngay, code phía sau không phải lồng thêm một cấp.
  Ternary lồng 3–4 tầng trong JSX đọc rất khó, early return giữ phần render chính "phẳng".
- Hai dạng "không render gì": `return null` (mount nhưng không có DOM — rõ nghĩa nhất) và `return false`
  (cũng không render, nhưng nên dùng `null`). Tránh `return undefined` (warning).
- Quy tắc: điều kiện chặn cả trang (chưa login, chưa có quyền, `!visible`) → early return lên trước `return` chính;
  điều kiện chỉ ẩn/hiện 1 món → `&&`/`?:` trong JSX.

---

## 5. `.map()` + `key` là gì? Vì sao quên `key` thì warning?

**Hỏi:** `.map()` biến mảng dữ liệu thành UI thế nào? `key` để làm gì?

**Đáp:**
- `.map()` chạy từng phần tử, trả về **mảng JSX** — JSX render mảng trực tiếp được, React nối vào cây theo thứ tự.
- `key` là **identity cho reconciliation**: giữa 2 lần render, React so key để biết node nào giữ nguyên
  (chỉ cập nhật text), node nào thêm (mount mới), node nào mất (unmount + cleanup), node nào đổi chỗ (di chuyển DOM).
- Không có `key` → React cảnh báo *"Each child in a list should have a unique key prop"* và phải dùng
  vị trí ngầm → list xóa/sắp xếp dễ tái sử dụng sai chỗ.

```tsx
pending.map((t) => <li key={t.id}>{t.text}</li>)
```

---

## 6. Vì sao cấm `key={index}` khi list thay đổi? Hậu quả cụ thể?

**Hỏi:** Dùng index làm key cho nhanh có sao không?

**Đáp:**
- Index chỉ đúng khi list **tĩnh, không thêm/xóa/đảo thứ tự**. Khi xóa phần tử đầu, mọi index phía sau
  dịch chuyển → React tưởng "cùng item ở cùng vị trí" nên **giữ nhầm state nội bộ**: ô input/text/ảnh nhảy sang item khác.
- Key tốt = **id ổn định, duy nhất** từ dữ liệu (`t.id`, `userId`, `crypto.randomUUID()` sinh lúc nhận data).
  Key trùng nhau trong cùng list cũng sai diff + warning.
- Mẹo thêm: `key` còn dùng để **reset component có state** khi đối tượng đổi:
  `<Profile key={userId} userId={userId} />` — đổi user là remount sạch, không kẹt state cũ.

---

## 7. `key` có truyền xuống component con được không?

**Hỏi:** Trong con đọc `props.key` được không?

**Đáp:**
- **Không.** `key` bị React "tiêu thụ" cho việc diff, không trở thành prop. Con cần id thì truyền riêng:
  `<TodoRow key={t.id} todo={t} />` — trong `TodoRow` đọc `todo.id`, đừng đọc `props.key` (luôn `undefined`).

---

## 8. Nên lọc/sắp xếp ở đâu: trong JSX hay trước `return`?

**Hỏi:** Viết `TODOS.filter(...).map(...)` ngay trong JSX được không?

**Đáp:**
- Chạy được nhưng **khó đọc** khi return phình to. Chuẩn của bài: **xử lý data ra biến trước** (`const pending = ...`),
  phần `return` chỉ còn JSX sạch — đúng tư duy "logic là JS, JSX là output".
- `filter` rồi `map` là 2 bước độc lập (giảm node → tạo node), tách ra vừa dễ đọc vừa dễ test.
- Khi `sort`/`reverse`: **không mutate mảng gốc** (`[...arr].sort()`, `toSorted()`), vì mảng đó có thể là state/props —
  mutate trong render gây bug khó tìm.

---

## 9. Nhiều nhánh (admin/user/guest) thì `switch` ở đâu?

**Hỏi:** `switch` là statement, không nhét vào JSX được — vậy viết ở đâu?

**Đáp:**
- Đưa `switch` lên **trước `return`** (tính ra biến rồi nhúng biến), hoặc gọn hơn: dùng **object map**.
- Object map sạch nhất cho nhánh text/ảnh theo key: `const label = { admin: "Quản trị", user: "Thành viên" }[role]`.

---

## 10. So nhanh Angular ↔ React cho conditional + list?

**Hỏi:** Mỗi directive Angular tương đương gì trong React?

**Đáp:**

| Angular | React | Ghi chú |
|---|---|---|
| `@if (cond)` | `{cond && <X/>}` | Nhánh có/không |
| `@if ... @else` | `cond ? <A/> : <B/>` | Không có block, chỉ expression |
| `@for (t of todos; track t.id)` | `todos.map(t => <li key={t.id}>...)` | `track` ↔ `key` |
| `@empty` | ternary nhánh `length === 0` | Không cú pháp riêng |
| `@switch` | `switch` trước return / object map | Object map gọn hơn |
| `ngFor` lồng `ngIf` | `filter(...).map(...)` | Xử lý data trước khi render |

---

## Reference

- `README.md` + `example.tsx` trong cùng thư mục (DAY 2)
- https://react.dev/learn/conditional-rendering
- https://react.dev/learn/rendering-lists
- https://react.dev/learn/understanding-reconciliation
- https://react.dev/learn/preserving-and-resetting-state
