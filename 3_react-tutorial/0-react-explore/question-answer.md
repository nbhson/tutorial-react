# DAY 0 — Hỏi & Đáp: createRoot, render, StrictMode, Component, JSX, Vite, HMR, react-ts, Entry Point

> File hỏi–đáp chi tiết cho `3_react-tutorial/0-react-explore`.
> Đọc kèm: `README.md` (lý thuyết) + `example.tsx` (code chạy được).

---

## 1. `createRoot` là gì? Vì sao chỉ gọi một lần?

**Hỏi:** `createRoot` làm gì? Vì sao tutorial dặn chỉ gọi một lần duy nhất?

**Đáp:**
- `createRoot` (từ `react-dom/client`, có từ React 18) tạo một **root React** gắn với một node DOM thật
  (thường là `<div id="root">` trong `index.html`). Nó là "cầu nối" giữa cây React và DOM trình duyệt.
- Chỉ gọi **một lần** lúc khởi động app (trong `src/main.tsx`). Mọi cập nhật sau đó do **state/hooks**
  kích hoạt re-render — bạn không bao giờ gọi `createRoot` hay `.render()` lại.
- Gọi lại trên cùng container sẽ bị warning *"container has already been created"*.
- Khác React 17: API cũ `ReactDOM.render(<App />, el)` đã bị gỡ; React 18+ bắt buộc `createRoot(el).render(...)`
  để dùng được Concurrent Rendering (render có thể ngắt, ưu tiên, transitions).

```tsx
// ĐÚNG — 1 lần trong main.tsx
createRoot(document.getElementById("root")!).render(<App />);

// SAI — gọi mỗi khi muốn cập nhật UI
function handleClick() {
  createRoot(document.getElementById("root")!).render(<App />); // ❌ warning + mất state
}
```

---

## 2. `.render()` chạy khi nào? Sau đó ai cập nhật UI?

**Hỏi:** `.render()` chỉ chạy một lần đầu, vậy sau này UI cập nhật bằng cách nào?

**Đáp:**
- `.render(<App />)` là **lần mount đầu tiên**: React chạy function `App()`, biến JSX thành element object,
  dựng DOM thật và chèn vào `#root`.
- Sau đó, mọi cập nhật đều qua **re-render tự động**: khi `useState`/`useReducer`/context đổi, hoặc props cha đổi,
  React tự chạy lại function component và **diff Virtual DOM** để vá đúng node DOM khác biệt.
- Bạn không gọi `.render()` thủ công nữa. Muốn UI đổi → đổi **state**, không thao tác DOM trực tiếp.

```
.render(<App />)          → mount lần đầu (1 lần duy nhất)
setCount(c => c + 1)      → React re-render App → diff → vá DOM (mọi lần sau)
```

---

## 3. `StrictMode` là gì? Vì sao render 2 lần ở dev mà prod thì không?

**Hỏi:** Bọc `<StrictMode>` thấy `console.log("render")` in 2 lần, có phải bug? Có nên bỏ nó đi?

**Đáp:**
- **Không phải bug, không nên bỏ.** `StrictMode` là component đặc biệt của React, **chỉ có tác dụng ở development**.
  Production build tự loại bỏ hành vi kiểm tra nên không ảnh hưởng hiệu năng.
- Ở dev nó cố tình **chạy 2 lần**: render function, effects (`useEffect` mount → cleanup → mount lại),
  để lộ side-effect "không sạch" (thiếu cleanup, fetch không abort,订阅 không hủy, mutation trong render).
- Nếu code bạn đúng (effect có cleanup, render thuần khiết), chạy 2 lần vẫn cho kết quả đúng.
  Nếu chạy 2 lần mà sinh bug (gọi API 2 lần, timer nhân đôi) thì đó chính là bug thật mà StrictMode giúp bạn thấy sớm.
- Quy tắc: **giữ `<StrictMode>` ở dev**, viết effect đúng chuẩn (setup ↔ cleanup đối xứng, xem DAY 15).

```tsx
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
```

---

## 4. Component là gì? Vì sao phải viết hoa chữ cái đầu?

**Hỏi:** Component trong React 2026 là gì? Vì sao `App` viết hoa còn `app` thì không chạy?

**Đáp:**
- Component (chuẩn hiện tại) là **một function bình thường trả về JSX**. Không decorator, không class trong code mới.
- TypeScript type của props chính là "API contract": IDE gợi ý, compiler chặn sai kiểu ngay lúc viết.
- **JSX phân biệt bằng chữ cái đầu:** PascalCase (`<App />`, `<PostCard />`) = component do bạn định nghĩa;
  chữ thường (`<div>`, `<span>`, `<app>`) = thẻ HTML thật. Viết `<app />` sẽ bị hiểu là thẻ HTML lạ, không chạy code bạn muốn.
- Quy ước: mỗi file một component chính + component con nhỏ liên quan; tên file và tên function trùng nhau.

```tsx
// Component hợp lệ: function + return JSX
export default function App() {
  return <h1>Hello React 19 + Vite!</h1>;
}
```

---

## 5. JSX là gì? Có phải HTML trong JS không?

**Hỏi:** JSX có phải là HTML nhúng trong JavaScript? Nó biên dịch thành gì?

**Đáp:**
- JSX **nhìn giống HTML nhưng là TypeScript thuần**, được compiler (esbuild/Babel qua plugin React) biến thành
  lời gọi tạo element object — tức là object JS mô tả UI (`{ type: "h1", props: { children: "..." } }`),
  **không phải chuỗi HTML**.
- Vì là code nên bạn dùng được toàn bộ sức mạnh JS: biến, điều kiện, `.map()`, expression trong `{...}`.
- Khác HTML: `class` → `className`, `for` → `htmlFor`, attribute camelCase (`onClick`, `tabIndex`),
  mọi thẻ phải đóng (`<img />`, `<br />`), một component chỉ return **một node gốc** (dùng fragment `<>...</>` nếu cần nhiều).
- Tương đương Angular: fragment `<>...</>` ≈ `ng-container` — nhóm element mà không thêm node DOM thừa.

```tsx
const name = "React";
return <h1 className="title">Hello {name}!</h1>; // {name} là expression JS
```

---

## 6. Vite là gì? Vì sao 2026 dùng Vite mà không dùng CRA?

**Hỏi:** Vite đóng vai trò gì trong app React? CRA đâu rồi?

**Đáp:**
- **React chỉ là UI library** (render view). **Vite là build tool/dev server**: tạo template project, phục vụ dev,
  đóng gói production. Hai mảnh ghép độc lập, lắp qua `npm create vite`.
- **CRA (Create React App) đã deprecated**, chậm (webpack bundle toàn bộ khi dev), cấu hình khó mở rộng → không dùng nữa.
- Vite nhanh nhờ 2 tầng: dev dùng **esbuild** (Go, siêu nhanh) phục vụ **ESM gốc từng module** — khởi động gần như
  tức thì dù app lớn; build production dùng **Rollup** (bundle + minify + tách chunk + hash tên file).
- Template chuẩn: `npm create vite@latest my-app -- --template react-ts` sinh sẵn `index.html`, `src/main.tsx`,
  `src/App.tsx`, `vite.config.ts`, `tsconfig.json`, `package.json`.

| Lệnh | Việc xảy ra |
|---|---|
| `npm run dev` | Dev server `http://localhost:5173`, ESM từng module, HMR giữ state |
| `npm run build` | Rollup bundle production vào `dist/` (hash tên file để cache) |
| `npm run preview` | Chạy thử bản `dist/` trước khi deploy |

---

## 7. HMR là gì? Khác gì reload trang?

**Hỏi:** Sửa `App.tsx` thấy trình duyệt tự cập nhật mà không mất state đang nhập — cơ chế nào?

**Đáp:**
- Đó là **HMR (Hot Module Replacement)** của Vite: khi bạn lưu file, Vite chỉ đẩy **module vừa đổi** xuống trình duyệt
  và React "vá nóng" component đó, **giữ nguyên state** (text đang gõ, counter đang đếm).
- Reload trang (F5) thì mất hết state vì tải lại toàn bộ app từ đầu.
- Lưu ý: HMR chỉ giữ state khi bạn sửa **thân component**; nếu sửa logic khởi tạo state hoặc đổi export,
  React có thể phải remount (reset state) — đó là hành vi đúng để tránh state cũ sai hình.

---

## 8. Template `react-ts` gồm những gì?

**Hỏi:** `npm create vite -- --template react-ts` sinh ra những file nào, file nào quan trọng nhất?

**Đáp:**

```text
my-app/
├── index.html          # entry HTML: <div id="root"> + <script src="/src/main.tsx">
├── src/
│   ├── main.tsx        # entry JS: createRoot + StrictMode + import App
│   ├── App.tsx         # component gốc
│   └── vite-env.d.ts   # khai báo type cho import.meta.env, asset
├── vite.config.ts      # plugin React, alias @/, proxy, env
├── tsconfig.json       # strict, noUncheckedIndexedAccess, jsx: react-jsx
└── package.json        # scripts dev / build / preview
```

- Quan trọng nhất để hiểu luồng chạy: `index.html` → `src/main.tsx` → `src/App.tsx`.
- Còn lại là cấu hình: `vite.config.ts` (trung tâm plugin/alias/proxy), `tsconfig.json` (chuẩn type),
  `package.json` (scripts + dependency).

---

## 9. Entry point của app React nằm ở đâu?

**Hỏi:** "Entry point" của app React-Vite là file nào: `index.html` hay `main.tsx`?

**Đáp:**
- Là **cả hai, nối tiếp nhau**:
  1. `index.html` — entry của **Vite/trình duyệt**: chứa `<div id="root"></div>` (chỗ neo duy nhất)
     và `<script type="module" src="/src/main.tsx">` (điểm vào JS).
  2. `src/main.tsx` — entry của **React**: `createRoot(...).render(<StrictMode><App /></StrictMode>)`.
- Mọi thứ khác (`App`, pages, components) chỉ là component lồng nhau trong cây render từ `main.tsx`.
- Lỗi kinh điển: `index.html` thiếu `#root` → `getElementById` trả `null` → crash lúc mount.
  Dấu `!` trong `getElementById("root")!` là **non-null assertion**: bạn cam kết node đã tồn tại.

---

## 10. Hooks + "React tự quản lý re-render" nghĩa là gì? (So với Angular Zone.js)

**Hỏi:** Không có `NgModule`, không có Zone.js, vậy React biết khi nào cần cập nhật UI?

**Đáp:**
- Angular dùng **Zone.js** "nghe lén" mọi sự kiện bất đồng bộ rồi chạy change detection quét lại cây.
  React thì **không nghe lén**: UI chỉ re-render khi có tín hiệu rõ ràng — **state/props/context đổi qua hooks**.
- Hooks (`useState`, `useReducer`, `useSyncExternalStore`, ...) vừa lưu dữ liệu vừa là "chuông báo":
  gọi setter (`setCount`) = báo React "schedule một lần render lại".
- Hệ quả tư duy: muốn UI đổi → **đổi state** (không set DOM tay, không gọi render tay).
  Render function phải **thuần khiết** (cùng props/state → cùng JSX, không mutation trong render) để React
  render lại bao nhiêu lần cũng an toàn — đây chính là điều StrictMode kiểm tra ở dev.

```tsx
const [count, setCount] = useState(0);
// ĐÚNG: đổi state → React tự re-render
<button onClick={() => setCount(c => c + 1)}>+1</button>
```

---

## 11. React Compiler 1.0 là gì? Có còn cần `memo`/`useMemo`/`useCallback`?

**Hỏi:** Nghe nói React Compiler "tự memoize", vậy có nên xóa hết `memo`/`useMemo` không?

**Đáp:**
- **React Compiler 1.0** (stable 10/2025) là compiler build-time: phân tích component/hook của bạn và **tự chèn
  memoization** (nhớ kết quả render/giá trị callback) vào bản build production. Bạn viết code "ngây thơ"
  (không `memo` bừa bãi) mà vẫn ít re-render thừa.
- Điều kiện: code phải tuân **Rules of React** (không mutate props/state trong render, hooks ở top-level,
  deps effect đầy đủ). Vi phạm → compiler bỏ qua (skip) và có lint `eslint-plugin-react-hooks` v6 báo.
- Khuyến nghị 2026: **bật Compiler ngay từ đầu** (`babel-plugin-react-compiler` + healthcheck), **đừng `memo` vội**.
  Chỉ thêm `memo`/`useMemo` thủ công khi đã **đo** (React DevTools/Performance) thấy bottleneck thật
  (list 10k+, tính toán nặng) — hoặc khi cần ổn định tham chiếu cho API bên ngoài (ví dụ `useEffect` deps).
  (Xem sâu: `4_react-new-feature/5_react-compiler` và `2_react-techniques/3_performance-optimization`.)

---

## 12. `strict` + `noUncheckedIndexedAccess` trong `tsconfig` để làm gì?

**Hỏi:** Vì sao tutorial bắt bật `strict` và `noUncheckedIndexedAccess`? Chúng bắt lỗi gì?

**Đáp:**
- **`strict: true`** là "bật tất cả kiểm tra nghiêm": `strictNullChecks` (null/undefined phải xử lý tường minh),
  `noImplicitAny` (cấm `any` ngầm), kiểm tra `this`, return... → sai type lộ **lúc compile** thay vì crash lúc chạy.
  Props component nhờ đó thành contract thật: truyền thiếu/sai kiểu là báo đỏ ngay.
- **`noUncheckedIndexedAccess: true`** (không nằm trong `strict`, phải bật riêng): truy cập mảng/tuple bằng index
  sẽ có thêm `| undefined`. Vì `arr[i]` **có thể** out-of-bound mà TS mặc định vẫn tin là `T` → bug lọt lưới.

```ts
const list = ["a", "b"];
// strict: string[] ; strict + noUncheckedIndexedAccess: (string | undefined)[]
const first = list[0];      // type: string | undefined → buộc xử lý
if (first !== undefined) {
  console.log(first.toUpperCase()); // an toàn
}
// hoặc: const first = list[0] ?? "fallback";
```

- Cặp đôi này đặc biệt hữu ích cho CRUD/list rendering: `posts[i]`, `record[key]` đều buộc bạn xử lý case
  "không tồn tại" thay vì `.title` trên `undefined` rồi crash ở production.

---

## Reference

- `README.md` + `example.tsx` trong cùng thư mục (DAY 0)
- https://react.dev/reference/react-dom/client/createRoot
- https://react.dev/reference/react/StrictMode
- https://react.dev/learn/start-a-new-react-project
- https://vite.dev/guide/ (đặc biệt mục HMR + `react-ts` template)
- https://react.dev/learn/react-compiler
- https://www.typescriptlang.org/tsconfig/#strict · https://www.typescriptlang.org/tsconfig/#noUncheckedIndexedAccess
