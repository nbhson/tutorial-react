# 1. Setup React Compiler (Vite & Next.js)

## Mô tả

React Compiler 1.0 đạt **stable từ 10/2025** (release chính thức `react.dev/blog/2025/10/07/react-compiler-1`). Đây là một **build-time compiler**: nó phân tích code React của bạn lúc build rồi tự động chèn memoization, giống như thể bạn đã viết `useMemo` / `useCallback` / `memo` bằng tay — nhưng chính xác và toàn diện hơn.

Compiler hoạt động trên **cả React DOM và React Native**, không cần rewrite component. Bạn giữ nguyên cách viết code hiện tại, chỉ cần cấu hình build tool để chạy compiler.

## Mục tiêu

- Hiểu React Compiler là gì và vì sao nó là build-time (không runtime cost).
- Cấu hình được compiler cho **Vite** (qua `@vitejs/plugin-react` + Babel) và **Next.js** (qua flag `reactCompiler`).
- Biết cách kiểm tra độ tương thích codebase bằng `react-compiler-healthcheck`.

## Vấn đề giải quyết

Trước React Compiler, để tránh re-render thừa bạn phải bọc `memo()`, `useMemo()`, `useCallback()` bằng tay:

- Dễ **thiếu** — quên memo một callback truyền xuống child nặng ⇒ child re-render vô ích.
- Dễ **thừa** — memo mọi thứ ⇒ code rối, dependency array khó bảo trì.
- **Sai ngầm** — dependency array sai thứ tự ⇒ stale value, bug khó tìm.

Compiler thay thế công việc thủ công đó: nó đọc toàn bộ component, dựng đồ thị phụ thuộc, và chỉ chèn memo khi thật sự có lợi. Điều kiện là code phải tuân thủ **Rules of React** — nếu không, component đó bị **skip** (compiler bỏ qua, không vỡ build).

## Khái niệm cốt lõi

Compiler không chạy trong browser. Nó là một bước transform (Babel plugin hoặc SWC plugin) chèn helper runtime nhỏ vào output. Vài điểm quan trọng:

- **Không runtime cost** — output vẫn là JavaScript thường; logic memo nằm ở dữ liệu chèn lúc build.
- **Tự động theo reactivity** — compiler memo dựa trên giá trị nào *thực sự* thay đổi, chứ không chỉ so sánh reference thô.
- **Opt-in / opt-out bằng directive**:
  - `"use memo"` — bật compile cho một file/component cụ thể (khi bạn chưa bật toàn cục).
  - `"use no memo"` — tắt compile cho file/component (khi biết code không compile-safe, ví dụ interop với thư viện mutable).
- **Skip thay vì crash** — component vi phạm rules bị compiler bỏ qua lặng lẽ. Vì vậy cần ESLint để phát hiện (xem bài 3).

## Cú pháp / API

### Bước 1 — Cài đặt và kiểm tra

```bash
# Cài compiler (dev dependency)
npm install -D babel-plugin-react-compiler

# (khuyến nghị) kiểm tra codebase có tương thích không
npx react-compiler-healthcheck
```

`react-compiler-healthcheck` quét project, báo số component compile-safe / bị skip và lý do — chạy trước khi bật compiler cho codebase cũ.

### Bước 2a — Vite

Dùng `@vitejs/plugin-react` và truyền plugin Babel của compiler:

```ts
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [['babel-plugin-react-compiler', {}]],
      },
    }),
  ],
});
```

Có thể chỉ định target React: `['babel-plugin-react-compiler', { target: '19' }]`.
Ngoài ra có plugin wrapper tiện hơn: `vite-plugin-react-compiler`.

### Bước 2b — Next.js

```ts
// next.config.ts
import type { NextConfig } from 'next';
const nextConfig: NextConfig = {
  reactCompiler: true, // Next 16: top-level (Next 15: experimental.reactCompiler)
};
export default nextConfig;
```

### Directive trong code

```tsx
'use memo';    // bật compiler cho file/component này
'use no memo'; // tắt compiler cho file/component này
```

## Luồng hoạt động (Flow)

1. **Cài** `babel-plugin-react-compiler` và chạy `react-compiler-healthcheck`.
2. **Cấu hình build tool**: Vite (Babel plugin) hoặc Next.js (`reactCompiler: true`).
3. Ở mỗi lần build, compiler đọc từng component/hook.
4. Compiler kiểm tra code có tuân thủ **Rules of React** không (pure render, không mutate input...).
5. **Hợp lệ** → chèn memoization tự động vào output.
6. **Vi phạm** → bỏ qua (skip) component đó, phần còn lại vẫn build bình thường.
7. Bạn thêm ESLint (bài 3) để phát hiện các component bị skip ngay trong IDE.

## Ví dụ chi tiết

Xem [`example.tsx`](example.tsx) cùng thư mục. Dưới đây là bản diễn giải đầy đủ, comment từng dòng:

```tsx
// Setup tham khảo (không phải code chạy):
// Vite: react({ babel: { plugins: [['babel-plugin-react-compiler', { target: '19' }]] } })
// Next: experimental: { reactCompiler: true }   (Next 16: reactCompiler: true)
// Opt-in: "use memo";  Opt-out: "use no memo"

'use memo'; // Bật compiler cho riêng file demo này

import { memo, useState } from 'react';

// Child "nặng" — KHÔNG cần memo() thủ công, Compiler tự memo.
function ExpensiveChild({ config }: { config: { theme: string } }) {
  // Log để quan sát: chỉ in khi theme thực sự đổi
  console.log('[render] ExpensiveChild', config.theme);
  return <p>Theme: {config.theme} (chỉ re-render khi theme đổi thật)</p>;
}

export default function CompilerSetupDemo() {
  const [theme, setTheme] = useState('sáng');
  const [tick, setTick] = useState(0); // state này KHÔNG liên quan tới child

  return (
    <div>
      <h2>React Compiler auto-memo (1.0)</h2>
      {/*
        `config={{ theme }}` tạo object MỚI mỗi lần render.
        Cách viết "ngây thơ" này thường khiến child re-render thừa.
        Nhưng Compiler biết object chỉ phụ thuộc `theme` ⇒ khi bấm Tick,
        child KHÔNG re-render.
      */}
      <ExpensiveChild config={{ theme }} />
      <button onClick={() => setTheme(theme === 'sáng' ? 'tối' : 'sáng')}>
        Đổi theme
      </button>
      <button onClick={() => setTick(tick + 1)}>
        Tick ({tick}) — child không re-render
      </button>
    </div>
  );
}

// Giữ memo thủ công cũng KHÔNG sao — Compiler tôn trọng và bỏ qua chỗ đó:
export const ManualMemoChild = memo(function ManualMemoChild() {
  return <p>Child memo thủ công vẫn chạy bình thường.</p>;
});
```

## Giải thích từng phần

- **`'use memo'`** — directive bật compiler cục bộ. Trong project đã bật toàn cục (Vite/Next config) thì directive này không bắt buộc, nhưng hữu ích khi bạn muốn opt-in từng file trong giai đoạn rollout.
- **`ExpensiveChild` và `config={{ theme }}`** — minh họa điểm mạnh cốt lõi: object literal mới mỗi render trông như "gây re-render", nhưng compiler theo dõi *giá trị* bên trong. Chỉ khi `theme` đổi thì child mới render lại.
- **`console.log`** — dùng để *chứng minh* hành vi: bấm "Tick" nhiều lần, bạn sẽ thấy child không in log thêm.
- **`ManualMemoChild = memo(...)`** — cho thấy compiler **không phá** code memo cũ. Nó nhận ra component đã được memo và để yên.

## So sánh với cách làm cũ

| Cách cũ | Cách mới | Lợi ích |
|---------|----------|---------|
| Tự viết `useMemo`/`useCallback` cho từng giá trị | Compiler tự chèn memo khi cần | Ít code, không lo thiếu/thừa |
| Phải nhớ bọc `memo()` cho child nặng | Compiler tự quyết định memo child | Không bỏ sót node nóng |
| Dependency array sai ⇒ stale value | Compiler suy ra phụ thuộc từ code | Loại bỏ lớp bug phổ biến |
| Memo "bằng cảm giác"/đoán | Memo dựa trên phân tích thật của compiler | Chính xác, đều tay trên toàn codebase |

## Lỗi thường gặp

1. **Quên cài `babel-plugin-react-compiler`** — đặt config nhưng thiếu package ⇒ build lỗi hoặc compiler không chạy.
   *Fix:* `npm i -D babel-plugin-react-compiler` rồi build lại.
2. **Đặt `reactCompiler: true` sai chỗ theo phiên bản Next** — Next 15 cần `experimental.reactCompiler`, Next 16 dùng top-level. *Fix:* xem phiên bản Next, đặt đúng vị trí.
3. **Bật compiler cho codebase cũ chưa kiểm tra** — nhiều component bị skip mà bạn không biết. *Fix:* chạy `npx react-compiler-healthcheck` trước, xử lý vi phạm dần.
4. **Tưởng bật compiler là mọi thứ tự tối ưu** — nếu component vi phạm Rules of React, nó bị skip. *Fix:* dùng ESLint (bài 3) để đảm bảo thực sự được compile.
5. **Nhầm `"use memo"` là state/effect hook** — nó chỉ là directive điều khiển compiler, không có runtime behavior. *Fix:* chỉ đặt ở dòng đầu file/function.

## Khi nào dùng / Khi nào không

**Nên dùng khi:**
- Project mới (React 17+, khuyến nghị React 19) — bật compiler ngay từ đầu.
- Codebase cũ — chạy healthcheck, bật dần từng route, đo tỉ lệ component được compile.
- Bạn muốn giảm code memo thủ công mà không đổi kiến trúc.

**Cân nhắc khi:**
- Có nhiều đoạn interop với thư viện mutable ngoài (đọc/ghi object ngoài React) — có thể bị skip; dùng `"use no memo"` + comment lý do.
- Có tính toán cực nặng theo kiểu "cache kết quả" — compiler memoize *reactivity* chứ không thay cache tính toán; vẫn giữ `useMemo` cho case này (xem bài 2).

## Bài tập nhỏ

Tạo một Vite project, cấu hình `babel-plugin-react-compiler`, rồi viết một `Parent` truyền `style={{ color }}` và một callback inline xuống `Child` có `console.log`. Bấm một nút chỉ đổi state *không* liên quan và kiểm chứng: `Child` **không** in log thêm nhờ compiler.

## Reference

- [React Compiler 1.0 Release (react.dev blog)](https://react.dev/blog/2025/10/07/react-compiler-1)
- [React Compiler — Installation & Setup](https://react.dev/learn/react-compiler)
- [babel-plugin-react-compiler (npm)](https://www.npmjs.com/package/babel-plugin-react-compiler)
- [Next.js — React Compiler config](https://nextjs.org/docs/app/api-reference/config/next-config-js/reactCompiler)
