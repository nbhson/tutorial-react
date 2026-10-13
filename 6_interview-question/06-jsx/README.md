# Q6: JSX thực chất là gì? Sao trong dấu `{}` chỉ viết được biểu thức mà không viết được `if`/`for`?

## Câu hỏi

> JSX mình viết trong component, sau khi build thì nó thực chất là gì — HTML, string hay cái khác?
> Trong `{}`, được đặt những gì, không được đặt gì? Muốn rẽ nhánh hoặc lặp thì viết thế nào?

## Trả lời ngắn (elevator pitch, 30 giây)

- **JSX = cú pháp mở rộng của TypeScript** (Vite/esbuild biên dịch) cho phép viết "gần giống HTML" trong logic render. **Không phải HTML thật, không phải string** — nó được biên dịch thành **function call trả về object mô tả UI** (React element).
- **`{expression}` là cửa ngõ DUY NHẤT đưa dữ liệu TS vào JSX** — và nó chỉ nhận **expression** (mọi thứ **trả về giá trị**: biến, phép toán, gọi hàm, ternary, template string, array...).
- **Không nhận statement** (câu lệnh: `if`, `for`, `switch`, khai báo `const`...) → dùng **ternary** cho rẽ nhánh, **`.map()`** cho lặp, hoặc IIFE (rare).
- Vì JSX "là JS" nên bạn không học DSL mới — **biết JS là biết JSX**; mọi logic nằm ở phần đầu component, `return` chỉ "vẽ".

## Trả lời chi tiết

### 1. JSX biên dịch thành gì

```tsx
// Bạn viết:
const el = <h3>Your name: {name}</h3>;

// Vite (esbuild/Babel) biên dịch gần tương đương:
const el = jsx("h3", { children: ["Your name: ", name] });
// el là object thuần { type, props } — React đọc object để Dựng DOM thật.
```

Hệ quả thực tế:
- JSX = **JS function call** → được dùng `import`, biến, hàm, toán tử...
- Render "chưa phải DOM" — DOM thật chỉ được tạo ở bước **commit** (reconciliation — xem [`05-virtual-dom`](../05-virtual-dom)).

### 2. `{}`: expression được, statement không

```tsx
const user = { name: "Son", age: 30 };

// ✅ 5 kiểu hợp lệ trong {}
<p>Biến: {name}</p>
<p>Phép toán: {user.age + 1}</p>
<p>Ternary: {user.age >= 18 ? "Người lớn" : "Vị thành niên"}</p>
<p>Gọi hàm (format): {new Intl.NumberFormat("vi-VN").format(120000)}</p>
<p>Template literal: {`Name: ${user.name}`}</p>

// ❌ SAI — statement không hợp lệ trong {}
<p>{if (user.age > 18) { return "lớn"; }}</p>   // if là statement
<p>{const x = 1; x}</p>                          // declaration là statement
<p>{for (let i = 0; i < 3; i++) { /* ... */ }}</p> // vòng lặp là statement
```

Bảng "điều gì đặt trong `{}` được, được làm gì thay thế":

| Muốn làm | ❌ Statement (không được) | ✅ Expression (được) |
|---|---|---|
| Rẽ nhánh | `if/else` | **Ternary** `cond ? A : B` (hay `cond && <X/>`) |
| Lặp | `for`, `while` | **`.map()`** (kết quả của `.map` là expression) |
| Khai báo + dùng | `const x = f(); {x}` | **IIFE** `{(() => { const x = f(); return x; })()}` (rare, tránh được càng tốt) |
| Bỏ qua nếu không | — | `null` / `undefined` / `false` / `true` → **không render gì** (nền tảng pattern `{cond && <X/>}`) |

### 3. Vì sao React chọn "expression only" (đây là điểm "ăn điểm")

- `{}` nằm **giữa render pass** — bước này phải **tinh khiết (pure)**: cùng input → cùng output, không side-effect. Statement (`if` có thể chứa assignment, `for` có thể đổi biến ngoài...) phá tính pure, làm StrictMode (chạy 2 lần) và reconciliation (diff) "không có nghĩa" (xem [`03-strictmode`](../03-strictmode), [`05-virtual-dom`](../05-virtual-dom)).
- Angular giải quyết "cùng vấn đề" bằng **DSL riêng** (`*ngIf`, `*ngFor`, `{{}}`) — cú pháp mới, cần học. React "trốn" bằng cách: **chỉ cho expression = toàn bộ sức mạnh JS, không cú pháp gì thêm** — biết JS là biết JSX.

### 4. Đối chiếu Angular (điểm "ăn điểm" cho người từ Angular)

| Angular template | React JSX |
|---|---|
| `{{ name }}` (interpolation, có thể concat nhiều) | `{name}` (mỗi `{}` là một expression đơn) |
| `[src]="url"` (property binding) | `src={url}` (attribute binding) |
| `(click)="fn($event)"` | `onClick={fn}` (props `on*`) |
| `[(ngModel)]="x"` (two-way) | `<input value={x} onChange={e => setX(e.target.value)} />` (cha cho giá trị + con báo sự kiện) |
| `*ngIf`, `*ngFor` (directives) | `cond && ...`, `list.map(...)` (pure JS) |

## Bẫy khi phỏng vấn

1. **Nói "JSX là HTML"** → sai ở 3 điểm: (a) biên dịch thành object JS, không phải parse HTML; (b) cú pháp "gần" nhưng khác thật (camelCase `className` thay vì `class`, `htmlFor` thay vì `for`, tag bắt buộc đóng `/>`, một element mỗi return...); (c) `{}` không nhận statement.
2. **Nhét `if`/`for` vào `{}`** (còn hay gặp khi chuyển từ Angular) → lỗi compile. Fix: ternary + `.map()`.
3. **Render object trực tiếp** `{user}` → runtime "Objects are not valid as a React child". Fix: chọn field `{user.name}`.
4. **Quên `{}`** — viết `<p>Name: name</p>` (không có `{}`) thì **đây là text "name"**, không phải biến.
5. **IIFE trong JSX "để khai báo biến"** → hoạt động nhưng code "gò"; thường nên **khử** (tính giá trị đó ở phần đầu component, trước `return`) — sạch hơn, dễ đọc hơn, dễ memo (Compiler).

## Gợi ý câu chốt

> "JSX là cú pháp mở rộng của TS, biên dịch thành function call trả về object mô tả UI — không phải HTML string. `{}` là 'cửa' đưa dữ liệu TS vào JSX, và nó chỉ nhận **expression** (trả về giá trị, để render giữ tính pure): biến, phép toán, ternary, `.map()`, gọi hàm format. Không nhận statement (`if`, `for`, `switch`, declaration) — muốn rẽ nhánh thì ternary, muốn lặp thì `.map()`. Đây cũng là chỗ khác với Angular: Angular có DSL riêng (`*ngIf`/`*ngFor`), React 'trốn' bằng cách chỉ cho expression = dùng toàn bộ JS thuần."

## Reference

- Tutorial nội bộ: [`3_react-tutorial/1-jsx-data-display`](../../3_react-tutorial/1-jsx-data-display) — 4 chiều bind data, controlled input, bảng đối chiếu Angular
- [`3_react-tutorial/2-conditional-list-rendering`](../../3_react-tutorial/2-conditional-list-rendering) — ternary, `cond &&`, `.map()` + key
- Q5 (Virtual DOM) — JSX là input của reconciliation (object model)
- Q3 (StrictMode) — vì sao render phải pure

## Câu hỏi liên quan

- **Hỏi tiếp (liên tục)**: [Q5 — Virtual DOM, diff ra sao?](../05-virtual-dom/README.md) · [Q7 — vì sao có Fragment?](../07-fragment/README.md)
- **Đào sâu (xuyên nhóm)**: [Q12 — component nhận children chỉ render child đầu?](../12-filter-first-child/README.md)
