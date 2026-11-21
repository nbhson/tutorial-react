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

> 📄 **Code ví dụ:** [`examples/01-1-react-la-ui-library-khong-phai-framework.tsx`](examples/01-1-react-la-ui-library-khong-phai-framework.tsx)

Vì sao quan trọng? Vì khi bí ("làm sao gọi API?"), bạn không tìm trong React docs mà tìm thư viện chuyên trách. Cứ nghĩ Angular là "cửa hàng tổng hợp" — vào là đủ đồ. React là "cửa hàng chuyên bán một món" — đồ khác bạn tự ghé tiệm khác. Làm sai (nhét mọi thứ vào `useState`) thì app phình, cache/loading tự viết dễ sai. Bảng so sánh Angular ↔ React cuối bài giúp bạn luôn biết "mảnh ghép nào thay cho module nào".

> **Tóm gọn 1 câu:** React chỉ vẽ giao diện theo state; mọi mảnh còn lại (router, API, form) bạn tự chọn từ ecosystem.

### 2. Sự tự do là con dao hai lưỡi
Mặt lợi: bạn kiểm soát hoàn toàn stack. App landing page chỉ cần React + Vite, bundle vài chục KB. App admin cần thêm Router + Query + UI kit. Không ai ép bạn mang theo Forms engine khi chỉ hiển thị trang tĩnh.

Mặt hại: bạn phải tự hiểu từng mảnh ghép, tự quyết version, tự nối chúng lại (Provider nào bọc ngoài Provider nào ở `main.tsx`). Người từ Angular sang hay bị "sốc lựa chọn".

> 📄 **Code ví dụ:** [`examples/02-2-su-tu-do-la-con-dao-hai.tsx`](examples/02-2-su-tu-do-la-con-dao-hai.tsx)

Nếu làm sai (bọc ngược, hoặc quên Provider), hook bên trong (`useParams`, `useQuery`) sẽ throw "No QueryClient set" / "useParams outside Router". Giữ `main.tsx` mỏng, chỉ mount + Provider. Đọc lỗi thiếu Provider như tín hiệu "đặt sai tầng".

> **Tóm gọn 1 câu:** Tự do chọn mảnh ghép là lợi thế của React, nhưng giá phải trả là bạn phải tự hiểu và tự nối từng mảnh.

### 3. Component = function trả về JSX
Không còn decorator `@Component({ selector, templateUrl })`, không còn class component trong code mới (class chỉ còn trong code legacy). Một component React 19 chỉ là hàm:

> 📄 **Code ví dụ:** [`examples/03-3-component-function-tra-ve-jsx.tsx`](examples/03-3-component-function-tra-ve-jsx.tsx)

Vì sao? Vì JSX biên dịch thành `jsx(type, props)` — tức gọi hàm tạo object mô tả UI. Function component khớp tự nhiên với mô hình này: gọi hàm → nhận object → React vẽ. JSX chỉ là "bản thiết kế giấy", chưa phải ngôi nhà (DOM thật). Nếu bạn viết sai (đặt tên thường `hello` thay vì `Hello`), JSX hiểu thành thẻ HTML `<hello>` lạ, React không gọi hàm của bạn — UI trắng mà không báo lỗi rõ. Quy tắc: component luôn PascalCase, file một component chính.

> **Tóm gọn 1 câu:** Component React là hàm trả về "bản thiết kế" JSX — tên luôn viết hoa để React biết mà gọi.

### 4. Vite là build tool mặc định 2026
`npm create vite@latest my-app -- --template react-ts` sinh sẵn template `react-ts` gồm TypeScript, HMR qua esbuild (cực nhanh), build production qua Rollup (tối ưu chunk). CRA (Create React App) đã deprecated từ 2025: chậm (webpack bundle toàn bộ khi dev), khó nâng React 19.

> 📄 **Code ví dụ:** [`examples/04-4-vite-la-build-tool-mac-inh-2026.sh`](examples/04-4-vite-la-build-tool-mac-inh-2026.sh)

Nếu bạn vẫn `npx create-react-app`, bạn sẽ kẹt ở React 18, config webpack cồng kềnh, HMR chậm. Fix duy nhất: luôn dùng Vite cho mọi project mới.

> **Tóm gọn 1 câu:** Vite là chuẩn 2026 cho mọi project React mới — CRA đã "nghỉ hưu", đừng mang nó về.

### 5. Entry point chỉ có hai file quan trọng
- `index.html`: chứa `<div id="root"></div>` và `<script type="module" src="/src/main.tsx">`. Đây là file duy nhất Vite đọc làm gốc khi dev.
- `src/main.tsx`: tìm `#root` rồi `createRoot(...).render(<App/>)`. Mọi thứ khác là component lồng nhau.

> 📄 **Code ví dụ:** [`examples/05-5-entry-point-chi-co-hai-file-quan.html`](examples/05-5-entry-point-chi-co-hai-file-quan.html)

> 📄 **Code ví dụ:** [`examples/06-5-entry-point-chi-co-hai-file-quan.tsx`](examples/06-5-entry-point-chi-co-hai-file-quan.tsx)

Vì sao chỉ hai file? Vì React không có khái niệm "root module" như Angular (`AppModule` + `bootstrapModule`). Cây component chính là module. Hai file này là "mỏ neo" của app. Nếu `index.html` thiếu `#root`, `getElementById` trả `null` và `createRoot(null)` crash ngay — lỗi đầu tiên mọi người mới đều gặp một lần.

> **Tóm gọn 1 câu:** Cả app neo vào 2 file: `index.html` giữ chỗ `#root`, `main.tsx` gắn React vào chỗ đó.

### 6. React 19.3 (2026): functional component + hooks là chuẩn duy nhất
Những điểm mới bạn sẽ dùng xuyên suốt tutorial:
- React Compiler 1.0 (bật mặc định ở nhiều setup Vite qua `babel-plugin-react-compiler`): tự memoize render, bạn không cần `memo`/`useMemo` vội (chi tiết DAY 10).
- Server Components ổn định (trong framework như Next.js, không cần cho SPA Vite này).
- `ref` là prop bình thường, không cần `forwardRef` (chi tiết DAY 4).
- `use()` + Actions dùng rộng rãi cho data/form (chi tiết DAY 12).

> 📄 **Code ví dụ:** [`examples/07-6-react-19-3-2026-functional-component-hooks.tsx`](examples/07-6-react-19-3-2026-functional-component-hooks.tsx)

Nếu bạn copy code cũ có `forwardRef`, code vẫn chạy nhưng thừa. Hãy nhận `ref` trực tiếp trong code mới.

> **Tóm gọn 1 câu:** React 19: function component + hooks là đường duy nhất — code class và forwardRef chỉ còn để đọc lại.

### 7. StrictMode là bạn, không phải kẻ thù
`<StrictMode>` chỉ tác dụng ở dev: React cố tình chạy render/effect hai lần (mount → unmount mô phỏng → mount lại) để lộ side-effect thiếu cleanup (timer không clear, subscription không unsubscribe — chi tiết DAY 15). Ở prod StrictMode không làm gì, không làm chậm.

Nó như "kiểm tra sức khỏe định kỳ": làm bạn thấy mệt một chút ở dev, nhưng bắt được bệnh trước khi lên prod.

> 📄 **Code ví dụ:** [`examples/08-7-strictmode-la-ban-khong-phai-ke-thu.tsx`](examples/08-7-strictmode-la-ban-khong-phai-ke-thu.tsx)

Nếu bạn bỏ StrictMode, bug rò rỉ bộ nhớ vẫn ở đó, chỉ là bạn không thấy ở dev — lên prod user gánh. Quy tắc: giữ StrictMode, viết effect có cleanup đối xứng.

> **Tóm gọn 1 câu:** StrictMode cố tình chạy 2 lần ở dev để bắt bug dọn dẹp — đừng tắt, chỉ cần viết effect sạch.

### 8. Không có module hay provider toàn cục bắt buộc
Bạn tự quyết tầng cấu hình: cần Router/Query/i18n thì bọc Provider ở `main.tsx`; không cần thì `main.tsx` chỉ có StrictMode + App. Không có `NgModule`, không có `providedIn: "root"` bắt buộc.

> 📄 **Code ví dụ:** [`examples/09-8-khong-co-module-hay-provider-toan-cuc.tsx`](examples/09-8-khong-co-module-hay-provider-toan-cuc.tsx)

Sai thì sao? Bọc Provider quá cao (ví dụ ThemeProvider bọc cả app trong khi chỉ 1 trang cần) thì mỗi lần theme đổi cả app re-render. Fix: đặt Provider sát nơi cần nhất (xem DAY 7).

> **Tóm gọn 1 câu:** React không ép bạn dùng NgModule/Provider toàn cục — bạn tự bọc Provider đúng tầng, sát nơi cần.

### 9. Vite phục vụ ESM gốc khi dev
Webpack (CRA/Angular CLI cũ) bundle toàn bộ app rồi mới serve, app càng lớn khởi động càng chậm. Vite khi dev phục vụ từng module ES gốc qua `import` của trình duyệt, dùng esbuild biên dịch từng file siêu nhanh. Kết quả: khởi động gần như tức thì bất kể app lớn cỡ nào. Khi build (`npm run build`), Vite mới dùng Rollup bundle + minify + tách chunk vào `dist/`.

Vì sao bạn cần biết? Vì dev và prod khác nhau: dev nhanh nhưng không phản ánh kích thước bundle thật. Luôn chạy `npm run build && npm run preview` trước khi deploy để thấy chunk thật, phát hiện chunk phình.

> **Tóm gọn 1 câu:** Dev Vite "phục vụ món theo order" nên nhanh tức thì; prod mới gói hộp lớn — luôn preview trước khi deploy.

### Keyword chính
`createRoot`, `render`, `StrictMode`, `component`, `JSX`, `Vite`, `HMR`, `react-ts`, `entry point`. Nắm 9 từ này là đủ đọc mọi file còn lại của tutorial.

> **Tóm gọn 1 câu:** 9 từ khóa này là "từ vựng tối thiểu" của toàn tutorial — thuộc trước, đọc sau.

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

> **Tóm gọn 1 câu:** Flow này là "vòng đời từ tạ tới app": tạo project → install → dev server → mount → HMR → build → deploy `dist/`.

## Ví dụ chi tiết
Code dưới đây khớp 1-1 với `example.tsx` cùng thư mục (chỉ khác phần này hiển thị trong khối markdown để đọc liền mạch):

> 📄 **Code ví dụ:** [`examples/10-vi-du-chi-tiet.tsx`](examples/10-vi-du-chi-tiet.tsx)

Phiên bản "thực tế" tách file giống dự án Vite sinh ra (không gộp như `example.tsx`):

> 📄 **Code ví dụ:** [`examples/11-vi-du-chi-tiet.tsx`](examples/11-vi-du-chi-tiet.tsx)

> 📄 **Code ví dụ:** [`examples/12-vi-du-chi-tiet.tsx`](examples/12-vi-du-chi-tiet.tsx)

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

> **Tóm gọn 1 câu:** Mỗi dòng code trong ví dụ có một "vì sao" riêng — hiểu 3 điểm chính: fragment, PascalCase, và gọi `createRoot` đúng một lần.

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

> **Cách đọc bảng này:** Mỗi dòng ghép một khái niệm Angular (trái) với "tên mới" của nó trong React (giữa) — đọc cột ghi chú để biết khác biệt tinh tế.

## Lỗi thường gặp (Common pitfalls)

### 1. `index.html` không có `#root` → crash lúc mount
Mô tả: `getElementById("root")` trả `null`, `createRoot(null)` ném lỗi, trang trắng.

> 📄 **Code ví dụ:** [`examples/13-1-index-html-khong-co-root-crash-luc.tsx`](examples/13-1-index-html-khong-co-root-crash-luc.tsx)

> 📄 **Code ví dụ:** [`examples/14-1-index-html-khong-co-root-crash-luc.tsx`](examples/14-1-index-html-khong-co-root-crash-luc.tsx)
Bài học: `#root` là hợp đồng giữa `index.html` và `main.tsx`. Clone project lạ về, kiểm tra `index.html` đầu tiên.

### 2. Gọi `createRoot()` lại mỗi lần update
Mô tả: tưởng mỗi lần state đổi phải `render` lại như jQuery.

> 📄 **Code ví dụ:** [`examples/15-2-goi-createroot-lai-moi-lan-update.tsx`](examples/15-2-goi-createroot-lai-moi-lan-update.tsx)

> 📄 **Code ví dụ:** [`examples/16-2-goi-createroot-lai-moi-lan-update.tsx`](examples/16-2-goi-createroot-lai-moi-lan-update.tsx)
Bài học: `render` thủ công chỉ một lần. Mọi cập nhật sau đó là `setState` → React tự re-render.

### 3. Cài CRA theo thói quen cũ
Mô tả: `npx create-react-app` vẫn chạy nhưng template đã deprecated, kẹt React 18, build chậm.

> 📄 **Code ví dụ:** [`examples/17-3-cai-cra-theo-thoi-quen-cu.sh`](examples/17-3-cai-cra-theo-thoi-quen-cu.sh)

> 📄 **Code ví dụ:** [`examples/18-3-cai-cra-theo-thoi-quen-cu.sh`](examples/18-3-cai-cra-theo-thoi-quen-cu.sh)
Bài học: mọi tutorial mới, mọi job mới đều mặc định Vite. Đừng mang thói quen CRA sang.

### 4. Nhầm default export với named export
Mô tả: `import App from "./App"` nhận `undefined` vì file dùng named export, hoặc ngược lại.

> 📄 **Code ví dụ:** [`examples/19-4-nham-default-export-voi-named-export.tsx`](examples/19-4-nham-default-export-voi-named-export.tsx)

> 📄 **Code ví dụ:** [`examples/20-4-nham-default-export-voi-named-export.tsx`](examples/20-4-nham-default-export-voi-named-export.tsx)
Bài học: kiểm tra dòng `export` của file nguồn trước khi viết `import`. Thống nhất default cho component chính mỗi file.

### 5. Bỏ `<StrictMode>` vì "render 2 lần phiền"
Mô tả: thấy `console.log` in 2 lần ở dev nên gỡ StrictMode cho "sạch".

> 📄 **Code ví dụ:** [`examples/21-5-bo-strictmode-vi-render-2-lan-phien.tsx`](examples/21-5-bo-strictmode-vi-render-2-lan-phien.tsx)

> 📄 **Code ví dụ:** [`examples/22-5-bo-strictmode-vi-render-2-lan-phien.tsx`](examples/22-5-bo-strictmode-vi-render-2-lan-phien.tsx)
Bài học: double-render ở dev là miễn phí, prod không ảnh hưởng. Nó là máy báo khói cho effect bẩn.

### 6. Đặt component ngoài `src/`
Mô tả: Vite chỉ theo dõi và bundle trong project root, mặc định template coi `src/` là mã nguồn. Đặt file lung tung dễ miss HMR/alias.

> 📄 **Code ví dụ:** [`examples/23-6-at-component-ngoai-src.tsx`](examples/23-6-at-component-ngoai-src.tsx)

> 📄 **Code ví dụ:** [`examples/24-6-at-component-ngoai-src.tsx`](examples/24-6-at-component-ngoai-src.tsx)
Bài học: giữ quy ước `src/` của template Vite để mọi tool (HMR, alias, test) hoạt động.

### 7. Quên `npm install` sau khi clone
Mô tả: `npm run dev` báo `Cannot find module 'react'`.

> 📄 **Code ví dụ:** [`examples/25-7-quen-npm-install-sau-khi-clone.sh`](examples/25-7-quen-npm-install-sau-khi-clone.sh)

> 📄 **Code ví dụ:** [`examples/26-7-quen-npm-install-sau-khi-clone.sh`](examples/26-7-quen-npm-install-sau-khi-clone.sh)
Bài học: `node_modules` không nằm trong git. Luôn `install` sau clone/pull thêm dep mới.

### 8. Deploy thẳng thư mục `src`
Mô tả: upload `src/` lên hosting tĩnh, trình duyệt không hiểu TSX.

> 📄 **Code ví dụ:** [`examples/27-8-deploy-thang-thu-muc-src.sh`](examples/27-8-deploy-thang-thu-muc-src.sh)

> 📄 **Code ví dụ:** [`examples/28-8-deploy-thang-thu-muc-src.sh`](examples/28-8-deploy-thang-thu-muc-src.sh)
Bài học: `src/` là mã nguồn, `dist/` là sản phẩm. Hosting tĩnh chỉ nhận `dist/`.

### 9. Dùng `process.env` trong Vite
Mô tả: copy code Node/CRA sang Vite, `process is not defined` ở browser.

> 📄 **Code ví dụ:** [`examples/29-9-dung-process-env-trong-vite.tsx`](examples/29-9-dung-process-env-trong-vite.tsx)

> 📄 **Code ví dụ:** [`examples/30-9-dung-process-env-trong-vite.tsx`](examples/30-9-dung-process-env-trong-vite.tsx)
Bài học: biến nào lộ ra client phải bắt đầu `VITE_`. Secret (private key) không bao giờ để vào đây vì bundle lộ hết.

> **Tóm gọn 1 câu:** 9 lỗi đầu tay đều "dễ chữa" — nhớ bài học ở cuối từng mục là khỏi mắc lại lần hai.

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

> **Tóm gọn 1 câu:** Cài đủ bộ "dụng cụ nghề" ngày đầu: React Compiler, DevTools, ESLint, alias `@/` — mọi bước sau đều nhẹ hơn.

## Bài tập nhỏ
1. Tạo project `my-first-app` với Vite react-ts, sửa `App` hiển thị tên bạn + nút bấm hiện alert. Chạy `npm run dev` và kiểm tra HMR: gõ tên vào input rồi sửa chữ tiêu đề — input có giữ nguyên không? Vì sao HMR giữ được state?
2. Tạm bỏ `<StrictMode>` và thêm `console.log("render")` trong `App` — bấm nút để so sánh số lần log có/không StrictMode. Giải thích vì sao dev log 2 lần nhưng prod chỉ 1 lần.
3. Chạy `npm run build`, mở thư mục `dist/` xem file; đổi một chữ trong `App.tsx` rồi build lại để so sánh hash tên file chunk. Vì sao hash đổi giúp cache trình duyệt hoạt động đúng?

> **Tóm gọn 1 câu:** Ba bài tập này cho bạn cảm nhận trực quan về HMR, StrictMode và hash cache — làm tay hơn là đọc.

## Reference
- https://react.dev/learn/start-a-new-react-project
- https://vite.dev/guide/
- https://react.dev/reference/react-dom/client/createRoot
- https://react.dev/reference/react/StrictMode
