# Kỹ thuật React — Tổng quan

> React 19 + TypeScript (2026): Vite 7, React Compiler 1.0, TanStack Query v5, Zustand v5, React Router v7, Tailwind v4.

Phần này gom **8 nhóm kỹ thuật** biến kiến thức React cơ bản (ở `3_react-tutorial`) thành năng lực làm sản phẩm thật: tách bundle, hoạt động offline, kiến trúc code lớn, tối ưu hiệu năng, bảo mật, micro-frontend, công cụ dev, làm việc với AI, và chuẩn code. Mỗi nhóm là một thư mục có `README.md` (tổng quan) và các bài con (`README.md` chi tiết + `example.tsx` chạy được, comment tiếng Việt).

## Đọc phần này thế nào

- **Mới học xong React**: đi lần lượt nhóm 1 → 3 → 4, hoặc chọn lẻ theo nhu cầu ở bảng dưới.
- **Có nền React, cần làm app production**: bắt đầu từ nhóm 6 (đồ nghề) → 1 (tính năng nâng cao) → 3 (hiệu năng) → 8 (chuẩn code).
- **Làm việc nhóm / hệ thống lớn**: nhóm 2 (kiến trúc) → 5 (micro-frontend) → 8 (chuẩn & review).
- **Muốn khai thác AI**: nhóm 7, đọc sau khi đã nắm stack ở nhóm 6.

## Bảng 8 nhóm

| # | Nhóm | Nội dung | Khi nào cần |
|---|------|----------|-------------|
| 1 | [1_advanced-features/](1_advanced-features/README.md) | Lazy/dynamic import, PWA offline, Zustand + TanStack Query, Web Worker, routing animation + guard | App cấp production: bundle đầu cần nhỏ, chạy offline, tính toán nền, phân quyền route |
| 2 | [2_architecture-patterns/](2_architecture-patterns/README.md) | Feature-sliced / bulletproof-react, container-presentational, MVVM với hooks, chống prop-drilling, hexagonal | App vượt ~10–20 màn hình hoặc nhiều dev làm chung, cần cấu trúc bền |
| 3 | [3_performance-optimization/](3_performance-optimization/README.md) | React Compiler + memo, virtualization, code-splitting, useDeferredValue/useTransition | UI giật/chậm, list khổng lồ, bundle quá lớn, search gõ bị lag |
| 4 | [4_security-config/](4_security-config/README.md) | XSS escape, env config, secure headers, auth httpOnly cookie | App có đăng nhập, dữ liệu người dùng, chuẩn bị lên production |
| 5 | [5_micro-frontend/](5_micro-frontend/README.md) | Module Federation (Vite/Rspack), single-spa | Nhiều team cùng framework, hoặc nhiều framework trộn, cần deploy độc lập |
| 6 | [6_dev-tools/](6_dev-tools/README.md) | Vite, ESLint flat + react-hooks v6, Vitest, DevTools + Performance, Tailwind v4 | Bắt đầu dự án mới, thiết lập "cổng chất lượng" CI, cấu hình styling |
| 7 | [7_build-with-ai/](7_build-with-ai/README.md) | LLM prompts, agent-skills, MCP server, AI design patterns + tutor | Muốn dùng AI (Cursor/Copilot/agent) sinh & review code React đúng chuẩn |
| 8 | [8_best-practices/](8_best-practices/README.md) | Style-guide, accessibility, error-boundary, performance-guide | Chuẩn hóa code trước merge, đảm bảo a11y và trải nghiệm khi có lỗi |

## Mô tả chi tiết từng nhóm

1. **Advanced Features** — Năm tính năng nâng cao không thể thiếu của app thật: `React.lazy` + `Suspense` tách bundle, PWA/service worker cho offline, tách **client state (Zustand)** khỏi **server state (TanStack Query)**, Web Worker đẩy tính toán nặng khỏi main thread, và guard + animation cho routing.
2. **Architecture Patterns** — Năm cách tổ chức code ở quy mô lớn: FSD/bulletproof (chia theo feature), container–presentational (tách data/render), MVVM qua `useViewModel`, chống prop-drilling theo thứ tự composition → context → store, và hexagonal (core thuần + port/adapter). Có thể kết hợp: FSD làm khung, hexagonal cho nghiệp vụ, MVVM cho màn hình.
3. **Performance Optimization** — Bốn hướng tối ưu: React Compiler tự memoize, virtualization cho list 10k+, code-splitting theo route/vendor, và lập lịch render theo ưu tiên với `useDeferredValue`/`useTransition`. Triết lý chung: **đo trước, tối ưu đúng chỗ**.
4. **Security & Config** — Bốn lớp phòng thủ (defense-in-depth): chống XSS ở tầng render (DOMPurify, URL allowlist), quản lý env an toàn (`VITE_*` + zod fail-fast), siết header + CSP ở tầng HTTP, và auth bằng cookie httpOnly chống CSRF.
5. **Micro-frontend** — Chia app lớn thành nhiều app nhỏ deploy độc lập: Module Federation (cùng framework, chia sẻ module), single-spa (orchestration nhiều framework), và các điều kiện "sống khỏe" (share deps, routing, version deploy).
6. **Dev Tools** — "Bộ đồ nghề" mặc định: Vite (build/dev), ESLint flat + react-hooks v6 (chất lượng), Vitest + Testing Library (kiểm thử), React DevTools/Chrome Performance (đo hiệu năng), Tailwind v4 (styling CSS-first).
7. **Build with AI** — Dẫn AI IDE/agent làm đúng chuẩn React 19: `llms.txt` + `AGENTS.md`, Agent Skills tái sử dụng, MCP server cho docs & tool, các design pattern khi dùng AI, và AI tutor dạy React.
8. **Best Practices** — Chốt lại "cách viết đúng chuẩn": style guide (nhất quán, Compiler-safe), accessibility (semantic HTML + ARIA), error boundary (3 tầng lỗi), và performance guide (checklist Core Web Vitals).

## Thứ tự đọc gợi ý

```
Lộ trình "app production đầy đủ":
  6 (đồ nghề) → 1 (tính năng nâng cao) → 3 (hiệu năng) → 4 (bảo mật) → 8 (chuẩn code)

Lộ trình "hệ thống lớn / nhiều team":
  2 (kiến trúc) → 5 (micro-frontend) → 6 (CI & test) → 8 (review/a11y)

Lộ trình "nhanh, theo nhu cầu":
  Chọn đúng ô ở bảng trên, đọc README nhóm rồi nhảy vào bài con cần nhất.
```

## Liên kết chéo giữa các nhóm

- **1 ↔ 3**: Lazy/dynamic import (1) và code-splitting (3) cùng chủ đề tách bundle; routing animation (1) nên kết hợp code-splitting (3) để page mới không chờ chunk.
- **1 ↔ 4**: Sinh viên dùng `persist` của Zustand (1) phải cẩn thận không lưu token — xem auth httpOnly cookie (4).
- **2 ↔ 1**: Container–presentational và MVVM (2) là "vi phân" bên trong slice FSD (2); dữ liệu server trong container dùng TanStack Query (1).
- **3 ↔ 6**: Tối ưu hiệu năng (3) cần công cụ đo ở DevTools/Performance (6); ESLint react-hooks v6 (6) bắt lỗi Compiler.
- **3 ↔ 8**: Performance guide (8) là checklist cấp cao tổng hợp nội dung sâu của nhóm 3.
- **4 ↔ 8**: Error boundary (8) và auth cookie (4) phối hợp để không lộ dữ liệu khi có sự cố.
- **5 ↔ 8**: Remote micro-frontend (5) cần Error Boundary (8) làm fallback khi remote deploy lệch.
- **7 ↔ tất cả**: Prompt/skill/MCP (7) cần "luật chơi" từ style-guide (8) và stack ở dev-tools (6).

## Câu hỏi thường gặp khi chọn nhóm

- **Học nhóm nào trước?** Nếu mới làm app thật: 6 (đồ nghề) → 1 (tính năng nâng cao); nếu muốn tổ chức code: 2 → 5.
- **Có phải học hết 8 nhóm không?** Không — chọn theo nhu cầu; hầu hết app chỉ cần 1, 3, 4, 6, 8.
- **Nhóm 3 và 8 khác gì nhau?** Nhóm 3 là kỹ thuật tối ưu sâu; nhóm 8 là checklist/chuẩn tổng hợp.
- **Micro-frontend có phải lúc nào cũng cần?** Không — chỉ khi nhiều team cần deploy độc lập.
- **AI có thay được các kỹ thuật này?** Không — AI chỉ tăng tốc; kiến trúc, hiệu năng, bảo mật vẫn do bạn quyết.

## Gợi ý lộ trình theo mục tiêu

| Mục tiêu | Nhóm nên đọc trước | Nhóm nên đọc sau |
|---|---|---|
| App production đầu tiên | 6, 1 | 3, 4, 8 |
| Chuẩn bị phỏng vấn React | 1, 3 | 2, 8 |
| Hệ thống lớn, nhiều team | 2, 5 | 6, 8 |
| Tối ưu app đang chạy chậm | 3 | 6, 8 |
| Làm việc với AI hằng ngày | 7 | 8, 6 |

## Nguồn & công cụ chính (2026)

- [react.dev](https://react.dev/) — docs chính thức React 19.3 + Compiler.
- [Vite](https://vite.dev/) — build/dev server.
- [TanStack Query](https://tanstack.com/query/latest) + [Zustand](https://zustand.docs.pmnd.rs/) — state.
- [React Router](https://reactrouter.com/) — routing.
- [Module Federation](https://module-federation.io/) — micro-frontend.
