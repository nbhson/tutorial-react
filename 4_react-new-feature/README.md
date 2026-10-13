# React New Features

Tổng hợp các tính năng mới của React từ version 18 đến 19.3, React Compiler 1.0 và React Server Components. Mỗi folder chứa README tổng quan + các demo minh họa (`README.md` + `example.tsx`).

## Tổng quan theo version

| # | Folder | Version / Chủ đề | Ngày phát hành | Điểm nhấn |
|---|--------|------------------|----------------|-----------|
| 1 | [1_react-18](1_react-18/README.md) | React 18 | 03/2022 | Concurrent Rendering, `createRoot`, Automatic Batching, Transitions, Suspense SSR |
| 2 | [2_react-19](2_react-19/README.md) | React 19.0 | 12/2024 | Actions, `useActionState`, `useOptimistic`, `use()` hook, ref as prop, Document Metadata |
| 3 | [3_react-19-2](3_react-19-2/README.md) | React 19.2 | 10/2025 | `<Activity>`, `useEffectEvent`, `cacheSignal`, Partial Pre-rendering |
| 4 | [4_react-19-3](4_react-19-3/README.md) | React 19.3 | 09/2026 | `<ViewTransition>`, Fragment refs, `browser()` API |
| 5 | [5_react-compiler](5_react-compiler/README.md) | React Compiler 1.0 | 10/2025 (stable) | Auto-memoization, setup Vite/Next, Rules of React, ESLint plugin |
| 6 | [6_react-server-components](6_react-server-components/README.md) | RSC (stable) | 2024 → nay | App Router, Server Actions, `cache()` + `fetch` caching |

## Timeline React (2022 → 2026)

```
03/2022  React 18 ────── Concurrent Rendering, createRoot, Automatic Batching, Transitions
12/2024  React 19.0 ──── Actions, useActionState, useOptimistic, use(), ref as prop, Metadata
10/2025  React 19.2 ──── <Activity>, useEffectEvent, cacheSignal, Partial Pre-rendering
10/2025  React Compiler 1.0 (stable) ── auto-memoization, không cần useMemo/useCallback thủ công
09/2026  React 19.3 ──── <ViewTransition>, Fragment refs, browser() API
2024→    React Server Components (stable) ── App Router, Server Actions, cache()
```

**Feature nổi bật mỗi version:**

- **React 18 (03/2022)** — Nền móng concurrent: `createRoot` thay `ReactDOM.render`, render có thể ngắt/ưu tiên, automatic batching mọi ngữ cảnh, transitions (`startTransition`/`useDeferredValue`), streaming SSR + `useId`/`useSyncExternalStore`.
- **React 19.0 (12/2024)** — Actions & form UX: `<form action>`, `useActionState`, `useOptimistic`, `useFormStatus`; API/JSX mới: `use()`, `ref` là prop thường (bỏ `forwardRef`), Document Metadata hoist lên `<head>`, context-as-provider.
- **React 19.2 (10/2025)** — Primitive mới: `<Activity mode>` giữ state khi ẩn, `useEffectEvent` tách logic non-reactive khỏi Effect, `cacheSignal` (RSC) abort fetch theo cache lifecycle, Partial Pre-rendering (shell tĩnh + hole động).
- **React 19.3 (09/2026)** — Transition & browser: `<ViewTransition>` animation declarative, `<Fragment ref>` trỏ mảng DOM node, `use(browser())` đánh dấu component browser-only (opt-out SSR), Trusted Types + Context trong Server Component.
- **React Compiler 1.0 (10/2025, stable)** — Tự động memoize component/hook ở build-time, giảm gần hết `useMemo`/`useCallback`/`memo` thủ công; cần tuân Rules of React; kèm `eslint-plugin-react-compiler` + `react-compiler-healthcheck`.
- **React Server Components (stable 2024 → nay)** — Server Component render trên server, gửi UI tree về client, giảm bundle; Server Actions cho mutation; `cache()` + `fetch` caching; dùng qua Next.js App Router.

## Thứ tự đọc gợi ý

```
1_react-18 → 2_react-19 → 3_react-19-2 → 4_react-19-3
                 ↘ 5_react-compiler (bật bất cứ lúc nào sau 19)
                 ↘ 6_react-server-components (đọc sau 19 để hiểu Actions → RSC)
```

- **Mới bắt đầu**: đọc 18 → 19 → 19.2 → 19.3 theo dòng thời gian (mỗi version xây trên version trước).
- **Đã biết React 18**: bắt đầu thẳng ở 19, rồi song song Compiler (5) và RSC (6).
- **Đi nhanh theo nhu cầu**: form/mutation → 19 (+6 RSC); hiệu năng/memo → 5 Compiler; UI animation/SSR tinh tế → 19.3; tab/ẩn hiện rẻ → 19.2.

## Liên quan tới phần khác của tutorial

- **`2_react-techniques/3_performance-optimization/1-react-compiler-memo`**: bản thực hành sâu của `5_react-compiler`.
- **`2_react-techniques/1_advanced-features/3-store-zustand-tanstack-query`**: dùng `use()` + Server Actions của React 19 cho data fetching.
- **`3_react-tutorial`**: các DAY dùng trực tiếp feature ở đây (forms → 19, lazy/Suspense → 18/19, animations → 19.3 View Transitions).
- **`2_react-techniques/7_build-with-ai/4_design-patterns-ai`**: form AI dùng `useActionState` + Server Actions (React 19 + RSC).

## Yêu cầu

- Node.js 18+ (khuyến nghị 20+)
- React 18+ cho folder 1; React 19+ cho folder 2–4, 6; React Compiler 1.0 cho folder 5
- TypeScript 5+ (ví dụ dùng `example.tsx`)

## Cách dùng ví dụ

```bash
# Copy nội dung example.tsx vào project của bạn rồi chạy
npm install react@latest react-dom@latest
npx vite  # hoặc next dev
```

Mỗi thư mục con có 2 file:

- `README.md` — mô tả, vấn đề giải quyết, cú pháp, code ví dụ, khi nào dùng, reference link
- `example.tsx` — code demo chạy được, tự chứa (self-contained)

## Tài liệu tham khảo chung

- [React 18 Release — react.dev/blog/2022/03/29/react-v18](https://react.dev/blog/2022/03/29/react-v18)
- [React 19 Release — react.dev/blog/2024/12/05/react-19](https://react.dev/blog/2024/12/05/react-19)
- [React 19.2 Release — react.dev/blog/2025/10/01/react-19-2](https://react.dev/blog/2025/10/01/react-19-2)
- [React 19.3 Release — react.dev/blog/2026/09/09/react-19-3](https://react.dev/blog/2026/09/09/react-19-3)
- [React Compiler 1.0 — react.dev/blog/2025/10/07/react-compiler-1](https://react.dev/blog/2025/10/07/react-compiler-1)
- [React Compiler docs](https://react.dev/learn/react-compiler)
- [React Server Components docs](https://react.dev/reference/rsc/server-components)
