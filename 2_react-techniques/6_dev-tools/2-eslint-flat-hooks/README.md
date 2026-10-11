# ESLint Flat + react-hooks v6

> Nguồn: https://eslint.org/docs/latest/use/configure/configuration-files — https://react.dev/reference/eslint-plugin-react-hooks

## Mục tiêu
- Nắm flat config (`eslint.config.js`) của ESLint v9/v10 khác gì `.eslintrc` legacy.
- Cài và bật `eslint-plugin-react-hooks` v6 gồm cả **Compiler rules** (bắt mutate, deps sai ngay lúc lint).
- Tích hợp lint vào pre-commit (lint-staged) và CI với `--max-warnings=0`.

## Tổng quan
- ESLint 9+ mặc định dùng **flat config**: một file `eslint.config.js` (ESM), cấu hình là mảng object, không còn `extends`, không còn `env`, dùng `globals` tường minh.
- `eslint-plugin-react-hooks` v6 (2025+) gộp luôn rules của **React Compiler**: ngoài `rules-of-hooks`/`exhaustive-deps` còn có `immutability` (không mutate props/state), `purity` (gọi hàm không thuần túy ở render), `preserve-manual-memoization`, `ensure-custom-hooks-using-other-hooks`…
- Áp dụng mọi dự án React + TS; thay thế hẳn `.eslintrc.*` khi upgrade ESLint.

## Khái niệm cốt lõi
- **Flat config khác legacy**: mảng config áp theo `files` glob; không merge ngầm (trừ `...configs.recommended`); `imports`/`exports` ESM; `globals` cần khai hoặc dùng preset `globals.browser`.
- **Compiler rules tương tác thế nào**: React Compiler tự memoize nên code phải "trong sạch" — không mutate, không side-effect ở render. Plugin bắt những vi phạm này để compiler không bỏ qua component.
- **`react-hooks/configs.flat.recommended`**: preset flat đã bật `rules-of-hooks` + `exhaustive-deps` + compiler rules (v6).
- **`react-refresh/only-export-components`**: chỉ export component (hoặc const không phải component) khỏi file component → không làm gãy HMR.
- **Lint-staged + `--max-warnings=0`**: chặn commit/CI khi có cả cảnh báo.

## Luồng hoạt động / Cách áp dụng
1. Cài: `eslint`, `@eslint/js`, `typescript-eslint`, `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`.
2. Tạo `eslint.config.js` theo mẫu dưới; thêm ignored `dist`, `node_modules`.
3. Chạy `npx eslint .` — sửa lỗi; các rule React `react/jsx-*` thêm từ `eslint-plugin-react` nếu cần.
4. Thêm script `lint: `eslint . --max-warnings=0``.
5. Lint-staged pre-commit: `eslint --fix` trên file staged.

## Ví dụ chi tiết
```js
// eslint.config.js — flat config chuẩn React 19 + TS (ESLint 9/10)
import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import react from 'eslint-plugin-react';

export default tseslint.config(
  { ignores: ['dist', 'coverage'] },
  js.configs.recommended,                        // rules JS cơ bản
  ...tseslint.configs.recommended,               // rules TS + type-aware (nếu dùng)
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      globals: { ...globals.browser },           // window/document hợp lệ
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    plugins: {
      react,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    settings: { react: { version: '19' } },
    rules: {
      // 🎯 v6: rules-of-hooks + exhaustive-deps + Compiler rules (immutability, purity...)
      ...reactHooks.configs.flat.recommended.rules,
      'react/react-in-jsx-scope': 'off',         // React 17+ không cần import React
      'react/jsx-uses-react': 'off',
      // Chặn export lẫn lộn làm gãy HMR
      'react-refresh/only-export-components': 'warn',
    },
  },
);
```

```tsx
// example.tsx — đoạn code "sạch" qua được react-hooks v6
import { useEffect, useState } from 'react';

export function Greeter({ name }: { name: string }) {
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    // ✅ không mutate props, deps đủ ([name]) — if thiếu sẽ bị exhaustive-deps bắt
    setGreeting(`Xin chào, ${name}!`);
  }, [name]);

  return <p>{greeting}</p>;
}
```

```bash
# script trong package.json / CI
npx eslint . --max-warnings=0   # lỗi CI nếu còn bất kỳ warning
```

```json
// .lintstagedrc.json — tự sửa file staged trước khi commit
{ "*.{ts,tsx,js,mjs}": ["eslint --fix", "prettier --write"] }
```

## Giải thích từng phần
- `tseslint.config(...)`: trình gộp chuẩn của typescript-eslint trên flat config.
- `...reactHooks.configs.flat.recommended.rules`: bật toàn bộ rule an toàn, gồm compiler rules của v6.
- `globals.browser`: khai môi trường browser (không còn `env: { browser: true }`).
- `react-refresh/only-export-components: 'warn'`: rất hữu ích, ngăn file component export hook conventions sai.
- `--max-warnings=0`: biến warning thành lỗi trong CI — giữ chuẩn minh bạch.

## Lỗi thường gặp / Chống chỉ định
- **Giữ `.eslintrc` khi lên ESLint 9**: không đọc nữa → phải chuyển sang `eslint.config.js` hoặc `--- overrides configs` gỡ.
- **Quên import JSX scope rules**: báo lỗi "React must be in scope" trên React 17+ → tắt `react/react-in-jsx-scope`.
- **Chỉ dùng `exhaustive-deps` mà bỏ qua Compiler rules**: không bắt được mutate props → bật cả `configs.flat.recommended`.
- **Thiếu `globals.browser`**: `window` báo no-undef → khai globals hoặc preset.
- **`eslint --fix` chạy trên cả repo ở pre-commit**: chậm và sửa file không staged → chỉ `--fix` file staged qua lint-staged.

## Best practices / Mẹo
- Payload "chuẩn vàng": `useMemo`/`useCallback` viết đúng deps → exhaustive-deps không bắt, compiler càng bớt việc memo thủ công.
- Review `react-hooks/immutability` khi thêm lib mutate mảng (`push` trực tiếp state).
- Cấu hình Prettier riêng, để ESLint lo "logic rules", tránh conflict.
- Thêm `eslint-plugin-jsx-a11y` (xem nhóm 8) vào cùng config flat.
- Nếu dự án cũ còn `.eslintrc`, dùng `@eslint/eslintrc` `FlatCompat` để chuyển dần thay vì viết lại toàn bộ.

## Bài tập nhỏ
Cài devDeps và tạo `eslint.config.js` theo mẫu. Viết 3 file vi phạm (hook trong loop, mutate props, thiếu deps) rồi chạy `eslint .` — liệt kê lỗi từng rule và cách sửa.

## Reference
- [ESLint — Configuration Files (flat)](https://eslint.org/docs/latest/use/configure/configuration-files)
- [eslint-plugin-react-hooks](https://react.dev/reference/eslint-plugin-react-hooks)
- [React Compiler rules — eslint](https://react.dev/learn/react-compiler/rules)
- [typescript-eslint](https://typescript-eslint.io/)