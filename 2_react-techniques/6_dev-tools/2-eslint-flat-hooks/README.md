# ESLint Flat + react-hooks v6

> Nguồn: https://eslint.org/docs/latest/use/configure/configuration-files — https://react.dev/reference/eslint-plugin-react-hooks

## Mục tiêu

### 1. Nắm flat config (`eslint.config.js`) của ESLint v9/v10 khác gì `.eslintrc` legacy

**Vì sao:** ESLint 9+ mặc định flat — file `eslint.config.js` ESM, mảng object, không `extends`/`env` cũ. Giữ `.eslintrc` khi lên 9 là config không đọc nữa (lint chạy mà không check gì — tưởng xanh mà mù). Hiểu flat để chuyển đúng: `files` glob thay overrides, `globals` tường minh thay `env`, `...configs.recommended` spread thay extends, ESM import thay JSON.

**Khác biệt nhớ 4 cái:** (1) mảng config áp theo `files` (không merge ngầm); (2) không `env: { browser }` — dùng `globals.browser`; (3) `ignores` ngay trong config (không `.eslintignore` riêng); (4) `FlatCompat` để chuyển dần dự án cũ thay vì viết lại một đêm.

### 2. Cài và bật `eslint-plugin-react-hooks` v6 gồm Compiler rules

**Vì sao:** v6 gộp rules Compiler (`immutability`, `purity`, `preserve-manual-memoization`...) ngoài `rules-of-hooks`/`exhaustive-deps`. React Compiler tự memo nên code phải sạch — mutate là compiler skip (mất tối ưu) hoặc sai. Plugin bắt mutate/deps sai ngay lúc gõ (đỏ dưới dòng) thay vì đợi build log.

### 3. Tích hợp lint vào pre-commit (lint-staged) và CI với `--max-warnings=0`

**Vì sao:** lint không chặn commit/CI thì chỉ là gợi ý — nợ tích dần. `lint-staged` (`eslint --fix` file staged) giữ mỗi commit sạch mà không chậm (không lint cả repo). CI `--max-warnings=0` biến warning thành lỗi — chuẩn minh bạch, không "warning kệ đi".

## Tổng quan

- ESLint 9+ mặc định **flat config**: một file `eslint.config.js` (ESM), cấu hình là mảng object, không còn `extends`, không còn `env`, dùng `globals` tường minh. `.eslintrc.*` không đọc nữa — phải chuyển.
- `eslint-plugin-react-hooks` v6 (2025+) gộp luôn rules của **React Compiler**: ngoài `rules-of-hooks`/`exhaustive-deps` còn `immutability` (không mutate props/state), `purity`, `preserve-manual-memoization`, `ensure-custom-hooks-using-other-hooks`… Code vi phạm là compiler bỏ qua component đó.
- Áp dụng mọi dự án React + TS; thay hẳn `.eslintrc.*` khi upgrade ESLint. Dự án cũ dùng `FlatCompat` chuyển dần.

## Khái niệm cốt lõi

### 1. Flat khác legacy — mảng + files + globals + ignores trong một file

```js
// ✅ ĐÚNG (flat): mảng, files glob, globals tường minh, ignores chung
export default tseslint.config(
  { ignores: ['dist', 'coverage'] }, // thay .eslintignore
  js.configs.recommended,
  ...tseslint.configs.recommended,
  { files: ['**/*.{ts,tsx}'], languageOptions: { globals: { ...globals.browser } } },
);
```

Legacy (`extends: ['airbnb']`, `env: { browser: true }`, `.eslintrc.json`) không chạy ở ESLint 9 mặc định — hoặc chuyển flat, hoặc `FlatCompat` bọc cũ trong mới tạm.

### 2. Compiler rules — code sạch để compiler không skip

Mutate props/state, side-effect ở render (fetch/random/Date.now), hook điều kiện — compiler skip component đó (đúng nhưng chậm). Plugin báo ngay lúc gõ để sửa trước khi build. Đây là lý do v6 quan trọng hơn v5: không chỉ "đúng hooks" mà "đủ sạch cho compiler".

```tsx
// ❌ SAI: mutate props — immutability đỏ + compiler skip
function Row({ item }: any) { item.ten = item.ten.trim(); return <li>{item.ten}</li>; }
// ✅ ĐÚNG: thuần — xanh + compiler cache được
function Row({ item }: any) { const ten = item.ten.trim(); return <li>{ten}</li>; }
```

### 3. `flat.recommended` — preset bật rules-of-hooks + exhaustive-deps + compiler

Một spread là đủ (`...reactHooks.configs.flat.recommended.rules`), không bật tay từng rule rồi sót compiler rules (bệnh "chỉ exhaustive-deps mà mutate vẫn xanh").

### 4. `react-refresh/only-export-components` — giữ HMR không gãy

File component export lẫn component + const/helper không phải component → Fast Refresh reload trắng. Rule này warn để tách helper ra file khác. Rất hữu ích mà hay bị tắt nhầm.

### 5. lint-staged + `--max-warnings=0` — chặn từ commit tới CI

Pre-commit `--fix` file staged (nhanh, không sửa file không staged). CI `--max-warnings=0` (warning cũng đỏ). Thiếu một là lọt: không staged thì commit bẩn; không max-warnings thì CI xanh dù vàng khè.

## Luồng hoạt động / Cách áp dụng

### Bước 1. Cài 5 gói

`eslint`, `@eslint/js`, `typescript-eslint`, `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh` (+ `eslint-plugin-react` nếu cần `jsx-*`, `globals`, `eslint-plugin-jsx-a11y` cho a11y).

### Bước 2. Tạo `eslint.config.js` như Ví dụ chi tiết, ignored `dist/node_modules/coverage`

Chạy `npx eslint .` — sửa đỏ. `react/jsx-*` thêm từ `eslint-plugin-react` nếu cần (preset react chưa đủ).

### Bước 3. Script `lint: eslint . --max-warnings=0`

Warning cũng fail — giữ chuẩn. Chạy local trước khi đẩy để không đỏ CI.

### Bước 4. lint-staged pre-commit `--fix` file staged

```json
// .lintstagedrc.json — chỉ file staged, nhanh, không đụng file khác
{ "*.{ts,tsx,js,mjs}": ["eslint --fix", "prettier --write"] }
```

### Bước 5. CI chạy lint (song song type/test)

Đỏ là block merge. Dự án cũ còn `.eslintrc` thì `FlatCompat` chuyển dần từng thư mục, không big-bang.

## Ví dụ chi tiết

Mirror đầy đủ (config + code sạch + scripts), khớp `example.tsx` cùng thư mục:

```js
// eslint.config.js — flat config chuẩn React 19 + TS (ESLint 9/10)
import js from '@eslint/js'; // rules JS cơ bản (no-undef, no-unused...)
import globals from 'globals'; // preset môi trường (browser/node) thay env cũ
import tseslint from 'typescript-eslint'; // rules TS + gộp config flat chuẩn
import reactHooks from 'eslint-plugin-react-hooks'; // v6: hooks + Compiler rules
import reactRefresh from 'eslint-plugin-react-refresh'; // giữ HMR không gãy
import react from 'eslint-plugin-react'; // rules jsx-* (cần thì thêm)

export default tseslint.config(
  { ignores: ['dist', 'coverage'] }, // bỏ qua build/coverage — thay .eslintignore
  js.configs.recommended, // rules JS cơ bản — nền cho mọi file
  ...tseslint.configs.recommended, // rules TS (+ type-aware nếu cấu hình projectService)
  {
    files: ['**/*.{ts,tsx}'], // chỉ áp TS/TSX — test/config khác có thể block riêng
    languageOptions: {
      globals: { ...globals.browser }, // window/document hợp lệ — thay env: { browser: true } cũ (thiếu là no-undef)
      parserOptions: { ecmaFeatures: { jsx: true } }, // parse JSX trong TSX
    },
    plugins: {
      react, // jsx rules — cần settings version dưới
      'react-hooks': reactHooks, // hooks + compiler rules
      'react-refresh': reactRefresh, // HMR guard
    },
    settings: { react: { version: '19' } }, // để rules jsx biết version (sai version là báo sai)
    rules: {
      // v6: rules-of-hooks + exhaustive-deps + Compiler (immutability, purity...) — bật cả, không chỉ exhaustive-deps
      ...reactHooks.configs.flat.recommended.rules,
      'react/react-in-jsx-scope': 'off', // React 17+ không cần import React — tắt để không báo thừa
      'react/jsx-uses-react': 'off', // cùng lý do trên
      // Chặn export lẫn lộn làm gãy HMR (component + helper chung file) — warn để tách file
      'react-refresh/only-export-components': 'warn',
    },
  },
);
```

```tsx
// example.tsx — mirror đầy đủ, khớp từng dòng với file thật
// Đoạn code "sạch" qua được react-hooks v6: deps đủ, không mutate, không hook điều kiện
import { useEffect, useState } from 'react';

export function Greeter({ name }: { name: string }) {
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    // ✅ không mutate props (không gán name = ...), deps đủ ([name]) — thiếu là exhaustive-deps đỏ
    // Vì sao effect ở đây: dẫn xuất từ props đồng bộ sau render — deps [name] để đổi tên là cập nhật
    setGreeting(`Xin chào, ${name}!`);
  }, [name]); // deps đủ — bỏ [name] là stale (tên mới mà chào tên cũ)

  return <p>{greeting}</p>;
}
```

```bash
# script package.json / CI — lỗi CI nếu còn bất kỳ warning (chuẩn minh bạch)
npx eslint . --max-warnings=0
```

```json
// .lintstagedrc.json — tự sửa file staged trước commit (nhanh, không lint cả repo)
{ "*.{ts,tsx,js,mjs}": ["eslint --fix", "prettier --write"] }
```

## Giải thích từng phần

### `tseslint.config(...)` — gộp chuẩn typescript-eslint trên flat

Xử lý thứ tự + merge đúng (tự nối mảng mà spread tay dễ sai). Type-aware rules (cần `projectService`) thì thêm ở block riêng cho `**/*.{ts,tsx}` có type info.

### `...flat.recommended.rules` — bật cả compiler, không chỉ deps

Chỉ `exhaustive-deps` mà bỏ compiler là mutate vẫn xanh, build mới skip. Spread preset v6 là đủ cả hai họ.

### `globals.browser` — thay `env` cũ

Thiếu là `window`/`document` báo `no-undef` dù code đúng. Node script cần thêm `globals.node` ở block riêng (`**/*.config.*`).

### `only-export-components: 'warn'` — tách helper khỏi file component

File component chỉ export component (hoặc const không phải component theo convention). Helper lẫn vào → tách `utils.ts` cạnh đó. HMR hết reload trắng.

### `--max-warnings=0` — vàng cũng đỏ

Không có là warning tích dần thành nợ ("để sau"). Có là mỗi PR phải xanh thật.

## Lỗi thường gặp / Chống chỉ định

### 1. Giữ `.eslintrc` lên ESLint 9 → config không đọc

Chuyển `eslint.config.js` hoặc `FlatCompat` bọc cũ tạm. Kiểm tra: `npx eslint --inspect-config` xem rules áp thật không.

### 2. "React must be in scope" ở React 17+ → tắt 2 rules jsx scope

`react-in-jsx-scope` + `jsx-uses-react` off như config trên (JSX transform mới không cần import React).

### 3. Chỉ exhaustive-deps, bỏ compiler → mutate xanh mà build skip

Bật cả `flat.recommended` như trên. Test: viết `props.x = 1` phải đỏ `immutability` — không đỏ là thiếu rules.

### 4. Thiếu `globals.browser` → `window` no-undef

Khai như config trên. File test (vitest globals `describe/it`) thêm `globals` tương ứng hoặc `env` test.

### 5. `--fix` cả repo ở pre-commit → chậm + sửa file không staged

Chỉ file staged qua lint-staged như trên. Fix cả repo để vào script tay (`lint:fix`) chạy khi cần, không phải hook.

## Best practices / Mẹo

### Deps đúng + không mutate + Prettier riêng + a11y cùng config + FlatCompat chuyển dần

`useMemo`/`useCallback` deps đúng để exhaustive-deps xanh và compiler bớt việc. `push` trực tiếp state là mùi — review `immutability` khi thêm lib mutate mảng. Prettier lo format, ESLint lo logic — không để hai ông giành nhau (tắt rules format trùng). `jsx-a11y` vào cùng flat (xem nhóm 8). Dự án cũ `FlatCompat` từng thư mục, xanh dần, không big-bang.

## Bài tập nhỏ

1. Cài devDeps + tạo `eslint.config.js` như mẫu.
2. Viết 3 file vi phạm: (a) hook trong loop/điều kiện → `rules-of-hooks` đỏ; (b) `props.list.push(x)` → `immutability` đỏ; (c) effect dùng `name` mà deps `[]` → `exhaustive-deps` đỏ.
3. Chạy `npx eslint .` — ghi lỗi từng rule + cách sửa (nâng điều kiện ra ngoài/tách hook; spread copy; thêm deps).
4. Thêm lint-staged + `--max-warnings=0`, commit thử file vi phạm để thấy hook chặn.

## Reference

- [ESLint — Configuration Files (flat)](https://eslint.org/docs/latest/use/configure/configuration-files)
- [eslint-plugin-react-hooks](https://react.dev/reference/eslint-plugin-react-hooks)
- [React Compiler rules — eslint](https://react.dev/learn/react-compiler/rules)
- [typescript-eslint](https://typescript-eslint.io/)
