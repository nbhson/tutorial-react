# DAY 3 — Hỏi & Đáp: Props & Tương tác component

> File hỏi–đáp chi tiết cho `3_react-tutorial/3-props-interaction`.
> Đọc kèm: `README.md` (lý thuyết) + `example.tsx` (string / number / boolean / event chạy được).

---

## 1. Props là gì? Vì sao gọi là "read-only"?

**Hỏi:** Props trong React là gì? Con có được gán lại `props.name = "x"` không?

**Đáp:**
- Props là **argument của function component** — kênh dữ liệu một chiều cha → con, tương đương `@Input` của Angular.
  Cha truyền gì, con nhận đúng thế qua destructuring: `function Greeting({ name }: { name: string })`.
- **Read-only từ góc nhìn con:** con không được gán lại props. Muốn đổi → con "đề nghị" qua callback,
  **cha đổi state rồi truyền giá trị mới xuống**. Nhờ vậy chỉ có một nguồn sự thật (single source of truth).
- Props còn là **snapshot mỗi render**: mỗi lần cha re-render là một bộ props mới (bất biến), không phải nơi lưu state.

```tsx
// ❌ SAI: gán lại props trong con
function Greeting({ name }: { name: string }) {
  name = "Khác"; // vi phạm một chiều
  return <p>{name}</p>;
}
```

---

## 2. Props string/number/boolean truyền thế nào? Giá trị mặc định viết ở đâu?

**Hỏi:** 3 kiểu nguyên thủy truyền qua props khác gì nhau? `defaultProps` còn dùng không?

**Đáp:**
- Không khác gì nhau về cú pháp — attribute nào cần dữ liệu động thì gán `{expr}`, chuỗi tĩnh thì ghi trực tiếp:
  `<Greeting name="Linh" greeting="Chào buổi sáng" />`, `<Badge count={count} />`, `<ToggleLabel isOn={isOn} />`.
- Giá trị mặc định viết bằng **destructuring default** (`greeting = "Xin chào"`, `max = 99`).
  `defaultProps` trên function component **đã bị gỡ** — đừng dùng.
- Type `?` (optional) đi kèm default: `greeting?: string` + `= "Xin chào"`. Prop **bắt buộc** (như `name: string`)
  thì TS báo đỏ ngay lúc compile nếu cha quên truyền — tương đương `@Input({ required: true })`.

---

## 3. Props boolean điều khiển được gì? Có bẫy falsy nào không?

**Hỏi:** `isOn` trong `ToggleLabel`/`Switch` dùng để làm gì? Truyền boolean có cần `{}` không?

**Đáp:**
- Boolean thường làm **cờ bật/tắt**: rẽ nhánh render (`isOn ? "BẬT" : "TẮT"`), bật/tắt class
  (`className={isOn ? "on" : "off"}`), disable nút (`disabled={isOn}`).
- Truyền literal thì viết trực tiếp (`<Comp isOn />` = `true`, `<Comp isOn={false} />`); truyền biến/state thì
  phải có `{}` (`<ToggleLabel isOn={isOn} />`) — quên `{}` là truyền chuỗi `"isOn"` (truthy) gây bug.
- Không dính bẫy falsy như `&&` ở DAY 2, vì ở đây boolean là **giá trị điều khiển rõ ràng**, không phải
  "in hay không in" một expression.

---

## 4. Props event (callback) là gì? Khác `@Output` + `EventEmitter` ở đâu?

**Hỏi:** Con muốn báo sự kiện lên cha thì làm sao? Có cần `EventEmitter` không?

**Đáp:**
- **Không cần emitter.** Callback **là một prop hàm**: cha truyền `onAdd={(step) => ...}`, con chỉ gọi `onAdd(1)`.
  Contract là *tên sự kiện + payload* (`(step: number) => void`), con không biết cha xử lý ra sao.
- Tương đương Angular: `@Output() add = new EventEmitter()` + `(add)="fn($event)"` gộp thành một prop duy nhất.
- Quy ước đặt tên: prop callback bắt đầu bằng **`on*`** (`onAdd`, `onToggle`, `onValueChange`) để nhìn là biết
  "sự kiện từ con", giống tên `@Output` rõ ràng.

---

## 5. Payload callback nên là gì: event thô hay dữ liệu?

**Hỏi:** Con nên gọi `onAdd(e)` với event gốc hay `onAdd(1)` với dữ liệu?

**Đáp:**
- Nên là **dữ liệu con biết** (`onAdd(1)`, `onToggle(!isOn)`, `onValueChange(e.target.value)`), không phải event thô.
  Cha quan tâm "cộng mấy / bật hay tắt / text mới là gì", không quan tâm click chuột nào.
- Type callback quyết định ergonomics: `(step: number) => void` dễ dùng, dễ test hơn
  `(e: React.MouseEvent) => void` (cha phải moi `e` ra, dính chặt vào DOM).
- Ngoại lệ: khi cha thật sự cần event (ví dụ `preventDefault` ở form) thì mới truyền event.

---

## 6. Vì sao `onClick={() => onAdd(1)}` mà không phải `onClick={onAdd(1)}`?

**Hỏi:** Hai cách viết khác nhau thế nào?

**Đáp:**
- `onClick` cần **tham chiếu hàm** để React gọi *khi click*. `onAdd(1)` **gọi ngay lúc render**,
  vừa sai thời điểm vừa có thể gây loop render.
- Cần tham số thì **bọc arrow**: `() => onAdd(1)`. Không cần tham số thì truyền thẳng: `onClick={onAdd}`,
  `onToggle={setIsOn}` (như `Switch` nhận `(next: boolean) => void` khớp luôn setter của `useState`).
- Với React Compiler 1.0, arrow trong JSX được memo tự động — không cần `useCallback` "để phòng".

---

## 7. Lifting state up là gì? Khi nào phải đưa state lên cha?

**Hỏi:** `count`/`isOn`/`name` trong example đều nằm ở `App` — vì sao không để mỗi con tự giữ?

**Đáp:**
- Khi **2 component cần cùng một dữ liệu thay đổi theo thời gian** (Badge đọc `count` + CounterButton đổi `count`;
  Greeting đọc `name` + TextInput sửa `name`), state phải nằm ở **cha chung gần nhất**, rồi truyền xuống
  qua props + callback. Đó là lifting state up.
- Nếu mỗi con giữ state riêng: chúng **không đồng bộ** với nhau và không ai đọc được tổng — mỗi nơi một sự thật.
- Đưa lên quá cao (root cho mọi thứ) thì re-render thừa cả cây; đưa quá thấp thì anh em không chia sẻ được.
  Quy tắc: **cha chung gần nhất**, đo lại khi cây lớn (lúc đó cân nhắc Context DAY 7 / store DAY 8).

---

## 8. Functional update `setCount(c => c + step)` để làm gì?

**Hỏi:** Sao không viết `setCount(count + step)` cho gọn?

**Đáp:**
- `setCount(count + step)` đọc `count` từ **closure của render hiện tại** — nếu 2 update dồn trong cùng event
  (batching, click nhanh), cả hai cùng đọc giá trị cũ → **mất 1 update** (tăng 2 lần chỉ +1).
- `setCount(c => c + step)` là **functional update**: React đảm bảo `c` luôn là giá trị **mới nhất** tại lúc
  áp update, an toàn khi dồn/batch. Quy tắc: update nào **dựa trên giá trị trước** (đếm, nối chuỗi, toggle)
  thì luôn dùng dạng hàm.

---

## 9. Con có đọc được `key` không? Muốn con biết id thì làm sao?

**Hỏi:** Truyền `key={t.id}` rồi trong con đọc `props.key` được không?

**Đáp:**
- **Không.** `key` bị React "tiêu thụ" cho việc diff (DAY 2), không trở thành prop.
  Con cần id thì truyền **prop riêng**: `<TodoRow key={t.id} todo={t} />` rồi đọc `todo.id`.
- Cùng họ "prop đặc biệt": `ref` cũng không phải prop thường (React 19 cho `ref` là prop nhưng vẫn
  dành cho DOM/imperative, xem DAY 4), `children` là prop đặc biệt cho nội dung lồng (DAY 5).

---

## 10. So nhanh Angular ↔ React cho props & tương tác?

**Hỏi:** Mỗi khái niệm `@Input`/`@Output` tương đương gì trong React?

**Đáp:**

| Angular | React | Ghi chú |
|---|---|---|
| `@Input() name` | `function C({ name }: Props)` | Cả hai read-only từ góc nhìn con |
| `@Output() + EventEmitter` | prop callback `onAdd: (v: number) => void` | Không cần class emitter |
| `(add)="fn($event)"` | `<C onAdd={(v) => fn(v)} />` | `$event` ↔ tham số arrow |
| `@Input({ required: true })` | `name: string` (không `?`) | TS bắt lúc compile |
| `[(value)]` two-way | `value={x} onValueChange={setX}` | Tự đặt quy ước tên, tách 2 chiều rõ ràng |
| `ngOnChanges` | `useEffect(..., [prop])` hoặc `key` reset | Thường chỉ cần render lại với prop mới |

---

## Reference

- `README.md` + `example.tsx` trong cùng thư mục (DAY 3)
- https://react.dev/learn/passing-props-to-a-component
- https://react.dev/learn/sharing-state-between-components
- https://react.dev/learn/thinking-in-react
