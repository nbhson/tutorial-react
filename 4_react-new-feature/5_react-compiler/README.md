# React Compiler 1.0

Tổng hợp **React Compiler 1.0** — chính thức **stable từ 10/2025**
([react.dev/blog/2025/10/07/react-compiler-1](https://react.dev/blog/2025/10/07/react-compiler-1)).
Đây là một **build-time compiler** tự động memoize component/hook, chạy trên **cả React và React Native**, cho phép bạn bỏ dần `useMemo` / `useCallback` / `memo` thủ công cho các case phổ biến mà **không cần rewrite** code.

## Tổng quan theo nhóm

| # | Feature | Mô tả |
|---|---------|-------|
| 1 | [Setup Vite & Next](1_setup-vite-next/README.md) | Cài `babel-plugin-react-compiler`, cấu hình Vite / Next.js, chạy healthcheck, directive `"use memo"` / `"use no memo"` |
| 2 | [Memoization & Rules](2_memoization-rules/README.md) | Compiler memoize cái gì, cơ chế reactivity, và Rules of React bắt buộc để compile an toàn |
| 3 | [Lint Rules](3_lint-rules/README.md) | Compiler-powered lint nay nằm trong `eslint-plugin-react-hooks@6` — bắt lỗi vi phạm ngay trong IDE/CI |

## ĐÁNH GIÁ TỔNG QUAN

### Điểm mạnh

1. **Bỏ memo thủ công** — re-render không còn lan tràn vì closure/object prop mới mỗi lần render.
2. **Build-time, không runtime cost** — output vẫn là JavaScript thường; logic memo được chèn lúc build.
3. **Không cần rewrite** — hoạt động trên React DOM và React Native, giữ nguyên kiến trúc hiện có.
4. **Opt-in / opt-out linh hoạt** — `"use memo"` để bật từng phần, `"use no memo"` để tắt chỗ không an toàn.

### Điểm cần lưu ý

1. **Phải tuân thủ Rules of React** — mutate render input, hook có điều kiện, non-reactive read... sẽ khiến component bị **skip**.
2. **Skip là im lặng** — compiler bỏ qua component vi phạm mà **không vỡ build** ⇒ cần lint để biết.
3. **Không thay cache tính toán đắt** — compiler memoize theo reactivity, không phải cache kết quả tùy ý; tính toán cực nặng vẫn nên dùng `useMemo`.
4. **DevTools hiển thị `MemoizedByCompiler`** — đừng ngạc nhiên khi thấy wrapper memo trong component tree.

### Lời khuyên rollout

- **Project mới** → bật compiler từ đầu + ESLint ở mức `error`.
- **Project cũ** → chạy `npx react-compiler-healthcheck`, bật dần từng route, đo tỉ lệ component được compile.
- **Giữ memo cũ** — compiler tôn trọng `memo`/`useMemo` thủ công đúng; xóa dần sau, đừng gỡ hàng loạt.

## Cú pháp nhanh

```bash
# Cài compiler + healthcheck
npm install -D babel-plugin-react-compiler
npx react-compiler-healthcheck
```

```ts
// vite.config.ts — Vite
react({ babel: { plugins: [['babel-plugin-react-compiler', { target: '19' }]] } });

// next.config.ts — Next.js 16 top-level (Next 15: experimental.reactCompiler)
const nextConfig = { reactCompiler: true };
```

```tsx
'use memo';    // opt-in compile cho file/component
'use no memo'; // opt-out khi code không compile-safe
```

Lint (khuyến nghị), thay cho plugin cũ `eslint-plugin-react-compiler`:

```js
// eslint.config.js
import reactHooks from 'eslint-plugin-react-hooks';
import { defineConfig } from 'eslint/config';

export default defineConfig([reactHooks.configs.flat['recommended-latest']]);
```

## Tính năng quan trọng khác

| Feature | Mô tả | Ghi chú |
|---------|-------|---------|
| `"use memo"` directive | Opt-in biên dịch cho file/component | Stable 1.0 |
| `"use no memo"` directive | Opt-out khi biết code không compile-safe | Stable 1.0 |
| `react-compiler-healthcheck` | Quét project, báo % component compile-safe | Tool CLI |
| Playground | [playground.react.dev](https://playground.react.dev) thử compile online | Tool |
| Compiler-powered lint | Rules trong `eslint-plugin-react-hooks@6` (`immutability`, `purity`, `refs`...) | Khuyến nghị |

## Yêu cầu

- React 17+ (khuyến nghị React 19), Node.js 18+.
- Babel 8 / Next.js 15+ / Vite 5+.
- Code tuân thủ **Rules of React** để compiler thật sự tối ưu.

## Chạy thử

```bash
npm install -D babel-plugin-react-compiler eslint-plugin-react-hooks@^6
npx react-compiler-healthcheck
```

## Tài liệu tham khảo

- [React Compiler 1.0 Release](https://react.dev/blog/2025/10/07/react-compiler-1)
- [React Compiler docs](https://react.dev/learn/react-compiler)
- [Rules of React](https://react.dev/reference/rules)
- [eslint-plugin-react-hooks (compiler rules)](https://react.dev/reference/eslint-plugin-react-hooks)
