# DAY 1: JSX & HIỂN THỊ DỮ LIỆU

## Mục tiêu bài học
- Nắm JSX là cú pháp mở rộng của TS cho phép viết HTML trong logic render, và `{expression}` là cửa ngõ duy nhất đưa dữ liệu TS vào JSX.
- Hiểu 4 chiều bind data: interpolation `{}`, attribute binding, event binding (`on*`), và two-way binding qua controlled input.
- Đối chiếu trực tiếp với Angular: `{{ }}`, `[src]`, `(click)`, `[(ngModel)]` đều có bản đồ 1:1 trong React.

## Khái niệm cốt lõi (Core)
- **JSX không phải HTML, cũng không phải template string.** Vite (qua esbuild/Babel) biên dịch JSX thành lời gọi `jsx(type, props)` — về bản chất JSX chỉ là **function call trả về object mô tả UI**. Vì vậy bạn có thể nhúng mọi biểu thức JS bên trong `{}`.
- **Một chiều dữ liệu rõ ràng:** dữ liệu từ TS → JSX qua `{}`; sự kiện từ JSX → TS qua props `on*`. Không có auto two-way như `ngModel`.
- **Interpolation `{}` chứa mọi JS expression:** biến, phép toán, gọi hàm, ternary, template string — chỉ cần *biểu thức* (không phải câu lệnh `if`/`for`).
- **Controlled input = single source of truth:** `value` lấy từ state, `onChange` ghi ngược lại state → DOM và state luôn khớp. Đây là cách React thay thế hoàn toàn `[(ngModel)]`.
- **Uncontrolled input** (chỉ dùng `defaultValue`/`ref`): DOM tự giữ giá trị — ít dùng, nhưng hữu ích cho form lớn cần hiệu năng (DAY 11).
- **`{}` không render được object/boolean trực tiếp:** `{someObject}` sẽ lỗi; `true/false/null/undefined` bị bỏ qua khi render.
- **Event handler nhận SyntheticEvent** — wrapper thống nhất của React cho event trình duyệt, có `preventDefault`/`stopPropagation`; không cần lo khác biệt browser.
- **Keyword chính:** `JSX`, `{expression}`, `interpolation`, `onClick`, `onChange`, `controlled input`, `event`, `fragment`.

## Luồng hoạt động (Flow)
1. Component `App` chạy render lần đầu: tạo object `user`, đọc `name`, `age`.
2. JSX được đánh giá: `{name}` → "Son Nguyen"; `{user.age + 1}` → 31. Kết quả là một cây object (React element tree).
3. React chuyển element tree thành DOM thật, hiển thị nội dung.
4. Người dùng gõ vào `<input>` → sự kiện `onChange` fire → `setName(e.target.value)` được gọi.
5. `setName` báo React state thay đổi → React **re-render** component.
6. Re-render tạo element tree mới; React so sánh với cây cũ (reconciliation/diffing) và chỉ cập nhật phần khác biệt vào DOM.
7. `{name}` cập nhật text; `value` của input khớp state (không có gì thay đổi hiển thị vì input đã có giá trị đó).
8. Bấm "Click me!" → `onClick` fire → `alert` chạy với `name` mới nhất từ closure của render hiện tại.
9. Nếu bạn bỏ `onChange`, gõ không thay đổi state → input "đứng im" (controlled "frozen").
10. Nếu bạn bỏ `value`, input thành uncontrolled — DOM tự do, state không biết.
11. React gộp các `setState` trong cùng một event thành một lần re-render (batching) để tối ưu hiệu năng.
12. Sau khi commit DOM, React chạy effect (nếu có) — nhưng ở DAY 1 chưa cần effect, chỉ cần state.

## Ví dụ chi tiết
```tsx
// example.tsx — DAY 1: JSX data display (controlled input)
import { useState } from "react";

type User = { name: string; age: number };

export default function App() {
  const user: User = { name: "Son Nguyen", age: 30 };
  // state "name": giá trị hiển thị + input đều đọc từ đây
  const [name, setName] = useState(user.name);

  return (
    <>
      {/* Interpolation: đọc state, render lại khi state đổi */}
      <h3>Your name: {name}</h3>
      {/* Tính toán ngay trong JSX: mọi biểu thức JS đều hợp lệ */}
      <p>Next year: {user.age + 1}</p>
      {/* Controlled input: value = state, onChange = ghi state */}
      <input value={name} onChange={(e) => setName(e.target.value)} />
      {/* Event binding: truyền hàm, KHÔNG gọi hàm */}
      <button onClick={() => alert(`Hello ${name}`)}>Click me!</button>
    </>
  );
}
```

Các biến thể binding hay dùng:

```tsx
// Attribute binding (giống [src], [alt])
<img src={user.avatarUrl} alt={user.name} width={120} />

// Conditional text (giống ternary trong template)
<p>{user.age >= 18 ? "Người lớn" : "Vị thành niên"}</p>

// Class/style động
<div className={isActive ? "active" : ""} style={{ color: "red" }} />
```

## Giải thích từng phần
- `useState(user.name)`: khởi tạo state `name` bằng `"Son Nguyen"`. `useState` trả về cặp `[giá trị, hàm cập nhật]`.
- `{name}` trong `<h3>`: interpolation — mỗi lần `name` đổi, React re-render và cập nhật đúng dòng này.
- `{user.age + 1}`: chứng minh `{}` là **biểu thức bất kỳ**, không chỉ biến — phép cộng, gọi hàm, ternary đều dùng được.
- `onChange={(e) => setName(e.target.value)}`: `e` là `React.ChangeEvent<HTMLInputElement>` (TS tự suy ra). `e.target.value` là text hiện tại.
- **Không có `[(ngModel)]`**: giá trị hiển thị do state quyết định, không phải ngược lại.
- `onClick={() => alert(...)}`: arrow bao để truyền tham chiếu — chỉ gọi khi click (khác `onClick={alert(...)}` sẽ gọi ngay).
- `<>...</>`: fragment — nhóm nhiều element mà không thêm node DOM thừa (tương đương `ng-container`).
- `className` thay vì `class`: JSX dùng tên DOM property, không phải thuộc tính HTML.
- `style={{ color: "red" }}`: object camelCase (`backgroundColor`), không phải chuỗi CSS.
- `htmlFor` thay vì `for` (label), `onKeyDown` thay vì `onkeydown` — quy tắc camelCase.
- **`{}` không render được object:** phải chọn field cụ thể (`{user.name}`), không dùng `{user}`.
- **Boolean/null bị bỏ qua:** `{isActive && <span/>}` hoặc `{cond ? <A/> : null}` là pattern chuẩn (DAY 2).

## Bảng so sánh Angular ↔ React
| Angular | React | Ghi chú |
|---|---|---|
| `{{ expr }}` | `{expr}` | Ngoặc nhọn đơn; JSX đọc từ TS scope |
| `[src]="url"` | `src={url}` | Không có ngoặc vuông |
| `(click)="fn()"` | `onClick={fn}` | Truyền **tham chiếu hàm** |
| `[(ngModel)]="x"` | `value={x} onChange={e => setX(e.target.value)}` | Đẩy 2 chiều về 1 chiều + event |
| `[class.active]="ok"` | `className={ok ? "active" : ""}` | Không có `class.binding` |
| `[style.color]="c"` | `style={{ color: c }}` | Object camelCase |
| `(keyup.enter)="..."` | `onKeyDown` + check `e.key === "Enter"` | Không có syntax sugar phím |
| `Pipe` trong template | Gọi hàm trong `{}` | Format là function (DAY 10) |

## Lỗi thường gặp (Common pitfalls)
- **`onClick={showInfo()}` thay vì `onClick={showInfo}`** → hàm chạy *ngay lúc render*. → Fix: truyền tham chiếu; cần tham số thì bọc arrow `() => showInfo(x)`.
- **Dùng `if`/`for` bên trong `{}`** → syntax error vì chúng là *statement*. → Fix: dùng ternary/`&&`/`.map()` (DAY 2).
- **Quên `onChange`** → input không gõ được. → Fix: luôn cặp `value` + `onChange`, hoặc dùng uncontrolled + `defaultValue`.
- **Set state từ giá trị cũ không dùng hàm** — `setName(name + "!")` trong update nhanh có thể mất update. → Fix: `setName((prev) => prev + "!")` làm từ giá trị trước.
- **Render object trực tiếp** `{user}` → lỗi "Objects are not valid as a React child". → Fix: render từng field.
- **Dùng `class` thay vì `className`** → React cảnh báo console. → Fix: luôn `className`.
- **`style="color:red"` (chuỗi)** → lỗi. → Fix: `style={{ color: "red" }}`.
- **`{count && ...}` khi count = 0** → in ra "0". → Fix: dùng `{count > 0 && ...}`.
- **Quên `key` khi render danh sách** (DAY 2) → warning và bug diff. → Fix: key ổn định theo id.
- **`useState` đặt trong `if`** → vi phạm rules of hooks. → Fix: hook luôn ở top-level component.

## Best practices / Mẹo
- Đưa **logic format ra ngoài JSX** (biến/hàm trong component) để JSX đọc như HTML sạch; format nặng gộp vào `Intl`/hàm thuần (DAY 10).
- Dùng **derived data** thay vì state trùng lặp: `nextYear = user.age + 1` tính mỗi render là rẻ — đừng `useState` giá trị tính được.
- Tận dụng TS: type cho `user` và props; `onChange` tự suy kiểu, đừng khai `React.FormEvent` thủ công trừ khi cần.
- Dùng fragment thay `<div>` thừa để DOM gọn và CSS layout dễ hơn.
- Với React Compiler 1.0, arrow function trong `onClick` được memo tự động — đừng vội `useCallback`.
- Giữ handler ngắn; handler phức tạp tách hàm đặt tên (`handleSubmit`) để dễ đọc và test.
- Đặt `aria-label`/`htmlFor` cho input/button — vừa a11y vừa giúp test `getByRole` (DAY 21).
- Giữ mỗi phần tử JSX đủ nhỏ để tách component khi nó bắt đầu phình to (quy tắc ngón tay: >80 dòng cân nhắc tách).
- Ưu tiên tính giá trị hiển thị từ state/props ngay khi render (derived), tránh lưu trữ dư thừa gây lệch.

## Bài tập nhỏ
1. Thêm `{user.name.length}` và một ô input thứ 2 để sửa `age` (state riêng) — xem cả 2 dòng cập nhật đồng bộ.
2. Đổi input sang "không kiểm soát": bỏ `value`/`onChange`, dùng `ref` — so sánh hành vi, rồi giải thích vì sao controlled vẫn được khuyên dùng.
3. Thêm nút "Reset tên" gọi `setName(user.name)` và một nút "In hoa" gọi `setName((n) => n.toUpperCase())` — quan sát functional update.
4. Đổi `alert` sang hiển thị một `<p>` text bên dưới thay vì alert — giữ tinh thần "state-driven UI".

## Reference
- https://react.dev/learn/javascript-in-jsx-with-curly-braces
- https://react.dev/learn/responding-to-events
- https://react.dev/learn/sharing-state-between-components#controlled-and-uncontrolled-components
- https://react.dev/reference/react-dom/components/common