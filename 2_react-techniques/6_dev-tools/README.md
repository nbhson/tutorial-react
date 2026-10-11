# Dev Tools — Tổng quan

> Nguồn: https://vite.dev/ — https://react.dev/learn/react-developer-tools

Nhóm công cụ giúp **viết nhanh, bắt lỗi sớm và đo hiệu năng thật**: Vite lo build/dev, ESLint lo chất lượng code, Vitest lo kiểm thử, React DevTools/Chrome lo hiệu năng, Tailwind v4 lo styling. Đây là "bộ đồ nghề" mặc định của một dự án React 19 hiện đại.

## Nhóm này giải quyết gì

Một dự án chuyên nghiệp cần **vòng lặp phát triển nhanh và các cổng tự động**. Năm mảnh ghép:

1. **Dev chậm / build rối** — CRA đã deprecated, HMR kém → Vite dev server ESM + build hiện đại.
2. **Lỗi style & bug hook lọt** — code review thủ công không bắt hết → ESLint flat + react-hooks v6 (kèm Compiler rules).
3. **Không dám refactor** — thiếu test → Vitest + Testing Library theo hành vi người dùng.
4. **Tối ưu bằng cảm tính** — không biết chỗ nào chậm → React DevTools Profiler + Chrome Performance.
5. **Styling phân tán** — config Tailwind rối, class xung đột → Tailwind v4 CSS-first + `cn()`.

## Khi nào cần

- **Bắt đầu dự án mới**: cài cả bộ (Vite → ESLint → Vitest → Tailwind), rồi dùng DevTools khi cần tối ưu.
- **Thiết lập CI "cổng chất lượng"**: ESLint (2) + Vitest (3) với `--max-warnings=0` và coverage.
- **Đo và tối ưu**: DevTools (4) là công cụ cho nhóm `3_performance-optimization`.
- **Khi chuyển styling sang Tailwind v4** hoặc cần helper gộp class → bài 5.

## Các bài con

| # | Bài | Nội dung | Vai trò |
|---|---|---|---|
| 1 | [1-vite/](1-vite/README.md) | Vite: dev server ESM + HMR, build Rollup/Rolldown, plugin, proxy, `manualChunks`. Template `react-ts`, `vite preview` kiểm tra bản production. | Build & dev |
| 2 | [2-eslint-flat-hooks/](2-eslint-flat-hooks/README.md) | **ESLint flat config** + `eslint-plugin-react-hooks` v6 (gồm Compiler rules), react-refresh. Bắt mutate props/state, deps sai ngay lúc lint. | Chất lượng code |
| 3 | [3-vitest/](3-vitest/README.md) | Test với **Vitest** + Testing Library, `user-event`, MSW, coverage. Test theo hành vi (`getByRole`, `userEvent`), `renderHook` cho hook. | Kiểm thử |
| 4 | [4-devtools-perf/](4-devtools-perf/README.md) | **React DevTools** (Components + Profiler) + Chrome Performance tracks, User Timing. Quy trình "nghi ngờ → Profiler xác nhận → sửa → đo lại". | Hiệu năng |
| 5 | [5-tailwind-v4/](5-tailwind-v4/README.md) | **Tailwind CSS v4** integration: CSS-first config, `@theme`, `@custom-variant`, `cn()`. Không còn `tailwind.config.js`. | Styling |

## Mô tả chi tiết từng bài

### 1. Vite cho React
Dev server ESM + HMR gần như tức thời, production build tree-shaking. Bài này hướng dẫn template `npm create vite@latest -- --template react-ts`, cấu hình plugin tối thiểu (`@vitejs/plugin-react`, `vite-tsconfig-paths`, `rollup-plugin-visualizer`), proxy API dev tránh CORS, `manualChunks` tách vendor, và `vite preview` để kiểm tra bản production local.

### 2. ESLint Flat + react-hooks v6
ESLint v9/v10 dùng **flat config** (`eslint.config.js`) — mảng object, không `extends`, `globals` tường minh. `eslint-plugin-react-hooks` v6 gộp cả **React Compiler rules**: bắt mutate props/state, dependency sai, vi phạm purity ngay lúc lint. Bài này cũng nói về `react-refresh/only-export-components` và tích hợp lint-staged + `--max-warnings=0` ở CI.

### 3. Test với Vitest + Testing Library
Vitest dùng chung pipeline transform với Vite (cấu hình tối thiểu, API tương thích Jest). Test component theo **hành vi người dùng** (`getByRole`, `userEvent`) thay vì test implementation. Bài này cấu hình jsdom + setup file, mock fetch bằng MSW, dùng `renderHook` cho custom hook, và coverage v8 ở CI.

### 4. React DevTools + Performance Tracks
Hai công cụ bổ trợ: React DevTools nhìn vào re-render (Components + Profiler, "why did you render"), Chrome Performance đo long task/layout thực tế. React 19.2+ có Performance Tracks theo `Suspense` boundary. Bài này dạy quy trình "nghi ngờ → Profiler xác nhận → sửa (memo/split/defer) → đo lại" và dùng User Timing API đánh dấu vùng đo.

### 5. Tailwind CSS v4 + React
Tailwind v4 chuyển sang **CSS-first configuration**: cài qua `@tailwindcss/vite`, không còn `tailwind.config.js`, tùy biến theme bằng `@theme`, dark mode bằng `@custom-variant`, utility riêng bằng `@utility`. Bài này cũng trình bày helper `cn()` (`clsx` + `tailwind-merge`) để gộp class điều kiện không xung đột.

## Thứ tự đọc gợi ý

```
1 (Vite) → 2 (ESLint) → 3 (Vitest) → 5 (Tailwind) → 4 (DevTools, khi cần đo)
```

- **1**: nền tảng — mọi bài sau chạy trên Vite.
- **2 → 3**: dựng "cổng chất lượng" (lint + test) ở CI.
- **5**: styling sau khi hạ tầng build/test ổn.
- **4**: đọc khi bắt đầu tối ưu hiệu năng (không cần đọc ngay từ đầu).

## Cách phối hợp / Liên quan tới bài nào khác

- Vite (1) là nền cho cả 2–5.
- ESLint (2) + Vitest (3) tạo "cổng chất lượng" ở CI; ESLint v6 bắt lỗi Compiler liên quan `3_performance-optimization/1-react-compiler-memo`.
- DevTools (4) là công cụ đo để tối ưu (`3_performance-optimization` và `8_best-practices/4_performance-guide`).
- Tailwind (5) là tầng UI, dùng trong `3_react-tutorial` (UI/styling) và `8_best-practices/1_style-guide`.
- Vite config (env/plugin) dùng lại ở `4_security-config/2-env-config`.

## Sai lầm thường gặp (tổng hợp)

- **Cấu hình ESLint kiểu cũ (`.eslintrc` + `extends`)** → ESLint v9/v10 dùng flat config; chuyển sang `eslint.config.js`.
- **Đặt `--max-warnings=0` mà không sửa hết cảnh báo** → CI đỏ liên tục; dọn dần trước khi bật cứng.
- **Test implementation thay vì hành vi** → test vỡ khi refactor UI; ưu tiên `getByRole` + `userEvent`.
- **Bật Tailwind v4 nhưng vẫn tìm `tailwind.config.js`** → v4 là CSS-first; dùng `@theme`/`@custom-variant`.
- **Tối ưu theo cảm tính** → luôn dùng Profiler/Performance để xác nhận trước khi sửa.

## Câu hỏi thường gặp

- **Vite thay CRA thế nào?** CRA đã deprecated; Vite dev server ESM + HMR nhanh và build tree-shaking.
- **Vitest khác Jest ra sao?** Cùng API cơ bản, dùng chung pipeline transform với Vite, cấu hình tối thiểu.
- **react-hooks v6 có gì mới?** Gộp cả React Compiler rules — bắt mutate props/state, deps sai ngay lúc lint.
- **Tailwind v4 còn cần PostCSS không?** Không — dùng plugin `@tailwindcss/vite` trực tiếp.
- **DevTools Profiler dùng khi nào?** Khi nghi ngờ re-render thừa; xác nhận trước khi thêm memo/split.

## Tham khảo
- [Vite](https://vite.dev/)
- [ESLint](https://eslint.org/)
- [Vitest](https://vitest.dev/)
- [React Developer Tools](https://react.dev/learn/react-developer-tools)
- [Tailwind CSS](https://tailwindcss.com/)
