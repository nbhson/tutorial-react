# DAY 0: KHÁM PHÁ REACT + VITE

## Mục tiêu bài học
- Hiểu React 19.3 (2026) là gì: UI library + Vite build tool, functional component + hook là chuẩn duy nhất.
- Tạo project React + TypeScript bằng Vite (CRA đã deprecated), chạy dev server, hiểu cấu trúc thư mục và entry point.
- Nắm khác biệt tư duy lớn nhất với Angular: React chỉ lo phần *view*, các phần khác do bạn tự chọn từ ecosystem.

## Khái niệm cốt lõi (Core)

### 1. React là UI library, không phải framework full-stack
Angular đóng gói sẵn mọi thứ ngay trong framework: HTTP client (`HttpClient`), Router (`RouterModule`), Forms (`FormsModule`/`ReactiveFormsModule`), DI container (`@Injectable`, `NgModule`). Bạn cài `@angular/*` là có đủ.

React thì ngược lại: React core chỉ làm đúng một việc là **render giao diện theo state** (hàm `state => UI`). Mọi thứ khác bạn tự lắp ghép từ ecosystem:
- Điều hướng → React Router v7 (`react-router`).
- Lấy dữ liệu server → TanStack Query (`@tanstack/react-query`).
- Form phức tạp → React Hook Form + Zod.
- State toàn cục hay đổi → Zustand / Redux Toolkit.

```tsx
// Vì sao nói React "chỉ lo view"? Vì core chỉ có thế này:
// - useState: giữ state. Không có HttpClient, không có Router.
import { useState } from "react";

function Counter() {
  // Dữ liệu + UI gộp trong hàm — không có Service/Module bọc ngoài
  const [count, setCount] = useState(0); // mỗi lần setCount -> React vẽ lại <p>
  return <p onClick={() => setCount(count + 1)}>Count: {count}</p>;
}
```

Vì sao quan trọng? Vì khi bí ("làm sao gọi API?"), bạn không tìm trong React docs mà tìm thư viện chuyên trách. Ngược lại bạn được tự do: bundle chỉ chứa thứ bạn thật sự dùng, không bị khóa vào quyết định của framework. Nếu làm sai (nhét mọi thứ vào `useState` thay vì dùng thư viện), app phình, cache/loading tự viết dễ sai — đó là lý do tutorial này có bảng so sánh Angular ↔ React xuyên suốt để bạn luôn biết "mảnh ghép nào thay cho module nào của Angular".

### 2. Sự tự do là con dao hai lưỡi
Mặt lợi: bạn kiểm soát hoàn toàn stack. App landing page chỉ cần React + Vite, bundle vài chục KB. App admin cần thêm Router + Query + UI kit. Không ai ép bạn mang theo Forms engine khi chỉ hiển thị trang tĩnh.

Mặt hại: bạn phải tự hiểu từng mảnh ghép, tự quyết version, tự nối chúng lại (Provider nào bọc ngoài Provider nào ở `main.tsx`). Người từ Angular sang hay bị "sốc lựa chọn".

```tsx
// main.tsx minh họa việc "tự lắp ghép": thứ tự bọc Provider do BẠN quyết,
// không có NgModule nào tự sắp xếp giúp.
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router"; // mảnh router
import { QueryClientProvider } from "@tanstack/react-query"; // mảnh data
import App from "./App";

// Quy tắc: Provider nào bị phụ thuộc thì bọc NGOÀI (ví dụ Router ngoài để
// mọi trang đều đọc được URL; QueryClient ngoài để mọi trang dùng cache).
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </BrowserRouter>
  </StrictMode>
);
```

Nếu làm sai (bọc ngược, hoặc quên Provider), hook bên trong (`useParams`, `useQuery`) sẽ throw "No QueryClient set" / "useParams outside Router". Cách tránh: giữ `main.tsx` mỏng, chỉ mount + Provider, và đọc lỗi thiếu Provider như tín hiệu "đặt sai tầng".

### 3. Component = function trả về JSX
Không còn decorator `@Component({ selector, templateUrl })`, không còn class component trong code mới (class chỉ còn trong code legacy). Một component React 19 chỉ là hàm:

```tsx
// Component chuẩn 2026: function + TypeScript type cho props.
// Type Props chính là "API contract": IDE gợi ý, TS chặn sai kiểu lúc compile.
type HelloProps = { name: string; age?: number };

function Hello({ name, age = 0 }: HelloProps) {
  // Mọi logic là JS thuần trên đầu hàm; câu lệnh return duy nhất trả JSX.
  const nextAge = age + 1; // derived value — tính mỗi render, không cần state
  return <p>Xin chào {name}, năm sau {nextAge} tuổi.</p>;
}
```

Vì sao? Vì JSX biên dịch thành `jsx(type, props)` — tức gọi hàm tạo object mô tả UI. Function component khớp tự nhiên với mô hình này: gọi hàm → nhận object → React vẽ. Nếu bạn viết sai (đặt tên thường `hello` thay vì `Hello`), JSX hiểu thành thẻ HTML `<hello>` lạ, React không gọi hàm của bạn — UI trắng mà không báo lỗi rõ. Quy tắc: component luôn PascalCase, file một component chính.

### 4. Vite là build tool mặc định 2026
`npm create vite@latest my-app -- --template react-ts` sinh sẵn template `react-ts` gồm TypeScript, HMR qua esbuild (cực nhanh), build production qua Rollup (tối ưu chunk). CRA (Create React App) đã deprecated từ 2025: chậm (webpack bundle toàn bộ khi dev), khó nâng React 19.

```bash
# Vì sao 3 lệnh này là đủ để có app chạy?
npm create vite@latest my-app -- --template react-ts # sinh index.html, src/main.tsx, src/App.tsx, vite.config.ts
npm install  # cài react, react-dom, vite, typescript
npm run dev  # mở http://localhost:5173 — sửa file nào trình duyệt cập nhật file đó, giữ state
```

Nếu bạn vẫn `npx create-react-app`, bạn sẽ kẹt ở React 18, config webpack cồng kềnh, HMR chậm. Fix duy nhất: luôn dùng Vite cho mọi project mới.

### 5. Entry point chỉ có hai file quan trọng
- `index.html`: chứa `<div id="root"></div>` và `<script type="module" src="/src/main.tsx">`. Đây là file duy nhất Vite đọc làm gốc khi dev.
- `src/main.tsx`: tìm `#root` rồi `createRoot(...).render(<App/>)`. Mọi thứ khác là component lồng nhau.

```html
<!-- index.html — chỉ quan tâm 2 dòng này, còn lại là boilerplate Vite -->
<div id="root"></div>
<script type="module" src="/src/main.tsx"></script>
```

```tsx
// src/main.tsx — chỉ lo mount, không chứa UI nghiệp vụ
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App"; // import default — khớp export default ở App.tsx

createRoot(document.getElementById("root")!).render(
  <StrictMode><App /></StrictMode>
);
```

Vì sao chỉ hai file? Vì React không có khái niệm "root module" như Angular (`AppModule` + `bootstrapModule`). Cây component chính là module. Nếu `index.html` thiếu `#root`, `getElementById` trả `null` và `createRoot(null)` crash ngay — lỗi đầu tiên mọi người mới đều gặp một lần.

### 6. React 19.3 (2026): functional component + hooks là chuẩn duy nhất
Những điểm mới bạn sẽ dùng xuyên suốt tutorial:
- React Compiler 1.0 (bật mặc định ở nhiều setup Vite qua `babel-plugin-react-compiler`): tự memoize render, bạn không cần `memo`/`useMemo` vội (chi tiết DAY 10).
- Server Components ổn định (trong framework như Next.js, không cần cho SPA Vite này).
- `ref` là prop bình thường, không cần `forwardRef` (chi tiết DAY 4).
- `use()` + Actions dùng rộng rãi cho data/form (chi tiết DAY 12).

```tsx
// Trước React 19: muốn nhận ref phải bọc forwardRef — dài dòng.
import { forwardRef } from "react";
const OldInput = forwardRef<HTMLInputElement>((props, ref) => <input ref={ref} {...props} />);

// Sau React 19: ref là prop thường — viết như mọi prop khác.
function NewInput({ ref, ...rest }: { ref?: React.Ref<HTMLInputElement> } & React.InputHTMLAttributes<HTMLInputElement>) {
  return <input ref={ref} {...rest} />;
}
```

Nếu bạn copy code cũ có `forwardRef`, code vẫn chạy nhưng thừa. Hãy nhận `ref` trực tiếp trong code mới.

### 7. StrictMode là bạn, không phải kẻ thù
`<StrictMode>` chỉ tác dụng ở dev: React cố tình chạy render/effect hai lần (mount → unmount mô phỏng → mount lại) để lộ side-effect thiếu cleanup (timer không clear, subscription không unsubscribe — chi tiết DAY 15). Ở prod StrictMode không làm gì, không làm chậm.

```tsx
// Đừng làm thế này vì "thấy log 2 lần phiền":
createRoot(el).render(<App />); // bỏ StrictMode = che bug

// Hãy giữ thế này và sửa effect cho đúng:
createRoot(el).render(<StrictMode><App /></StrictMode>);
```

Nếu bạn bỏ StrictMode, bug rò rỉ bộ nhớ vẫn ở đó, chỉ là bạn không thấy ở dev — lên prod user gánh. Quy tắc: giữ StrictMode, viết effect có cleanup đối xứng.

### 8. Không có module hay provider toàn cục bắt buộc
Bạn tự quyết tầng cấu hình: cần Router/Query/i18n thì bọc Provider ở `main.tsx`; không cần thì `main.tsx` chỉ có StrictMode + App. Không có `NgModule`, không có `providedIn: "root"` bắt buộc.

```tsx
// App nhỏ không cần gì thêm — main.tsx mỏng nhất có thể:
createRoot(el).render(<StrictMode><App /></StrictMode>);

// App lớn — thêm Provider theo nhu cầu, thứ tự do bạn sắp:
createRoot(el).render(
  <StrictMode>
    <ThemeProvider>
      <RouterProvider router={router} />
    </ThemeProvider>
  </StrictMode>
);
```

Sai thì sao? Bọc Provider quá cao (ví dụ ThemeProvider bọc cả app trong khi chỉ 1 trang cần) thì mỗi lần theme đổi cả app re-render. Fix: đặt Provider sát nơi cần nhất (xem DAY 7).

### 9. Vite phục vụ ESM gốc khi dev
Webpack (CRA/Angular CLI cũ) bundle toàn bộ app rồi mới serve, app càng lớn khởi động càng chậm. Vite khi dev phục vụ từng module ES gốc qua `import` của trình duyệt, dùng esbuild biên dịch từng file siêu nhanh. Kết quả: khởi động gần như tức thì bất kể app lớn cỡ nào. Khi build (`npm run build`), Vite mới dùng Rollup bundle + minify + tách chunk vào `dist/`.

Vì sao bạn cần biết? Vì dev và prod khác nhau: dev nhanh nhưng không phản ánh kích thước bundle thật. Luôn chạy `npm run build && npm run preview` trước khi deploy để thấy chunk thật, phát hiện chunk phình.

### Keyword chính
`createRoot`, `render`, `StrictMode`, `component`, `JSX`, `Vite`, `HMR`, `react-ts`, `entry point`. Nắm 9 từ này là đủ đọc mọi file còn lại của tutorial.

## Luồng hoạt động (Flow)
1. `npm create vite@latest my-app -- --template react-ts` → Vite sinh cấu trúc: `index.html`, `src/main.tsx`, `src/App.tsx`, `vite.config.ts`, `tsconfig.json`, `package.json`. Vì sao là template `react-ts`? Vì nó bật TypeScript + JSX transform mới ngay từ đầu, bạn không phải cấu hình.
2. `npm install` cài dependency React 19, React DOM, Vite, TypeScript và các plugin. Nếu quên bước này sau khi clone, `npm run dev` báo `Cannot find module 'react'`.
3. `npm run dev` → Vite khởi động dev server (mặc định `http://localhost:5173`), đọc `index.html` làm gốc. Vite không bundle toàn bộ mà serve từng module ESM.
4. `index.html` chỉ chứa `<div id="root"></div>` và thẻ `<script type="module" src="/src/main.tsx">` — đây là **entry điểm** của toàn app. Thiếu `#root` là crash ngay.
5. Trình duyệt tải bundle `main.tsx`, chạy JS và gọi `createRoot(document.getElementById("root")!)`. Dấu `!` là cam kết `#root` tồn tại.
6. `.render(<StrictMode><App /></StrictMode>)` → React "mount" lần đầu: chạy function `App()`. Đây là lần duy nhất bạn gọi `render` thủ công.
7. `App()` trả JSX `<h1>Hello React 19 + Vite!</h1>` → React biên dịch thành element object → dựng DOM thật → chèn vào `#root`. JSX không phải HTML, nó là `jsx("h1", { children: ... })`.
8. StrictMode (dev) chạy lại chuỗi render thêm một lần nữa để kiểm tra tính "sạch" — không đổi kết quả, chỉ để lộ bug.
9. Khi state đổi (sau này), React tự re-render phần khác biệt — không cần gọi `render` lại. Gọi `createRoot` lần nữa sẽ warning "container has already been created".
10. Mỗi lần bạn sửa `App.tsx`, Vite HMR đẩy thay đổi xuống trình duyệt mà **không tải lại trang**, giữ nguyên state đang chạy. Khác F5 reload mất hết input đang gõ.
11. `npm run build` → Rollup đóng gói production vào `dist/`; `npm run preview` chạy thử bản build đó. Deploy thư mục `dist/`, không deploy `src/`.
12. Trong dev, React DevTools (extension trình duyệt) giúp bạn xem cây component, props và state của từng node. Đây là công cụ debug quan trọng nhất, nên cài từ ngày đầu.
13. `vite.config.ts` là nơi thêm plugin (React Compiler, Tailwind, alias `@/`) — cấu hình tập trung, không rải rác. Alias `@/` cấu hình thêm trong `tsconfig.json` để import gọn.

## Ví dụ chi tiết
Code dưới đây khớp 1-1 với `example.tsx` cùng thư mục (chỉ khác phần này hiển thị trong khối markdown để đọc liền mạch):

```tsx
// example.tsx — DAY 0: entry tối giản (chạy với Vite + React 19)
// Mục đích: minh họa 2 file quan trọng nhất (index.html + main.tsx) gộp lại 1 file
// để người mới thấy toàn bộ "đường đi" từ DOM tới React trong vài dòng.
import { StrictMode } from "react"; // (1) Import component kiểm tra dev — chỉ tác dụng ở dev, prod bỏ qua
import { createRoot } from "react-dom/client"; // (2) Import API mount React 18+ — thay ReactDOM.render cũ

// (3) App là function component: hàm thường, KHÔNG decorator, trả về JSX.
// Vì sao viết hoa? JSX phân biệt component (PascalCase) với thẻ HTML (chữ thường).
function App() {
  // (4) Dùng fragment <>...</> để trả 2 element mà không thêm <div> thừa.
  // Fragment tương đương ng-container của Angular.
  return (
    <>
      <h1>Hello React 19 + Vite!</h1>
      {/* (5) Dòng <p> chứng minh component trả nhiều node nhờ fragment */}
      <p>Edit src/App.tsx và xem HMR cập nhật không reload trang.</p>
    </>
  );
}

// (6) Tìm node DOM #root trong index.html — nơi React "neo" toàn bộ app.
// Dấu "!" là non-null assertion của TS: cam kết #root chắc chắn tồn tại.
createRoot(document.getElementById("root")!).render(
  // (7) StrictMode bọc ngoài: ở dev React render 2 lần để lộ effect thiếu cleanup.
  // Ở prod StrictMode không làm gì, không làm chậm app.
  <StrictMode>
    <App />
  </StrictMode>
);

export default App; // (8) Default export để main.tsx/App.tsx import gọn: import App from "./App"
```

Phiên bản "thực tế" tách file giống dự án Vite sinh ra (không gộp như `example.tsx`):

```tsx
// src/main.tsx — chỉ lo mount, không chứa UI nghiệp vụ
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App"; // import default — khớp export default ở App.tsx

createRoot(document.getElementById("root")!).render(
  <StrictMode><App /></StrictMode>
);
```

```tsx
// src/App.tsx — component gốc, chứa UI thật
export default function App() {
  // Fragment cho phép trả nhiều element mà không thêm node DOM thừa
  return (
    <>
      <h1>Hello React 19 + Vite!</h1>
      <p>Edit src/App.tsx và xem HMR cập nhật không reload trang.</p>
    </>
  );
}
```

## Giải thích từng phần
- Dòng `import { StrictMode } from "react"`: import component đặc biệt của React core. Vì sao từ `"react"` mà không phải `"react-dom"`? Vì StrictMode là logic render (thuộc React), không phải thao tác DOM (thuộc react-dom). Nó chỉ ảnh hưởng ở dev, prod bị bỏ qua hoàn toàn.
- Dòng `import { createRoot } from "react-dom/client"`: API mount chuẩn từ React 18+. Bản cũ React 17 dùng `ReactDOM.render(el, container)` — giờ đã bỏ. Nếu bạn copy code cũ, TS báo `ReactDOM.render is not a function`. Fix: dùng `createRoot` như ví dụ.
- Dòng `function App() { ... }`: khai báo function component. Vì sao không cần `extends Component`? Vì function + hooks đã đủ giữ state/effect. Class component chỉ còn để đọc code legacy.
- Khối `return ( <> ... </> )`: fragment nhóm 2 element (`<h1>` + `<p>`) mà không sinh thêm `<div>` trong DOM. Vì sao cần? Vì function chỉ được `return` một giá trị; fragment là "hộp vô hình" bọc nhiều con. Không dùng fragment mà trả 2 element cạnh nhau sẽ lỗi `Adjacent JSX elements must be wrapped`. Nếu dùng `<div>` bọc thay fragment, DOM thừa một tầng, CSS flex/grid có thể lệch.
- Dòng `<h1>Hello React 19 + Vite!</h1>`: JSX biên dịch thành `jsx("h1", { children: "Hello..." })` — object mô tả UI, chưa phải DOM thật. React dùng object này để dựng DOM.
- Dòng `<p>Edit src/App.tsx...</p>`: chứng minh fragment chứa nhiều node. Khi bạn sửa chữ này và lưu, Vite HMR đẩy đúng node `<p>` xuống trình duyệt, state các input khác giữ nguyên.
- Dòng `createRoot(document.getElementById("root")!)`: hai việc trong một dòng — (a) `getElementById("root")` tìm neo trong `index.html`, (b) `createRoot(...)` tạo root React gắn với neo đó. Dấu `!` là non-null assertion: bạn cam kết `#root` tồn tại. Nếu sai (index.html không có `#root`), runtime crash `Cannot read properties of null`. Fix dự phòng: `document.getElementById("root") ?? document.body`.
- Quy tắc "gọi `createRoot` một lần duy nhất": root là singleton của app. Gọi lần hai trên cùng container sẽ warning. Sau lần mount đầu, mọi cập nhật UI đi qua `setState`, không gọi `render` lại.
- Khối `.render(<StrictMode><App /></StrictMode>)`: render lần đầu cây component. `<StrictMode>` bọc ngoài để dev double-render. `<App />` là cách viết JSX cho "gọi hàm App() và lấy object UI".
- Dòng `export default App`: default export để file khác `import App from "./App"`. Khác với named export `export function App` phải `import { App }`. Nhầm hai kiểu là lỗi import phổ biến nhất ngày đầu: `import { App }` trong khi file export default sẽ nhận `undefined`.
- Vì sao `App` viết hoa? JSX phân biệt component (PascalCase) với thẻ HTML (chữ thường). Viết `<app />` sẽ bị hiểu thành thẻ HTML lạ `<app>`, React không gọi hàm của bạn, UI trắng.
- Đường dẫn alias `@/`: cấu hình trong `vite.config.ts` (`resolve.alias`) + `tsconfig.json` (`paths`) để `import App from "@/App"` thay vì `../../App`. Không bắt buộc ngày 0, nhưng nên đặt từ đầu để tránh `../../../` khi app lớn.
- `vite.config.ts` là trung tâm cấu hình: plugin React (`@vitejs/plugin-react`), React Compiler, Tailwind, proxy dev API, biến môi trường đều khai ở đây. Không rải config ra nhiều file như Angular CLI + environment files.
- Prod khác dev: dev phục vụ từng module ESM (nhanh, không bundle), prod bundle + minify + tách chunk + hash tên file. Nhớ test bằng `npm run preview` trước khi deploy để bắt lỗi chỉ lộ ở bản build (ví dụ biến `process.env` quên đổi sang `import.meta.env`).

## Bảng so sánh Angular ↔ React
| Angular | React | Ghi chú |
|---|---|---|
| `ng new` + `NgModule` + `bootstrapModule` | `npm create vite` + `createRoot().render()` | Vite không sinh `NgModule`; cây component chính là module |
| `main.ts` bootstrap module | `main.tsx` render component tree | React không có "root module", chỉ có root component |
| Decorator `@Component({template})` | Function trả về JSX | JSX là TS thuần, không tách template file bắt buộc |
| `app-root` selector trong `index.html` | `<div id="root">` trong `index.html` | Một chỗ neo duy nhất; React không dùng custom element selector |
| Angular CLI (ng serve/ng build) | Vite (npm run dev / build / preview) | Vite nhanh nhờ esbuild (dev) + Rollup (build) |
| Zone.js phát hiện thay đổi | Hooks + React tự quản lý re-render | Không cần zone; setState là đủ báo React vẽ lại |
| Bundler tích hợp trong CLI | esbuild + Rollup qua Vite | Cấu hình mỏng, mở rộng qua plugin |
| `environment.ts` config | biến môi trường `import.meta.env.VITE_*` | Chỉ tiền tố `VITE_` lộ ra client; secret không để đây |
| `NgModule` gom component/directive/pipe | import/export ES module thuần | Mỗi file tự mô tả phụ thuộc, không cần module wrapper |
| `APP_INITIALIZER` chạy trước bootstrap | code chạy trước `createRoot().render()` trong `main.tsx` | Cùng ý "chuẩn bị trước khi vẽ", khác cơ chế |

## Lỗi thường gặp (Common pitfalls)

### 1. `index.html` không có `#root` → crash lúc mount
Mô tả: `getElementById("root")` trả `null`, `createRoot(null)` ném lỗi, trang trắng.

```tsx
// ❌ SAI: index.html thiếu neo nhưng main.tsx vẫn ép non-null
// index.html: <body><script src="/src/main.tsx"></script></body> (không có div#root)
createRoot(document.getElementById("root")!).render(<App />); // crash: Target container is not a DOM element
```

```tsx
// ✅ ĐÚNG: kiểm tra index.html + code phòng thủ
// index.html: <div id="root"></div>
const el = document.getElementById("root") ?? document.body; // fallback nếu thiếu
createRoot(el).render(<StrictMode><App /></StrictMode>);
```
Bài học: `#root` là hợp đồng giữa `index.html` và `main.tsx`. Clone project lạ về, kiểm tra `index.html` đầu tiên.

### 2. Gọi `createRoot()` lại mỗi lần update
Mô tả: tưởng mỗi lần state đổi phải `render` lại như jQuery.

```tsx
// ❌ SAI: gọi render trong event — warning + mất state
function handleClick() {
  createRoot(document.getElementById("root")!).render(<App />); // warning: container has already been created
}
```

```tsx
// ✅ ĐÚNG: gọi 1 lần lúc khởi động, update đi qua state
// main.tsx: createRoot(...).render(<App />) — xong, không đụng nữa
function Counter() {
  const [n, setN] = useState(0); // setN là cách duy nhất yêu cầu vẽ lại
  return <button onClick={() => setN(n + 1)}>{n}</button>;
}
```
Bài học: `render` thủ công chỉ một lần. Mọi cập nhật sau đó là `setState` → React tự re-render.

### 3. Cài CRA theo thói quen cũ
Mô tả: `npx create-react-app` vẫn chạy nhưng template đã deprecated, kẹt React 18, build chậm.

```bash
# ❌ SAI: CRA — deprecated từ 2025, không nên dùng cho project mới
npx create-react-app my-app
```

```bash
# ✅ ĐÚNG: Vite — chuẩn 2026
npm create vite@latest my-app -- --template react-ts
cd my-app && npm install && npm run dev
```
Bài học: mọi tutorial mới, mọi job mới đều mặc định Vite. Đừng mang thói quen CRA sang.

### 4. Nhầm default export với named export
Mô tả: `import App from "./App"` nhận `undefined` vì file dùng named export, hoặc ngược lại.

```tsx
// ❌ SAI: file export default nhưng import kiểu named (hoặc ngược lại)
// App.tsx: export default function App() {...}
import { App } from "./App"; // undefined — crash "Element type is invalid"
```

```tsx
// ✅ ĐÚNG: thống nhất một kiểu — ưu tiên default cho component chính
// App.tsx: export default function App() {...}
import App from "./App"; // khớp default
```
Bài học: kiểm tra dòng `export` của file nguồn trước khi viết `import`. Thống nhất default cho component chính mỗi file.

### 5. Bỏ `<StrictMode>` vì "render 2 lần phiền"
Mô tả: thấy `console.log` in 2 lần ở dev nên gỡ StrictMode cho "sạch".

```tsx
// ❌ SAI: che bug — effect thiếu cleanup vẫn rò rỉ, chỉ là dev không báo nữa
createRoot(el).render(<App />);
```

```tsx
// ✅ ĐÚNG: giữ StrictMode, sửa effect cho đúng (xem DAY 15)
createRoot(el).render(
  <StrictMode><App /></StrictMode>
);
// useEffect(() => { const id = setInterval(...); return () => clearInterval(id); }, []);
```
Bài học: double-render ở dev là miễn phí, prod không ảnh hưởng. Nó là máy báo khói cho effect bẩn.

### 6. Đặt component ngoài `src/`
Mô tả: Vite chỉ theo dõi và bundle trong project root, mặc định template coi `src/` là mã nguồn. Đặt file lung tung dễ miss HMR/alias.

```tsx
// ❌ SAI: file ở ngoài src, import bằng đường dẫn lạ, HMR chập chờn
import App from "../somewhere/App";
```

```tsx
// ✅ ĐÚNG: mọi mã nguồn trong src/, import tương đối hoặc alias @/
// src/App.tsx
import App from "./App"; // hoặc "@/App" khi đã cấu hình alias
```
Bài học: giữ quy ước `src/` của template Vite để mọi tool (HMR, alias, test) hoạt động.

### 7. Quên `npm install` sau khi clone
Mô tả: `npm run dev` báo `Cannot find module 'react'`.

```bash
# ❌ SAI: clone về chạy ngay
git clone <repo> && npm run dev # lỗi thiếu module
```

```bash
# ✅ ĐÚNG: cài trước khi chạy
git clone <repo> && npm install && npm run dev
```
Bài học: `node_modules` không nằm trong git. Luôn `install` sau clone/pull thêm dep mới.

### 8. Deploy thẳng thư mục `src`
Mô tả: upload `src/` lên hosting tĩnh, trình duyệt không hiểu TSX.

```bash
# ❌ SAI: deploy src — trình duyệt không chạy được .tsx
# upload src/App.tsx lên hosting tĩnh -> 404 / MIME error
```

```bash
# ✅ ĐÚNG: build rồi deploy dist/
npm run build   # sinh dist/ đã bundle + minify + hash
npm run preview # chạy thử bản build y như prod trước khi upload dist/
```
Bài học: `src/` là mã nguồn, `dist/` là sản phẩm. Hosting tĩnh chỉ nhận `dist/`.

### 9. Dùng `process.env` trong Vite
Mô tả: copy code Node/CRA sang Vite, `process is not defined` ở browser.

```tsx
// ❌ SAI: process không tồn tại ở browser Vite
const api = process.env.API_URL; // ReferenceError: process is not defined
```

```tsx
// ✅ ĐÚNG: dùng import.meta.env với tiền tố VITE_
// .env: VITE_API_URL=https://api.example.com
const api = import.meta.env.VITE_API_URL; // Vite thay thế lúc build
```
Bài học: biến nào lộ ra client phải bắt đầu `VITE_`. Secret (private key) không bao giờ để vào đây vì bundle lộ hết.

## Best practices / Mẹo
- Bật **React Compiler 1.0** ngay từ đầu (`babel-plugin-react-compiler`) — React tự memoize, bạn không cần `memo`/`useMemo` vội (chi tiết DAY 10). Vì sao? Vì memo thủ công sai dễ làm chậm hơn (so props tốn CPU), Compiler đo và tối ưu đúng chỗ.
- Đặt component theo PascalCase; mỗi file một component chính + component con nhỏ liên quan. Vì sao? Để DevTools hiển thị tên đẹp, import/export nhất quán, file dưới ~80-150 dòng dễ đọc.
- Giữ `main.tsx` mỏng: chỉ mount + StrictMode + Provider/Router ở tầng ngoài cùng. Vì sao? Để ai mở `main.tsx` cũng thấy toàn bộ "khung" app trong 20 dòng, logic nghiệp vụ nằm ở `App` và các trang.
- Chạy `npm run build && npm run preview` để xem bundle production thật trước khi deploy. Vì sao? Vì dev không phản ánh kích thước chunk, lỗi env, hay lỗi chỉ lộ khi minify.
- Bật `strict` + `noUncheckedIndexedAccess` trong `tsconfig` để bắt lỗi sớm. Vì sao? Vì `arr[i]` có thể `undefined`, TS strict ép bạn xử lý, tránh crash runtime.
- Đặt `VITE_` tiền tố cho biến môi trường lộ ra client; đừng để secret lọt vào bundle. Vì sao? Vì mọi chuỗi `import.meta.env.VITE_*` đều nằm plaintext trong JS gửi xuống browser.
- Dùng alias `@/` cho import gọn, tránh `../../..`. Vì sao? Vì refactor di chuyển file không phải sửa hàng loạt đường dẫn tương đối.
- Cài **ESLint flat config + eslint-plugin-react-hooks** ngay từ đầu: bắt lỗi deps và rules-of-hooks sớm. Vì sao? Vì 80% bug effect đến từ deps thiếu/thừa, lint chặn ngay lúc gõ.
- Cài **React DevTools** — công cụ debug quan trọng nhất, xem props/state/hooks live. Vì sao? Vì đọc code đoán state khó hơn nhìn state thật đang chạy.

## Bài tập nhỏ
1. Tạo project `my-first-app` với Vite react-ts, sửa `App` hiển thị tên bạn + nút bấm hiện alert. Chạy `npm run dev` và kiểm tra HMR: gõ tên vào input rồi sửa chữ tiêu đề — input có giữ nguyên không? Vì sao HMR giữ được state?
2. Tạm bỏ `<StrictMode>` và thêm `console.log("render")` trong `App` — bấm nút để so sánh số lần log có/không StrictMode. Giải thích vì sao dev log 2 lần nhưng prod chỉ 1 lần.
3. Chạy `npm run build`, mở thư mục `dist/` xem file; đổi một chữ trong `App.tsx` rồi build lại để so sánh hash tên file chunk. Vì sao hash đổi giúp cache trình duyệt hoạt động đúng?

## Reference
- https://react.dev/learn/start-a-new-react-project
- https://vite.dev/guide/
- https://react.dev/reference/react-dom/client/createRoot
- https://react.dev/reference/react/StrictMode
