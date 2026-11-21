# Tutorial React (2026 — React 19.3 + Compiler 1.0)

Bộ tutorial React đầy đủ, được tổ chức **đối chiếu 1-1** với cấu trúc của `tutorial-angular`, nhưng cập nhật theo kiến thức mới nhất (React 19.3, React Compiler 1.0, React Server Components).

## Bản đồ tổng thể

Mục này nói về cấu trúc toàn bộ repo — mỗi thư mục React tương ứng với thư mục nào bên Angular. Đọc mục này để biết "tài liệu mình cần nằm ở ngăn nào" trước khi lặn vào chi tiết.

| Angular | React tương ứng | Nội dung |
|---|---|---|
| `1_angularjs-tutorial` (AngularJS 1.x) | [`1_react-legacy-tutorial`](1_react-legacy-tutorial) | Class components, lifecycle cũ, CDN `index.html`, đối chiếu `$scope`/`ng-repeat`/`filter`; unit-test Vitest + RTL |
| `2_angular-techniques` (8 nhóm) | [`2_react-techniques`](2_react-techniques) | Giữ nguyên **8 nhóm**: advanced-features, architecture-patterns, performance-optimization, security-config, micro-frontend, dev-tools, build-with-ai, best-practices |
| `3_angular-tutorial` (DAY 0..21) | [`3_react-tutorial`](3_react-tutorial) | 22 bài DAY: explore → JSX → list → props → ref → children → render-props → context → external-store → Children API → memo → forms → data-fetching → lazy/Suspense → router → effects → custom-hooks → UI libs → i18n → animations → drag-drop → testing |
| `4_angular-new-feature` (v14..v22) | [`4_react-new-feature`](4_react-new-feature) | React 18 → 19 → 19.2 → 19.3 → Compiler 1.0 → RSC, mỗi version có bài tổng quan + bài con |
| (không tương ứng) | [`5_react-crud-jsonplaceholder`](5_react-crud-jsonplaceholder) | Bài CRUD thực chiến với JSONPlaceholder (REST API giả lập) |
| (không tương ứng) | [`6_interview-question`](6_interview-question) | Bộ câu hỏi phỏng vấn React thực chiến (Q1: library vs framework...) |

> **Cách đọc bảng này:** mỗi dòng là một cặp thư mục đối chiếu Angular ↔ React; cột giữa là chỗ cần vào trong repo này, cột Nội dung tóm tắt trong đó có gì — đến từ Angular thì đọc cột trái trước để tìm "cái cũ" của mình thành "cái mới" ở đâu.

## Timeline kiến thức (React)

Mục này nói về các mốc version React từ 18 đến 19.3 và mỗi mốc mang tính năng gì mới. Đọc mục này để biết "kiến thức trong tutorial thuộc thời nào" — rất hữu ích khi bị hỏi "tính năng X ra từ version mấy?".

| Version | Mốc | Feature nổi bật |
|---|---|---|
| React 18 | 03/2022 | Concurrent rendering, automatic batching, `useTransition`/`useDeferredValue`, `useId`, `useSyncExternalStore`, `createRoot` |
| React 19.0 | 12/2024 | Actions (`useActionState`, `useOptimistic`, `useFormStatus`), `use()`, ref as prop, Document Metadata; **RSC & Server Actions stable** |
| React 19.2 | 10/2025 | `<Activity>`, `useEffectEvent`, `cacheSignal`, Partial Pre-rendering, SSR batching |
| React Compiler 1.0 | 10/2025 | Tự memoize component/hook ổn định (production-ready), lint qua `eslint-plugin-react-hooks` v6 |
| React 19.3 | 09/2026 | `<ViewTransition>` + `addTransitionType`, Fragment Refs, `browser()`, Trusted Types, `<Context>` trong Server Component |
| RSC | stable 19 | Server Components, Server Functions/Actions, `"use client"`/`"use server"` |

> **Cách đọc bảng này:** mỗi dòng là một mốc version xếp theo thời gian (từ trên xuống); cột "Feature nổi bật" là thứ sinh ra ở mốc đó — cần trả lời "tính năng X từ version nào" thì quét dọc cột này là thấy.

> **Tóm gọn 1 câu:** Repo này là "từ điển đối chiếu" Angular ↔ React: biết mình đến từ đâu (nhóm nào, version nào) là tìm được đúng bài mình cần.

## Stack chuẩn trong tutorial

- **Build tool**: Vite 8+ (rolldown-based, `npm create vite@latest`) — CRA đã deprecated.
- **Ngôn ngữ**: TypeScript strict, code `tsx`.
- **UI/data**: React Router v7 hoặc TanStack Router; TanStack Query v5; Zustand; `react-hook-form` + Zod.
- **UI kit / style**: MUI / shadcn-ui / Tailwind CSS v4.
- **Animation / DnD**: Motion (Framer Motion), dnd-kit, View Transitions.
- **Lint**: `eslint-plugin-react-hooks` v6 (flat config) — bao gồm compiler lint rules.
- **Test**: Vitest + React Testing Library; E2E Playwright.
- **Compiler**: `babel-plugin-react-compiler` (Vite/Next) — khuyến nghị bật cho app mới.

## Quy ước mỗi bài

- `README.md` tiếng Việt, cấu trúc thống nhất: **Mục tiêu → Khái niệm cốt lõi → Luồng hoạt động → Ví dụ chi tiết (có chú thích) → Giải thích từng phần → Bảng so sánh Angular ↔ React → Lỗi thường gặp → Best practices → Bài tập nhỏ → Reference**.
- Kèm file ví dụ chạy được tối giản (`example.tsx` / `App.tsx` / `index.html` tuỳ nhóm).
- Ưu tiên function components + hooks; ghi rõ khi nào nội dung là legacy.

## Bắt đầu nhanh

> 📄 **Code ví dụ:** [`examples/01-bat-au-nhanh.sh`](examples/01-bat-au-nhanh.sh)

## Lộ trình gợi ý theo mục tiêu

- **Mới bắt đầu React (biết JavaScript)**: `3_react-tutorial` DAY 0 → 9 → 11 → 12 → 14 → 15 → 21.
- **Đến từ AngularJS**: `1_react-legacy-tutorial` (đọc để ánh xạ) → `3_react-tutorial` DAY 0 → 16.
- **Đến từ Angular 2+ (modern)**: `3_react-tutorial` (module ↔ hooks/context, DI ↔ context/store, pipe ↔ format/`Intl`, RxJS ↔ TanStack Query).
- **Cập nhật kiến thức mới**: `4_react-new-feature` đọc tuần tự 1 → 6.
- **Đi sâu kỹ thuật**: `2_react-techniques` theo từng nhóm nhu cầu.

## Reference chính

- [React 19](https://react.dev/blog/2024/12/05/react-19)
- [React 19.2](https://react.dev/blog/2025/10/01/react-19-2)
- [React Compiler 1.0](https://react.dev/blog/2025/10/07/react-compiler-1)
- [React 19.3](https://react.dev/blog/2026/09/09/react-19-3)
- [Học React (react.dev/learn)](https://react.dev/learn)
- [Rules of React](https://react.dev/reference/rules)
