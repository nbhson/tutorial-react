# Best Practices — Tổng quan

> Nguồn: https://react.dev/learn — đối chiếu Angular `8_best-practices/`

Nhóm này chốt lại **cách viết code React "đúng chuẩn"**: quy ước & style (nhất quán cho người và AI), accessibility (dùng được với mọi người), xử lý lỗi (không vỡ trắng trang), và hiệu năng (đo trước khi tối ưu).

## Nhóm này giải quyết gì

Đây là lớp "chất lượng cuối cùng" trước khi code ra tới người dùng. Bốn trụ:

1. **Không nhất quán** — mỗi dev viết một kiểu, AI sinh code loạn → style guide + enforce tự động.
2. **Không dùng được với mọi người** — thiếu semantic HTML, focus, ARIA → a11y sai chuẩn pháp lý và đạo đức.
3. **Vỡ trắng trang khi có lỗi** — một lỗi con làm sập cả app → error boundary nhiều tầng.
4. **Tối ưu cảm tính** — không có checklist đo lường → performance guide theo Core Web Vitals.

## Khi nào cần

- **Trước khi mở PR / review**: style guide (1) và a11y (2) là tiêu chí bắt buộc.
- **Mọi app có network/API**: error boundary (3) bảo vệ trải nghiệm khi sự cố.
- **Trước mỗi release**: performance guide (4) là vòng lặp đo–sửa cuối.
- **Dùng AI sinh code**: style guide (1) là "luật" cho prompt ở nhóm `7_build-with-ai`.

## Các bài con

| # | Folder | Mapping Angular | Nội dung |
|---|---|---|---|
| 1 | [1_style-guide/](1_style-guide/README.md) | `/style-guide` | Đặt tên + cấu trúc file, function-first, Compiler-safe, nền Airbnb. 1 component/1 file, barrel `index.ts` chỉ ở `shared/ui`. |
| 2 | [2_accessibility/](2_accessibility/README.md) | `/best-practices/a11y` | Semantic HTML, ARIA đúng chỗ, quản lý focus, tương phản màu. Kiểm tra bằng jsx-a11y, axe, keyboard walkthrough. |
| 3 | [3_error-boundary/](3_error-boundary/README.md) | `/best-practices/error-handling` | 3 tầng lỗi: render (boundary), data (query), toàn cục (log + fallback). Phân biệt lỗi mạng vs 4xx. |
| 4 | [4_performance-guide/](4_performance-guide/README.md) | `/guide/performance` | Checklist CWV: đo → render ít → bundle nhỏ → asset tối ưu. Gắn với nhóm 3_performance-optimization. |

## Mô tả chi tiết từng bài

### 1. Style Guide (React 19 + Compiler)
Quy tắc đặt tên + cấu trúc để team và AI sinh code nhất quán: file/component `PascalCase.tsx`, hook `useX.ts`, folder `kebab-case`; function component + TS; default qua destructuring (không `defaultProps`); không mutate props/state (Compiler-safe); 1 component/1 file; barrel `index.ts` chỉ ở `shared/ui`; thứ tự import cố định. Nền tảng Airbnb, loại bỏ phần lỗi thời với React 19.

### 2. Accessibility (a11y)
App dùng được bằng bàn phím + screen reader: ưu tiên semantic HTML (`button`, `nav`, `main`, heading) thay `div onClick`; mọi input có `<label>` (ghép id bằng `useId`), icon-button có `aria-label`, lỗi form có `role="alert"`; modal/menu trap focus + `Esc` + trả focus. Kiểm tra bằng `eslint-plugin-jsx-a11y`, axe DevTools, keyboard walkthrough, và tôn trọng `prefers-reduced-motion`.

### 3. Error Boundary + Xử lý lỗi
Ba tầng lỗi: **render** (Error Boundary bắt lỗi con), **data** (TanStack Query retry — không retry 4xx), **toàn cục** (log Sentry + fallback UI). Bài này dùng `react-error-boundary` với `fallbackRender` + nút thử lại + `resetKeys`, phân biệt lỗi mạng vs 4xx, và route error qua React Router `errorElement`. Nhấn mạnh boundary **không** bắt lỗi event handler/async.

### 4. Performance Guide
Checklist hiệu năng: **đo trước** (Core Web Vitals: LCP < 2.5s, INP < 200ms, CLS < 0.1 + Profiler), **render ít** (Compiler + `memo` đúng chỗ, state gần nơi dùng, `useDeferredValue`/`useTransition`), **bundle nhỏ** (lazy route, `manualChunks`), **assets** (ảnh avif/webp + `loading="lazy"` + kích thước; font swap + preload), **data** (`staleTime`, pagination). Chi tiết sâu hơn ở nhóm `3_performance-optimization` và bài `6_dev-tools/4-devtools-perf`.

## Thứ tự đọc gợi ý

```
1 (style guide) → 2 (a11y) → 3 (error boundary) → 4 (performance)
```

- **1**: đặt "luật" cho toàn bộ code — đọc trước để các bài sau áp đúng quy ước.
- **2**: tiêu chí chất lượng bắt buộc trong review.
- **3**: bảo vệ trải nghiệm khi có sự cố.
- **4**: vòng lặp đo–sửa cuối cùng trước release.

## Cách phối hợp / Liên quan tới bài nào khác

- **Style guide (1)** là "luật" cho mọi code, được enforce tự động bởi ESLint (`6_dev-tools/2-eslint-flat-hooks`) và dùng làm prompt cho AI (`7_build-with-ai/1`).
- **a11y (2)** là tiêu chí chất lượng bắt buộc trong review; liên hệ `1_advanced-features/5` (`prefers-reduced-motion`) và `4_security-config/1-xss-escape`.
- **Error boundary (3)** bảo vệ trải nghiệm khi có sự cố; gắn với remote MF (`5_micro-frontend/1`) và data query (`1_advanced-features/3`).
- **Performance (4)** là vòng lặp đo–sửa cuối cùng trước release; dùng công cụ ở `6_dev-tools/4` và nội dung sâu ở `3_performance-optimization`.

## Sai lầm thường gặp (tổng hợp)

- **Mỗi dev viết một kiểu** → review tốn thời gian; style guide (1) + ESLint enforce là "luật".
- **`div onClick` thay `button`** → không dùng được bàn phím/screen reader; ưu tiên semantic HTML (2).
- **Input không có `<label>`** → vi phạm a11y; ghép id bằng `useId` (2).
- **Bọc ErrorBoundary quanh event handler** → boundary **không** bắt lỗi event/async; xử lý bằng try/catch (3).
- **Retry mọi lỗi query** → retry cả 4xx là vô nghĩa; chỉ retry lỗi mạng/5xx (3).
- **Tối ưu khi chưa đo** → bắt đầu bằng Core Web Vitals + Profiler (4).

## Câu hỏi thường gặp

- **Style guide có cần thiết cho team nhỏ?** Ít nhất cho AI + review; càng đông càng quan trọng.
- **a11y có tốn nhiều thời gian không?** Không nếu làm ngay từ đầu: semantic HTML + label + focus.
- **ErrorBoundary bắt được lỗi nào?** Chỉ lỗi render của cây con — không bắt event handler, async, hay lỗi ở chính nó.
- **Core Web Vitals ngưỡng nào?** LCP < 2.5s, INP < 200ms, CLS < 0.1 (tốt).
- **Bao lâu đo performance một lần?** Trước mỗi release, và sau mỗi thay đổi lớn về render/bundle/asset.

## Tham khảo
- [React — Learn](https://react.dev/learn)
- [Web Content Accessibility Guidelines (WCAG)](https://www.w3.org/WAI/standards-guidelines/wcag/)
- [Core Web Vitals](https://web.dev/vitals/)
- [Airbnb React Style Guide](https://github.com/airbnb/javascript/tree/master/react)
