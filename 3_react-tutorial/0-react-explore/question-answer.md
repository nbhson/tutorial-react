# DAY 0 — Hỏi & Đáp: createRoot, render, StrictMode, Component, JSX, Vite, HMR, react-ts, Entry Point

> File hỏi–đáp chi tiết cho `3_react-tutorial/0-react-explore`.
> Đọc kèm: `README.md` (lý thuyết) + `example.tsx` (code chạy được).

File này là "12 câu hỏi khoai" mà người mới bắt đầu React 19 nào cũng gặp, từ `createRoot` đến `tsconfig` strict. Mỗi câu có cấu trúc: **Hỏi** ngắn gọn → **Đáp** chi tiết kèm ví von — đọc tuần tự hoặc tra cứu theo câu đang thắc mắc.

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

Hãy hình dung `createRoot` như **cắm cây vào chậu**: chỉ cắm gốc một lần, sau đó cây tự đâm chồi (re-render) — bạn không nhổ cắm lại mỗi lần cây lớn lên.

> 📄 **Code ví dụ:** [`examples/01-1-createroot-la-gi-vi-sao-chi-goi.tsx`](examples/01-1-createroot-la-gi-vi-sao-chi-goi.tsx)

> **Tóm gọn 1 câu:** `createRoot` là "cắm gốc" duy nhất lúc khởi động — sau đó mọi cập nhật là việc của state/hooks, đừng cắm lại.

---

## 2. `.render()` chạy khi nào? Sau đó ai cập nhật UI?

**Hỏi:** `.render()` chỉ chạy một lần đầu, vậy sau này UI cập nhật bằng cách nào?

**Đáp:**
- `.render(<App />)` là **lần mount đầu tiên**: React chạy function `App()`, biến JSX thành element object,
  dựng DOM thật và chèn vào `#root`.
- Sau đó, mọi cập nhật đều qua **re-render tự động**: khi `useState`/`useReducer`/context đổi, hoặc props cha đổi,
  React tự chạy lại function component và **diff Virtual DOM** để vá đúng node DOM khác biệt.
- Bạn không gọi `.render()` thủ công nữa. Muốn UI đổi → đổi **state**, không thao tác DOM trực tiếp.

Ví von: lần đầu `.render()` là **dựng sân khấu**; sau đó bạn không dựng lại sân khấu, chỉ đổi **hồ sơ kịch bản** (state) — React tự xếp lại cảnh theo hồ sơ mới.

```
.render(<App />)          → mount lần đầu (1 lần duy nhất)
setCount(c => c + 1)      → React re-render App → diff → vá DOM (mọi lần sau)
```

> **Tóm gọn 1 câu:** `.render()` dựng sân khấu một lần — muốn đổi cảnh, đổi state chứ đừng sờ tay vào sân khấu.

---

## 3. `StrictMode` là gì? Vì sao render 2 lần ở dev mà prod thì không?

**Hỏi:** Bọc `<StrictMode>` thấy `console.log("render")` in 2 lần, có phải bug? Có nên bỏ nó đi?

**Đáp:**
- **Không phải bug, không nên bỏ.** `StrictMode` là component đặc biệt của React, **chỉ có tác dụng ở development**.
  Production build tự loại bỏ hành vi kiểm tra nên không ảnh hưởng hiệu năng.
- Ở dev nó cố tình **chạy 2 lần**: render function, effects (`useEffect` mount → cleanup → mount lại),
  để lộ side-effect "không sạch" (thiếu cleanup, fetch không abort,unsubscribe không hủy, mutation trong render).
- Nếu code bạn đúng (effect có cleanup, render thuần khiết), chạy 2 lần vẫn cho kết quả đúng.
  Nếu chạy 2 lần mà sinh bug (gọi API 2 lần, timer nhân đôi) thì đó chính là bug thật mà StrictMode giúp bạn thấy sớm.
- Quy tắc: **giữ `<StrictMode>` ở dev**, viết effect đúng chuẩn (setup ↔ cleanup đối xứng, xem DAY 15).

Ví von: StrictMode như **kiểm tra khử trùng trong bếp** — nhà hàng chạy thử "xào món hai lần" để phát hiện món nào không sạch (thiếu dọn nguyên liệu); bếp sạch thì xào bao nhiêu lần món vẫn giống nhau.

> 📄 **Code ví dụ:** [`examples/02-3-strictmode-la-gi-vi-sao-render-2.tsx`](examples/02-3-strictmode-la-gi-vi-sao-render-2.tsx)

> **Tóm gọn 1 câu:** Render 2 lần ở dev không phải bug mà là "kiểm tra khử trùng" của StrictMode — code sạch thì chạy mấy lần cũng giống nhau, đừng bỏ nó.

---

## 4. Component là gì? Vì sao phải viết hoa chữ cái đầu?

**Hỏi:** Component trong React 2026 là gì? Vì sao `App` viết hoa còn `app` thì không chạy?

**Đáp:**
- Component (chuẩn hiện tại) là **một function bình thường trả về JSX**. Không decorator, không class trong code mới.
- TypeScript type của props chính là "API contract": IDE gợi ý, compiler chặn sai kiểu ngay lúc viết.
- **JSX phân biệt bằng chữ cái đầu:** PascalCase (`<App />`, `<PostCard />`) = component do bạn định nghĩa;
  chữ thường (`<div>`, `<span>`, `<app>`) = thẻ HTML thật. Viết `<app />` sẽ bị hiểu là thẻ HTML lạ, không chạy code bạn muốn.
- Quy ước: mỗi file một component chính + component con nhỏ liên quan; tên file và tên function trùng nhau.

Ví von: viết hoa chữ cái đầu như **quy ước áo đồng phục** — ai mặc áo đồng phục (PascalCase) là nhân viên component của bạn, ai mặc thường (chữ thường) thì trình duyệt coi là khách vãng lai (thẻ HTML).

> 📄 **Code ví dụ:** [`examples/03-4-component-la-gi-vi-sao-phai-viet.tsx`](examples/03-4-component-la-gi-vi-sao-phai-viet.tsx)

> **Tóm gọn 1 câu:** Component là function trả về JSX — viết hoa chữ đầu để JSX phân biệt nó với thẻ HTML.

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

Ví von: JSX là **bản thiết kế bằng mô hình nhỏ**, không phải ngôi nhà thật — compiler dịch mô hình thành "đơn đặt hàng" (object JS), React đọc đơn đặt hàng rồi mới xây nhà (DOM).

> 📄 **Code ví dụ:** [`examples/04-5-jsx-la-gi-co-phai-html-trong.tsx`](examples/04-5-jsx-la-gi-co-phai-html-trong.tsx)

> **Tóm gọn 1 câu:** JSX nhìn như HTML nhưng thật ra là code TypeScript được dịch thành object mô tả UI — vì là code nên bạn dùng được trọn sức mạnh JS.

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

> **Cách đọc bảng này:** 3 lệnh là 3 thời điểm trong vòng đời dự án — `dev` khi đang code, `build` khi chuẩn bị xuất bản, `preview` để soát trước khi deploy; đọc từ trên xuống theo đúng thứ tự đó.

> **Tóm gọn 1 câu:** Vite là "nhà xưởng" còn React là "họa sĩ" — dev chạy esbuild tức thì, build chạy Rollup đóng gói; CRA đã nghỉ hưu.

---

## 7. HMR là gì? Khác gì reload trang?

**Hỏi:** Sửa `App.tsx` thấy trình duyệt tự cập nhật mà không mất state đang nhập — cơ chế nào?

**Đáp:**
- Đó là **HMR (Hot Module Replacement)** của Vite: khi bạn lưu file, Vite chỉ đẩy **module vừa đổi** xuống trình duyệt
  và React "vá nóng" component đó, **giữ nguyên state** (text đang gõ, counter đang đếm).
- Reload trang (F5) thì mất hết state vì tải lại toàn bộ app từ đầu.
- Lưu ý: HMR chỉ giữ state khi bạn sửa **thân component**; nếu sửa logic khởi tạo state hoặc đổi export,
  React có thể phải remount (reset state) — đó là hành vi đúng để tránh state cũ sai hình.

Ví von: HMR như **thay từng miếng gạch khi nhà đang có người ở** — khách không phải dọn ra (không mất state); còn reload trang là **phá cả nhà xây lại từ móc**.

> **Tóm gọn 1 câu:** HMR vá nóng từng module và giữ nguyên state của bạn — F5 là phá nhà xây lại, vì thế đừng tắt nó.

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

Hãy hình dung template như **bàn ăn chuẩn khi vào quán**: `index.html → main.tsx → App.tsx` là đường dẫn "món chính", còn lại là gia vị cấu hình.

- Quan trọng nhất để hiểu luồng chạy: `index.html` → `src/main.tsx` → `src/App.tsx`.
- Còn lại là cấu hình: `vite.config.ts` (trung tâm plugin/alias/proxy), `tsconfig.json` (chuẩn type),
  `package.json` (scripts + dependency).

> **Tóm gọn 1 câu:** Template `react-ts` chỉ có 3 file tạo luồng chạy chính (index.html → main.tsx → App.tsx), còn lại là cấu hình phục vụ chúng.

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

> **Tóm gọn 1 câu:** Entry point là cặp đôi nối tiếp `index.html` (chỗ neo DOM) → `main.tsx` (khởi động React) — thiếu chỗ neo là app crash ngay lúc mount.

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

Ví von: Angular với Zone.js như **người gác nhỏ tai everywhere** — nghe thấy động tĩnh gì cũng quét nhà; React như **chuông cửa có nút** — chỉ ai bấm chuông (gọi setter) thì chủ nhà mới ra mở.

> 📄 **Code ví dụ:** [`examples/05-10-hooks-react-tu-quan-ly-re-render.tsx`](examples/05-10-hooks-react-tu-quan-ly-re-render.tsx)

> **Tóm gọn 1 câu:** React không "nghe lén" như Zone.js — nó chỉ re-render khi có chuông (setter state/props/context) reo, nên hãy đổi state thay vì sờ DOM.

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

Ví von: Compiler như **trợ lý tự ghi chú giúp bạn** — trước đây bạn phải tự dán giấy nhớ "đừng tính lại chỗ này" (`memo`), nay trợ lý nhìn thấy chỗ nào lặp việc là tự dán hộ.

> **Tóm gọn 1 câu:** Compiler 1.0 tự memoize giúp bạn — đừng xóa hết `memo` ngay nhưng cũng đừng tự dán giấy nhớ trước khi đo được bottleneck thật.

---

## 12. `strict` + `noUncheckedIndexedAccess` trong `tsconfig` để làm gì?

**Hỏi:** Vì sao tutorial bắt bật `strict` và `noUncheckedIndexedAccess`? Chúng bắt lỗi gì?

**Đáp:**
- **`strict: true`** là "bật tất cả kiểm tra nghiêm": `strictNullChecks` (null/undefined phải xử lý tường minh),
  `noImplicitAny` (cấm `any` ngầm), kiểm tra `this`, return... → sai type lộ **lúc compile** thay vì crash lúc chạy.
  Props component nhờ đó thành contract thật: truyền thiếu/sai kiểu là báo đỏ ngay.
- **`noUncheckedIndexedAccess: true`** (không nằm trong `strict`, phải bật riêng): truy cập mảng/tuple bằng index
  sẽ có thêm `| undefined`. Vì `arr[i]` **có thể** out-of-bound mà TS mặc định vẫn tin là `T` → bug lọt lưới.

> 📄 **Code ví dụ:** [`examples/06-12-strict-nouncheckedindexedaccess-trong-tsconfig-e-lam-gi.ts`](examples/06-12-strict-nouncheckedindexedaccess-trong-tsconfig-e-lam-gi.ts)

- Cặp đôi này đặc biệt hữu ích cho CRUD/list rendering: `posts[i]`, `record[key]` đều buộc bạn xử lý case
  "không tồn tại" thay vì `.title` trên `undefined` rồi crash ở production.

Ví von: `strict` là **kiểm tra kỹ thuật hàng trước khi xuất xưởng**, còn `noUncheckedIndexedAccess` là quy định "mọi hộc tủ có thể trống" — mở hộc phải nhìn xem có đồ không, đừng chộp tay mà không.

> 📄 **Code ví dụ:** [`examples/06-12-strict-nouncheckedindexedaccess-trong-tsconfig-e-lam-gi.ts`](examples/06-12-strict-nouncheckedindexedaccess-trong-tsconfig-e-lam-gi.ts)

> **Tóm gọn 1 câu:** `strict` bắt mọi lỗi kiểu lúc compile, `noUncheckedIndexedAccess` bắt riêng lỗi "tủ trống" khi truy cập mảng — hai cái này chính là bảo hiểm cho production.

---

## Reference

- `README.md` + `example.tsx` trong cùng thư mục (DAY 0)
- https://react.dev/reference/react-dom/client/createRoot
- https://react.dev/reference/react/StrictMode
- https://react.dev/learn/start-a-new-react-project
- https://vite.dev/guide/ (đặc biệt mục HMR + `react-ts` template)
- https://react.dev/learn/react-compiler
- https://www.typescriptlang.org/tsconfig/#strict · https://www.typescriptlang.org/tsconfig/#noUncheckedIndexedAccess
