# DAY 0: KHÁM PHÁ REACT + VITE

## Mục tiêu bài học
- Hiểu React 19.3 (2026) là gì: UI library + Vite build tool, functional component + hook là chuẩn duy nhất.
- Tạo project React + TypeScript bằng Vite (CRA đã deprecated), chạy dev server, hiểu cấu trúc thư mục và entry point.
- Nắm khác biệt tư duy lớn nhất với Angular: React chỉ lo phần *view*, các phần khác do bạn tự chọn từ ecosystem.

## Khái niệm cốt lõi (Core)
- **React là UI library, không phải framework full-stack.** Angular đóng gói sẵn HTTP client, Router, Forms, DI ngay trong framework. React chỉ render giao diện; mọi thứ khác là các thư viện riêng (React Router, TanStack Query, React Hook Form...) bạn lắp ghép.
- **Sự tự do này là con dao hai lưỡi.** Bạn kiểm soát hoàn toàn stack (bundle nhỏ, không bị khóa vào quyết định framework), nhưng phải tự hiểu từng mảnh ghép. Đó là lý do tutorial này đi kèm bảng so sánh Angular ↔ React xuyên suốt.
- **Component = function trả về JSX.** Không có decorator `@Component`, không còn class component trong code mới. TypeScript type của props chính là "API contract" của component — vừa giúp IDE gợi ý, vừa chặn lỗi truyền sai kiểu ngay lúc compile.
- **Vite là build tool mặc định 2026.** `npm create vite` sinh sẵn template `react-ts` với TypeScript, HMR (Hot Module Replacement) cực nhanh nhờ esbuild, build production tối ưu qua Rollup. CRA (Create React App) đã chính thức deprecated và không nên dùng.
- **Entry point chỉ có hai file quan trọng:** `index.html` (chứa `<div id="root">`) và `src/main.tsx` (mount React). Mọi thứ khác là component lồng nhau.
- **React 19.3 (2026):** functional component + hooks là chuẩn duy nhất; React Compiler (bản 1.0, bật mặc định ở nhiều setup Vite) tự memoize render; Server Components ổn định; `ref` là prop bình thường không cần `forwardRef`; `use()` + Actions dùng rộng rãi.
- **StrictMode là bạn, không phải kẻ thù.** Nó chạy render/effect 2 lần ở dev để lộ side-effect thiếu cleanup (DAY 15). Prod không bị ảnh hưởng.
- **Không có "module" hay "provider" toàn cục bắt buộc.** Bạn tự quyết định tầng cấu hình: bọc Provider/Router ở `main.tsx` nếu cần, còn lại mọi thứ là component.
- **Vite phục vụ ESM gốc khi dev** (không bundle toàn bộ như webpack), nên khởi động gần như tức thì bất kể app lớn cỡ nào.
- **Keyword chính:** `createRoot`, `render`, `StrictMode`, `component`, `JSX`, `Vite`, `HMR`, `react-ts`, `entry point`.

## Luồng hoạt động (Flow)
1. `npm create vite@latest my-app -- --template react-ts` → Vite sinh cấu trúc: `index.html`, `src/main.tsx`, `src/App.tsx`, `vite.config.ts`, `tsconfig.json`, `package.json`.
2. `npm install` cài dependency React 19, React DOM, Vite, TypeScript và các plugin.
3. `npm run dev` → Vite khởi động dev server (mặc định `http://localhost:5173`), đọc `index.html` làm gốc.
4. `index.html` chỉ chứa `<div id="root"></div>` và thẻ `<script type="module" src="/src/main.tsx">` — đây là **entry điểm** của toàn app.
5. Trình duyệt tải bundle `main.tsx`, chạy JS và gọi `createRoot(document.getElementById("root")!)`.
6. `.render(<StrictMode><App /></StrictMode>)` → React "mount" lần đầu: chạy function `App()`.
7. `App()` trả JSX `<h1>Hello React 19 + Vite!</h1>` → React biên dịch thành element object → dựng DOM thật → chèn vào `#root`.
8. StrictMode (dev) chạy lại chuỗi render thêm một lần nữa để kiểm tra tính "sạch" — không đổi kết quả.
9. Khi state đổi (sau này), React tự re-render phần khác biệt — không cần gọi `render` lại.
10. Mỗi lần bạn sửa `App.tsx`, Vite HMR đẩy thay đổi xuống trình duyệt mà **không tải lại trang**, giữ nguyên state đang chạy.
11. `npm run build` → Rollup đóng gói production vào `dist/`; `npm run preview` chạy thử bản build đó.
12. Trong dev, React DevTools (extension trình duyệt) giúp bạn xem cây component, props và state của từng node.
13. `vite.config.ts` là nơi thêm plugin (React Compiler, Tailwind, alias `@/`) — cấu hình tập trung, không rải rác.

## Ví dụ chi tiết
```tsx
// example.tsx — DAY 0: entry tối giản (chạy với Vite + React 19)
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

// App là một component: function bình thường, trả về JSX
function App() {
  return <h1>Hello React 19 + Vite!</h1>;
}

// Tìm node DOM #root — "!" khẳng định chắc chắn tồn tại (non-null assertion)
createRoot(document.getElementById("root")!).render(
  // StrictMode: bật chế độ kiểm tra của React ở dev
  <StrictMode>
    <App />
  </StrictMode>
);

export default App;
```

Phiên bản "thực tế" tách file giống dự án Vite sinh ra (không gộp như `example.tsx`):

```tsx
// src/main.tsx — chỉ lo mount
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App"; // import default

createRoot(document.getElementById("root")!).render(
  <StrictMode><App /></StrictMode>
);
```

```tsx
// src/App.tsx — component gốc
export default function App() {
  return <h1>Hello React 19 + Vite!</h1>;
}
```

## Giải thích từng phần
- `import { StrictMode } from "react"`: import component đặc biệt chỉ ảnh hưởng ở dev.
- `import { createRoot } from "react-dom/client"`: API mới (React 18+) để mount React vào DOM. Thay cho `ReactDOM.render` của React 17.
- `createRoot(el)`: tạo một "root" React gắn với node DOM `#root`. Gọi **một lần duy nhất** lúc khởi động app.
- `.render(<App />)`: render component tree lần đầu. Sau này mỗi khi state đổi, React tự re-render, **không cần gọi lại** `render`.
- `<StrictMode>`: chỉ tác dụng ở dev — bắt React chạy 2 lần render/effect để lộ side-effect không sạch (thiếu cleanup). **Prod không ảnh hưởng** và không làm chậm.
- `document.getElementById("root")!`: `!` là non-null assertion của TS — bạn đảm bảo `#root` đã có sẵn trong `index.html`. Nếu thiếu, dùng optional chaining hoặc tạo node mới.
- `export default App`: `main.tsx` và các file khác import `App` theo default export.
- **Vì sao `App` viết hoa?** JSX phân biệt component (PascalCase) với thẻ HTML (chữ thường). Viết `app` sẽ bị hiểu thành thẻ HTML lạ.
- `<>...</>` (fragment): nhóm nhiều element mà không thêm node DOM thừa — tương đương `ng-container` của Angular (DAY 2, DAY 5).
- **HMR giữ state:** sửa component không làm mất dữ liệu đang nhập — lợi thế lớn so với reload toàn trang.
- **Vite không cần `NgModule`:** mỗi file tự đóng gói; import/export TS đã đủ mô tả phụ thuộc.
- **Đường dẫn alias `@/`:** cấu hình trong `vite.config.ts` + `tsconfig.json` để import gọn và nhất quán.
- **`vite.config.ts` là trung tâm cấu hình:** plugin React, alias, proxy dev API, biến môi trường đều khai ở đây.
- **Prod khác dev:** dev phục vụ từng module ESM, prod bundle + minify + tách chunk; nhớ test bằng `preview` trước khi deploy.
- **Không có bootstrap tuần tự như Angular:** thứ tự "chạy" do bạn sắp khi import; bọc các Provider theo thứ tự dependency ở `main.tsx`.

## Bảng so sánh Angular ↔ React
| Angular | React | Ghi chú |
|---|---|---|
| `ng new` + `NgModule` + `bootstrapModule` | `npm create vite` + `createRoot().render()` | Vite không sinh `NgModule` |
| `main.ts` bootstrap module | `main.tsx` render component tree | React không có "root module" |
| Decorator `@Component({template})` | Function trả về JSX | JSX là TS thuần, không tách template |
| `app-root` selector trong `index.html` | `<div id="root">` trong `index.html` | Một chỗ neo duy nhất |
| Angular CLI (ng serve/ng build) | Vite (npm run dev / build / preview) | Vite nhanh nhờ esbuild + Rollup |
| Zone.js phát hiện thay đổi | Hooks + React tự quản lý re-render | Không cần zone |
| Bundler tích hợp trong CLI | esbuild + Rollup qua Vite | Cấu hình mỏng, mở rộng qua plugin |
| `environment.ts` config | biến môi trường `import.meta.env.VITE_*` | Chỉ tiền tố `VITE_` lộ ra client |

## Lỗi thường gặp (Common pitfalls)
- **`index.html` không có `#root`** → `getElementById` trả `null`, chạy thì crash. → Fix: kiểm tra `index.html`, hoặc dùng `document.getElementById("root") ?? document.body`.
- **Gọi `createRoot()` lại mỗi lần update** → warning "container has already been created". → Fix: gọi 1 lần, để state lo phần cập nhật.
- **Cài CRA theo thói quen cũ** → CRA deprecated từ 2025. → Fix: luôn dùng `npm create vite@latest`.
- **Nhầm default export với named export** → `import App from "./App"` (default) khác `import { App }`. → Fix: thống nhất một kiểu, ưu tiên default cho component chính.
- **Bỏ `<StrictMode>` vì "render 2 lần phiền"** → che bug thật (effect thiếu cleanup). → Fix: giữ StrictMode ở dev, viết effect đúng (DAY 15).
- **Đặt component ngoài `src/`** → Vite không theo dõi/không build. → Fix: đặt trong `src/`, import tương đối hoặc qua alias `@/`.
- **Quên `npm install` sau khi clone** → `npm run dev` báo thiếu module. → Fix: chạy `npm install` trước.
- **Deploy thẳng thư mục `src`** → sai. → Fix: chạy `npm run build` rồi deploy `dist/`.
- **Import React không cần thiết** (`import React from "react"`) ở JSX mới → không lỗi nhưng thừa. → Fix: chỉ import hook/API thật dùng (`useState`, `StrictMode`...).
- **Dùng `process.env` trong Vite** → `process` không tồn tại ở browser. → Fix: dùng `import.meta.env.VITE_*`.

## Best practices / Mẹo
- Bật **React Compiler 1.0** ngay từ đầu (`babel-plugin-react-compiler`) — React tự memoize, bạn không cần `memo`/`useMemo` vội (DAY 10).
- Đặt component theo PascalCase; mỗi file một component chính + component con nhỏ liên quan.
- Giữ `main.tsx` mỏng: chỉ mount + StrictMode + Provider/Router ở tầng ngoài cùng.
- Chạy `npm run build && npm run preview` để xem bundle production thật trước khi deploy.
- Bật `strict` + `noUncheckedIndexedAccess` trong `tsconfig` để bắt lỗi sớm.
- Đặt `VITE_` tiền tố cho biến môi trường lộ ra client; đừng để secret lọt vào bundle.
- Dùng alias `@/` cho import gọn, tránh `../../..`.
- Cài **ESLint flat config + eslint-plugin-react-hooks** ngay từ đầu: bắt lỗi deps và rules-of-hooks sớm.
- Cài **React DevTools** — công cụ debug quan trọng nhất, xem props/state/hooks live.

## Bài tập nhỏ
1. Tạo project `my-first-app` với Vite react-ts, sửa `App` hiển thị tên bạn + nút bấm hiện alert. Chạy `npm run dev` và kiểm tra HMR.
2. Tạm bỏ `<StrictMode>` và thêm `console.log("render")` trong `App` — bấm nút để so sánh số lần log có/không StrictMode.
3. Chạy `npm run build`, mở thư mục `dist/` xem file; đổi một chữ trong `App.tsx` rồi build lại để so sánh hash tên file chunk.

## Reference
- https://react.dev/learn/start-a-new-react-project
- https://vite.dev/guide/
- https://react.dev/reference/react-dom/client/createRoot
- https://react.dev/reference/react/StrictMode