# DAY 1: JSX & HIỂN THỊ DỮ LIỆU

## Mục tiêu bài học
- Nắm JSX là cú pháp mở rộng của TS cho phép viết HTML trong logic render, và `{expression}` là cửa ngõ duy nhất đưa dữ liệu TS vào JSX.
- Hiểu 4 chiều bind data: interpolation `{}`, attribute binding, event binding (`on*`), và two-way binding qua controlled input.
- Đối chiếu trực tiếp với Angular: `{{ }}`, `[src]`, `(click)`, `[(ngModel)]` đều có bản đồ 1:1 trong React.

## Khái niệm cốt lõi (Core)

### 1. JSX không phải HTML, cũng không phải template string
Vite (qua esbuild/Babel) biên dịch JSX thành lời gọi `jsx(type, props)`. Về bản chất JSX chỉ là **function call trả về object mô tả UI** (React element), không phải chuỗi HTML, không phải DOM thật.

```tsx
// Bạn viết thế này:
const el = <h3>Your name: {name}</h3>;

// Vite biên dịch gần tương đương thế này (giản lược):
const el = jsx("h3", { children: ["Your name: ", name] });
// el là object thuần { type: "h3", props: {...} } — React đọc object để dựng DOM.
```

Vì sao quan trọng? Vì JSX là JS nên bạn được dùng toàn bộ sức mạnh JS: biến, hàm, toán tử, import. Angular template là DSL riêng (cần học `*ngIf`, `| pipe`), còn JSX không có cú pháp mới — biết JS là biết JSX. Hệ quả: mọi logic `if`/`for`/`format` nằm ở phần JS trên đầu component, phần `return` chỉ còn "vẽ". Nếu bạn nhét `if` statement vào trong `{}` sẽ lỗi, vì `{}` chỉ nhận *expression* (giá trị), không nhận *statement* (câu lệnh).

### 2. Một chiều dữ liệu rõ ràng
Dữ liệu đi từ TS → JSX qua `{}` (interpolation/attribute). Sự kiện đi từ JSX → TS qua props `on*` (`onClick`, `onChange`). Không có auto two-way như `[(ngModel)]` — hai chiều được mô hình hóa thành "cha cho giá trị + con báo sự kiện".

```tsx
// Một chiều xuống: state -> UI
<p>Your name: {name}</p> // name đổi -> dòng này đổi, không chiều ngược lại

// Một chiều lên: UI -> state qua event
<input value={name} onChange={(e) => setName(e.target.value)} />
// Người gõ -> onChange fire -> setName -> state đổi -> <p> vẽ lại
```

Vì sao một chiều tốt? Vì luồng dữ liệu luôn truy vết được: muốn biết `<p>` hiện gì, chỉ cần nhìn `name`. Không có trạng thái "DOM và state lệch nhau". Nếu bạn bỏ `onChange` mà giữ `value`, input "đóng băng" (gõ không vào) — đó không phải bug React, đó là hệ quả đúng của một chiều: UI chỉ phản ánh state, state không đổi thì UI đứng im.

### 3. Interpolation `{}` chứa mọi JS expression
Biến, phép toán, gọi hàm, ternary, template string — mọi thứ trả về giá trị đều dùng được. Chỉ cần nhớ: *expression* được, *statement* (`if`, `for`, `switch`) không được.

```tsx
const user = { name: "Son Nguyen", age: 30 };
// (1) Biến thuần — dòng này minh họa trong example.tsx
<h3>Your name: {name}</h3>
// (2) Phép toán ngay trong JSX — không cần biến trung gian
<p>Next year: {user.age + 1}</p>
// (3) Ternary — rẽ nhánh 2 nhánh ngay trong JSX (chi tiết DAY 2)
<p>{user.age >= 18 ? "Người lớn" : "Vị thành niên"}</p>
// (4) Gọi hàm format — đây chính là "pipe" của React (chi tiết DAY 10)
<p>{new Intl.NumberFormat("vi-VN").format(120000)}</p>
```

```tsx
// ❌ SAI: statement trong {} — lỗi cú pháp
<p>{if (age > 18) { return "lớn"; }}</p>
// ✅ ĐÚNG: expression tương đương
<p>{age > 18 ? "lớn" : "nhỏ"}</p>
```

Nếu render object trực tiếp (`{user}`), React ném "Objects are not valid as a React child". Vì sao? Vì object không có cách hiển thị mặc định. Fix: chọn field cụ thể (`{user.name}`). `true`/`false`/`null`/`undefined` bị bỏ qua khi render — đó là nền tảng của pattern `{cond && <X/>}` ở DAY 2.

### 4. Controlled input = single source of truth
`<input value={state} onChange={e => setState(...)} />`: `value` lấy từ state, `onChange` ghi ngược lại state. DOM và state luôn khớp. Đây là cách React thay thế hoàn toàn `[(ngModel)]`.

```tsx
// example.tsx dùng đúng pattern này:
const [name, setName] = useState("Son Nguyen");
<input value={name} onChange={(e) => setName(e.target.value)} />
// Gõ "x" -> onChange("Son Nguyenx") -> setName -> re-render -> input hiện "Son Nguyenx"
```

Cơ chế chi tiết: mỗi phím gõ fire `onChange` với `e.target.value` là text hiện tại trong ô. `setName` báo React state đổi → React re-render component → JSX đánh giá lại `value={name}` với giá trị mới → DOM cập nhật. React còn gộp (batch) nhiều `setState` trong cùng event thành một lần re-render để tối ưu. Nếu bạn bỏ `value`, input thành uncontrolled — DOM tự giữ, state không biết, hai nguồn sự thật lệch nhau.

### 5. Uncontrolled input (ít dùng)
Chỉ dùng `defaultValue`/`ref`, DOM tự giữ giá trị, React không kiểm soát mỗi phím. Hữu ích cho form lớn cần hiệu năng (không re-render mỗi phím) hoặc tích hợp thư viện DOM thuần.

```tsx
// Uncontrolled: React chỉ đọc 1 lần khi submit, không kiểm soát lúc gõ
import { useRef } from "react";
function Quick() {
  const ref = useRef<HTMLInputElement>(null); // trỏ vào DOM thật sau mount
  const submit = () => alert(ref.current?.value); // đọc khi cần, không state
  return <input ref={ref} defaultValue="Son" />;
}
```

Vì sao controlled vẫn được khuyên? Vì uncontrolled khó validate live, khó disable nút theo input, khó reset. Chỉ dùng uncontrolled khi form hàng chục field và đo được controlled gây lag (chi tiết DAY 11 với react-hook-form dùng uncontrolled + ref để giảm re-render).

### 6. `{}` không render được object/boolean trực tiếp
`{someObject}` lỗi; `true`/`false`/`null`/`undefined` bị bỏ qua (không vẽ gì). Đây không phải thiếu sót mà là thiết kế để pattern điều kiện gọn.

```tsx
const user = { name: "Son" };
// ❌ SAI: render object — crash "Objects are not valid as a React child"
<p>{user}</p>
// ✅ ĐÚNG: chọn field
<p>{user.name}</p>

// Lợi dụng "bỏ qua": chỉ hiện khi đúng
{unread > 0 && <span>Bạn có {unread} tin nhắn</span>}
// unread = 0 -> biểu thức là false -> React bỏ qua, không vẽ gì
```

Cạm bẫy nổi tiếng: `{count && <X/>}` khi `count = 0` sẽ in ra "0" vì `0` là giá trị render được (khác `false`). Fix: `{count > 0 && <X/>}` để vế trái luôn boolean.

### 7. Event handler nhận SyntheticEvent
React bọc event trình duyệt thành `SyntheticEvent` thống nhất: có `preventDefault`/`stopPropagation`, hoạt động giống nhau mọi browser. Bạn không cần lo `window.event` hay prefix hãng.

```tsx
// e tự suy kiểu React.ChangeEvent<HTMLInputElement> — không cần khai tay
<input onChange={(e) => setName(e.target.value)} />
// Form submit: bắt buộc preventDefault nếu không trang reload, app React chết
<form onSubmit={(e) => { e.preventDefault(); save(); }}>
```

Vì sao `onClick={() => alert(...)}` mà không phải `onClick={alert(...)}`? Vì JSX cần *tham chiếu hàm* để gọi sau khi click. `alert(...)` gọi ngay lúc render (truyền kết quả `undefined` vào onClick). Bọc arrow `() => alert(...)` tạo hàm mới, click mới chạy.

### Keyword chính
`JSX`, `{expression}`, `interpolation`, `onClick`, `onChange`, `controlled input`, `event`, `fragment`. Thêm `className`, `style object`, `SyntheticEvent` khi đọc code thật.

## Luồng hoạt động (Flow)
1. Component `App` chạy render lần đầu: tạo object `user` (`name`, `age`), đọc `name` khởi tạo state, đọc `isActive = true`.
2. JSX được đánh giá: `{name}` → "Son Nguyen"; `{user.age + 1}` → 31; `alt={name}` → alt text; `className={isActive ? "active" : ""}` → "active". Kết quả là một cây object (React element tree), chưa phải DOM.
3. React chuyển element tree thành DOM thật (`<h3>`, `<p>`, `<img>`, `<input>`, `<button>`), hiển thị nội dung.
4. Người dùng gõ vào `<input>` → sự kiện `onChange` fire với `e.target.value` mới → `setName(...)` được gọi.
5. `setName` báo React state thay đổi → React **lên lịch re-render** component (không vẽ ngay đồng bộ mà batch).
6. Re-render tạo element tree mới; React so sánh với cây cũ (reconciliation/diffing) và chỉ cập nhật node khác biệt vào DOM (ví dụ text trong `<h3>`, `value` của input, `alt` của ảnh).
7. `{name}` cập nhật text; `value` của input khớp state. Bấm "Đảo trạng thái" → `setIsActive` → `className`/`style`/`text` đổi theo boolean.
8. Bấm "Click me!" → `onClick` fire → `alert` chạy với `name` mới nhất từ closure của render hiện tại (vì mỗi render tạo một closure mới giữ `name` lúc đó).
9. Nếu bạn bỏ `onChange` mà giữ `value`, gõ không thay đổi state → input "đứng im" (controlled "frozen"). Đây là minh chứng sống cho một chiều.
10. Nếu bạn bỏ `value`, input thành uncontrolled — DOM tự do, state không biết, `<h3>` không cập nhật khi gõ.
11. React gộp các `setState` trong cùng một event thành một lần re-render (batching) để tối ưu hiệu năng — gõ nhanh 5 phím không phải 5 lần vẽ full cây.
12. Sau khi commit DOM, React chạy effect (nếu có) — nhưng ở DAY 1 chưa cần effect, chỉ cần state. Effect dành cho hệ thống ngoài (timer/DOM/socket), không phải để tính `{user.age + 1}`.

## Ví dụ chi tiết
Code dưới đây khớp 1-1 với `example.tsx` cùng thư mục:

```tsx
// example.tsx — DAY 1: JSX data display (controlled input + các kiểu binding)
// Mục đích: chứng minh JSX chỉ là JS expression — mọi dữ liệu TS vào JSX qua {},
// mọi sự kiện ra qua props on*. Không có ngModel 2 chiều tự động.
import { useState } from "react"; // (1) Import hook giữ state — input controlled đọc/ghi qua state này

type User = { name: string; age: number }; // (2) Type "hợp đồng" dữ liệu — IDE gợi ý, TS chặn sai kiểu

export default function App() {
  // (3) Dữ liệu tĩnh demo: object user — minh họa {user.age + 1} tính ngay trong JSX
  const user: User = { name: "Son Nguyen", age: 30 };
  // (4) State "name": single source of truth — <h3>, <input>, alert đều đọc từ đây.
  // Vì sao cần state mà không dùng biến thường? Vì setName mới báo React vẽ lại.
  const [name, setName] = useState(user.name);
  // (5) State phụ để minh họa class/style động theo boolean
  const [isActive, setIsActive] = useState(true);

  return (
    // (6) Fragment gom nhiều element mà không thêm <div> thừa (tương đương ng-container)
    <>
      {/* (7) Interpolation: {name} đọc state — mỗi lần setName, đúng dòng này cập nhật */}
      <h3>Your name: {name}</h3>
      {/* (8) Mọi biểu thức JS đều hợp lệ trong {}: phép cộng, gọi hàm, ternary */}
      <p>Next year: {user.age + 1}</p>
      {/* (9) Attribute binding: src={...} thay cho [src]="..." của Angular */}
      <img src="https://picsum.photos/120" alt={name} width={120} />
      {/* (10) Class/style động: className + object camelCase — tương đương [class.active]/[style.color] */}
      <div className={isActive ? "active" : ""} style={{ color: isActive ? "green" : "red" }}>
        Trạng thái: {isActive ? "Đang hoạt động" : "Tạm nghỉ"}
      </div>
      <button onClick={() => setIsActive((a) => !a)}>Đảo trạng thái</button>
      {/* (11) Controlled input: value đọc state + onChange ghi ngược state — thay [(ngModel)] */}
      {/* e là React.ChangeEvent<HTMLInputElement>, e.target.value là text vừa gõ */}
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Gõ tên..." />
      {/* (12) Event binding: truyền THAM CHIẾU hàm via arrow — KHÔNG gọi ngay lúc render */}
      {/* Vì sao bọc arrow? Để click mới gọi alert với name mới nhất từ closure render hiện tại */}
      <button onClick={() => alert(`Hello ${name}`)}>Click me!</button>
    </>
  );
}
```

Các biến thể binding hay dùng (đã có một phần trong `example.tsx`, liệt kê đầy đủ để tra cứu):

```tsx
// Attribute binding (giống [src], [alt]): mọi thuộc tính nhận {} thay vì ngoặc vuông
<img src={user.avatarUrl} alt={user.name} width={120} />

// Conditional text (giống ternary trong template Angular)
<p>{user.age >= 18 ? "Người lớn" : "Vị thành niên"}</p>

// Class/style động — className là chuỗi, style là object camelCase
<div className={isActive ? "active" : ""} style={{ color: "red", backgroundColor: "#fff" }} />

// Label/input liên kết: htmlFor thay vì for (vì for là keyword JS)
<label htmlFor="email">Email</label>
<input id="email" onKeyDown={(e) => { if (e.key === "Enter") submit(); }} />
```

## Giải thích từng phần
- Dòng `import { useState } from "react"`: lấy hook giữ state. Vì sao cần? Vì biến thường mất sau mỗi render, state do React giữ qua các lần render và `setName` là cách duy nhất báo React "dữ liệu đổi, vẽ lại đi".
- Dòng `type User = { name: string; age: number }`: định nghĩa shape dữ liệu. Vì sao type ở đây? Để `user.age` được IDE gợi ý, gõ sai `user.agge` TS báo ngay lúc compile thay vì trắng trang lúc chạy.
- Dòng `const user: User = { name: "Son Nguyen", age: 30 }`: object tĩnh tạo mỗi render. Vì sao không `useState` cho `user`? Vì `user` không đổi theo thời gian trong demo — dùng biến thường là đủ, chỉ `name` (người dùng sửa) mới cần state. Đây là bài học "đừng state hóa mọi thứ".
- Dòng `const [name, setName] = useState(user.name)`: khởi tạo state bằng `"Son Nguyen"`. `useState` trả tuple `[giá trị hiện tại, hàm cập nhật]`. Giá trị khởi tạo chỉ dùng lần mount đầu; render sau bỏ qua.
- Dòng `const [isActive, setIsActive] = useState(true)`: state boolean điều khiển class/style. Vì sao tách state riêng mà không gộp vào object? Vì mỗi state đổi chỉ re-render một lần, tách nhỏ dễ suy luận, gộp object lớn dễ quên spread gây mất field.
- Cặp `<>...</>`: fragment — nhóm 7 element con mà không thêm node DOM. Vì sao không `<div>`? Vì `<div>` thừa phá layout flex/grid và làm DOM sâu. Fragment tương đương `ng-container`.
- Dòng `<h3>Your name: {name}</h3>`: interpolation. Mỗi lần `name` đổi, React diff thấy text node này khác → chỉ cập nhật đúng text node, không dựng lại `<h3>`.
- Dòng `<p>Next year: {user.age + 1}</p>`: chứng minh `{}` là **biểu thức bất kỳ**. `user.age + 1` tính mỗi render (derived value) — rẻ, không cần `useState` hay `useMemo`.
- Dòng `<img src="..." alt={name} width={120} />`: attribute binding. `src` là string tĩnh nên không cần `{}`; `alt={name}` động nên cần. `width={120}` là number — JSX truyền number trực tiếp, không cần `"120"`.
- Dòng `<div className={...} style={{...}}>`: `className` thay vì `class` vì `class` là keyword JS và React dùng DOM property name. `style` là object camelCase (`backgroundColor`), không phải chuỗi CSS (`background-color`). Viết `style="color:red"` sẽ lỗi type.
- Dòng `<button onClick={() => setIsActive((a) => !a)}>`: functional update `(a) => !a` đảm bảo đảo từ giá trị mới nhất, an toàn khi click nhanh nhiều lần (tránh stale closure khi dùng `!isActive` trực tiếp).
- Dòng `<input value={name} onChange={...} />`: controlled input. `e` suy kiểu `ChangeEvent<HTMLInputElement>`, `e.target.value` là string. Không có `[(ngModel)]` — giá trị hiển thị do state quyết định.
- Dòng `<button onClick={() => alert(...)}}`: arrow bọc để truyền tham chiếu. Khác `onClick={alert(...)}` (gọi ngay lúc render, truyền `undefined` vào onClick). Quy tắc: cần tham số → bọc arrow; không tham số → truyền tên hàm.
- Quy tắc `{}` không render object: phải chọn field (`{user.name}`), không `{user}`. Boolean/null bị bỏ qua nên `{isActive && <span/>}` là pattern chuẩn sang DAY 2.

## Bảng so sánh Angular ↔ React
| Angular | React | Ghi chú |
|---|---|---|
| `{{ expr }}` | `{expr}` | Ngoặc nhọn đơn; JSX đọc từ scope TS của hàm, không phải template context |
| `[src]="url"` | `src={url}` | Không có ngoặc vuông; mọi attribute động đều `={}` |
| `(click)="fn()"` | `onClick={fn}` | Truyền **tham chiếu hàm**, không gọi kèm `()` trừ khi bọc arrow |
| `[(ngModel)]="x"` | `value={x} onChange={e => setX(e.target.value)}` | Đẩy 2 chiều về 1 chiều + event; controlled input |
| `[class.active]="ok"` | `className={ok ? "active" : ""}` | Không có `class.binding`; dùng ternary hoặc clsx/cn |
| `[style.color]="c"` | `style={{ color: c }}` | Object camelCase (`backgroundColor`), không phải chuỗi CSS |
| `(keyup.enter)="..."` | `onKeyDown` + check `e.key === "Enter"` | Không có syntax sugar phím, tự check key |
| `Pipe` trong template (`\| date`) | Gọi hàm trong `{}` (`fmtDate.format(d)`) | Format là function thuần (chi tiết DAY 10) |
| `[attr.aria-label]="x"` | `aria-label={x}` | Attribute ARIA viết kebab-case như HTML, nhận `{}` bình thường |
| `for` (label) | `htmlFor` | `for` là keyword JS nên JSX đổi tên |
| `tabindex` | `tabIndex` | Mọi attribute DOM đều camelCase trong JSX |

## Lỗi thường gặp (Common pitfalls)

### 1. `onClick={showInfo()}` thay vì `onClick={showInfo}`
Mô tả: hàm chạy *ngay lúc render*, không phải lúc click. Nút bấm không còn tác dụng, alert hiện khi mở trang.

```tsx
// ❌ SAI: gọi hàm lúc render, truyền kết quả (undefined) vào onClick
function App() {
  const showInfo = () => alert("hi");
  return <button onClick={showInfo()}>Bấm</button>; // alert hiện ngay khi mở trang
}
```

```tsx
// ✅ ĐÚNG: truyền tham chiếu; cần tham số thì bọc arrow
function App() {
  const showInfo = () => alert("hi");
  const greet = (n: string) => alert(`hi ${n}`);
  return (
    <>
      <button onClick={showInfo}>Bấm</button>
      <button onClick={() => greet("Son")}>Chào Son</button>
    </>
  );
}
```

### 2. Dùng `if`/`for` bên trong `{}`
Mô tả: `if`/`for` là statement, `{}` chỉ nhận expression → lỗi cú pháp.

```tsx
// ❌ SAI: statement trong JSX — SyntaxError
return <p>{if (age > 18) { "lớn" } else { "nhỏ" }}</p>;
return <ul>{for (const x of list) { <li>{x}</li> }}</ul>;
```

```tsx
// ✅ ĐÚNG: ternary / && / .map() — đều là expression trả giá trị
return <p>{age > 18 ? "lớn" : "nhỏ"}</p>;
return <ul>{list.map((x) => <li key={x}>{x}</li>)}</ul>;
```

### 3. Quên `onChange` → input đóng băng
Mô tả: giữ `value` mà không có `onChange`, gõ không vào, tưởng browser hỏng.

```tsx
// ❌ SAI: controlled nhưng không có đường ghi — input đứng im
const [name, setName] = useState("Son");
return <input value={name} />; // gõ phím nào cũng không hiện
```

```tsx
// ✅ ĐÚNG: luôn cặp value + onChange, hoặc chuyển uncontrolled có chủ đích
return <input value={name} onChange={(e) => setName(e.target.value)} />;
// Hoặc uncontrolled: <input defaultValue="Son" ref={ref} />
```

### 4. Set state từ giá trị cũ không dùng hàm
Mô tả: `setName(name + "!")` trong update nhanh (double-click, interval) có thể mất update vì `name` là snapshot cũ của render đó.

```tsx
// ❌ SAI: đọc snapshot cũ — bấm nhanh 2 lần chỉ tăng 1
<button onClick={() => { setCount(count + 1); setCount(count + 1); }}>+2?</button> // chỉ +1
```

```tsx
// ✅ ĐÚNG: functional update đọc giá trị mới nhất do React đảm bảo
<button onClick={() => { setCount((c) => c + 1); setCount((c) => c + 1); }}>+2</button> // +2 đúng
```

### 5. Render object trực tiếp
Mô tả: `{user}` ném "Objects are not valid as a React child", trang trắng.

```tsx
// ❌ SAI
const user = { name: "Son", age: 30 };
return <p>{user}</p>;
```

```tsx
// ✅ ĐÚNG: chọn field cụ thể, hoặc stringify để debug
return <p>{user.name} — {user.age} tuổi</p>;
// Debug: <pre>{JSON.stringify(user, null, 2)}</pre>
```

### 6. Dùng `class` thay vì `className`
Mô tả: React cảnh báo `Invalid DOM property 'class'. Did you mean 'className'?`, style không áp dụng đúng.

```tsx
// ❌ SAI
<div class="active">Hi</div>
```

```tsx
// ✅ ĐÚNG
<div className="active">Hi</div>
```

### 7. `style="color:red"` (chuỗi)
Mô tả: TS lỗi type, runtime React bỏ qua.

```tsx
// ❌ SAI
<div style="color:red">Hi</div>
```

```tsx
// ✅ ĐÚNG: object camelCase, giá trị string/number
<div style={{ color: "red", backgroundColor: "#fff", marginTop: 12 }}>Hi</div>
```

### 8. `{count && ...}` khi count = 0 in ra "0"
Mô tả: `0` là giá trị render được, không bị bỏ qua như `false`.

```tsx
// ❌ SAI: count = 0 -> hiện số 0 lạc lõng trước nội dung
{count && <span>Bạn có tin nhắn</span>}
```

```tsx
// ✅ ĐÚNG: ép boolean rõ ràng
{count > 0 && <span>Bạn có {count} tin nhắn</span>}
```

### 9. `useState` đặt trong `if`
Mô tả: vi phạm rules of hooks — "Rendered more hooks than during the previous render" khi điều kiện đổi.

```tsx
// ❌ SAI: số lượng hook đổi theo render
if (user) { const [x, setX] = useState(0); }
```

```tsx
// ✅ ĐÚNG: hook luôn top-level, điều kiện nằm BÊN TRONG hoặc sau hook
const [x, setX] = useState(0);
if (!user) return null;
```

## Best practices / Mẹo
- Đưa **logic format ra ngoài JSX** (biến/hàm trên đầu component) để JSX đọc như HTML sạch. Vì sao? Vì JSX lẫn logic dày đặc khó review; biến đặt tên tốt (`nextYear`, `isAdult`) tự tài liệu. Format nặng gộp vào `Intl`/hàm thuần (DAY 10).
- Dùng **derived data** thay vì state trùng lặp: `nextYear = user.age + 1` tính mỗi render là rẻ — đừng `useState` giá trị tính được. Vì sao? Vì hai nguồn (state + gốc) dễ lệch; derived luôn đúng.
- Tận dụng TS: type cho `user` và props; `onChange` tự suy kiểu, đừng khai `React.FormEvent` thủ công trừ khi cần. Vì sao? Để compile chặn sai kiểu sớm, IDE gợi ý đủ.
- Dùng fragment thay `<div>` thừa để DOM gọn và CSS layout dễ hơn. Vì sao? Vì `<div>` thừa phá flex/grid, fragment không tồn tại trong DOM.
- Với React Compiler 1.0, arrow function trong `onClick` được memo tự động — đừng vội `useCallback`. Vì sao? Vì memo thủ công tốn so sánh, Compiler làm đúng hơn.
- Giữ handler ngắn; handler phức tạp tách hàm đặt tên (`handleSubmit`) để dễ đọc và test. Vì sao? Vì JSX chỉ nên "vẽ", logic đặt tên ở trên dễ unit test.
- Đặt `aria-label`/`htmlFor` cho input/button — vừa a11y vừa giúp test `getByRole` (DAY 21). Vì sao? Vì query theo role/label bền trước refactor class/style.
- Giữ mỗi phần tử JSX đủ nhỏ để tách component khi nó bắt đầu phình to (quy tắc ngón tay: >80 dòng cân nhắc tách). Vì sao? Vì component nhỏ dễ memo, dễ test, dễ tái dùng.

## Bài tập nhỏ
1. Thêm `{user.name.length}` và một ô input thứ 2 để sửa `age` (state riêng) — xem cả 2 dòng cập nhật đồng bộ. Vì sao cần state riêng cho `age` mà không sửa `user.age` trực tiếp?
2. Đổi input sang "không kiểm soát": bỏ `value`/`onChange`, dùng `ref` — so sánh hành vi (gõ có cập nhật `<h3>` không?), rồi giải thích vì sao controlled vẫn được khuyên dùng.
3. Thêm nút "Reset tên" gọi `setName(user.name)` và một nút "In hoa" gọi `setName((n) => n.toUpperCase())` — quan sát functional update khác gì `setName(name.toUpperCase())` khi bấm nhanh 2 lần.
4. Đổi `alert` sang hiển thị một `<p>` text bên dưới thay vì alert — giữ tinh thần "state-driven UI" (mọi output đều từ state, không gọi API trình duyệt chen ngang).

## Reference
- https://react.dev/learn/javascript-in-jsx-with-curly-braces
- https://react.dev/learn/responding-to-events
- https://react.dev/learn/sharing-state-between-components#controlled-and-uncontrolled-components
- https://react.dev/reference/react-dom/components/common
