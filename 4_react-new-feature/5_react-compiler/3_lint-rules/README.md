# 3. ESLint Rules cho React Compiler

## Mô tả

React Compiler 1.0 (**stable 10/2025**) **skip** (bỏ qua) component vi phạm Rules of React mà **không làm vỡ build**. Điều này tiện nhưng nguy hiểm: bạn tưởng code đã được tối ưu, thực tế compiler đã bỏ qua nó.

Các **compiler-powered lint rules** nay được ship trong **`eslint-plugin-react-hooks` v6** (preset `recommended` / `recommended-latest`). Plugin cũ **`eslint-plugin-react-compiler`** đang được **migrate sang `eslint-plugin-react-hooks`**; cả hai vẫn tồn tại, nhưng khuyến nghị dùng `eslint-plugin-react-hooks@6`.

## Mục tiêu

- Cấu hình ESLint để phát hiện code không compile-safe **ngay trong IDE/CI**.
- Nhận diện các lỗi phổ biến: mutate prop, hook có điều kiện, non-reactive read.
- Phân biệt plugin mới (`eslint-plugin-react-hooks@6`) và plugin cũ (`eslint-plugin-react-compiler`).

## Vấn đề giải quyết

Vì compiler **skip lặng lẽ** khi gặp code vi phạm, nếu chỉ dựa vào việc "build thành công" bạn sẽ không biết mình đang *không* được tối ưu. Cần một lớp kiểm tra tĩnh:

- Bắt lỗi khi **đang viết** code (gạch đỏ trong IDE), không đợi build.
- Chặn ở **CI/pre-commit** để không lọt code skip-compiler vào repo.
- Đưa ra **gợi ý sửa** cụ thể cho từng vi phạm Rules of React.

## Khái niệm cốt lõi

Các rule này không phải rule style thông thường — chúng dùng chính logic phân tích của compiler. Nghĩa là: **thứ gì compiler sẽ skip, lint sẽ báo**. Nhờ vậy lint là "cửa ngõ" đảm bảo tối ưu thực sự diễn ra.

Hai plugin:

- **`eslint-plugin-react-hooks` v6** — khuyến nghị; preset `recommended` / `recommended-latest` chứa rule compiler-powered.
- **`eslint-plugin-react-compiler`** — đang migrate; rule `react-compiler/react-compiler`, sẽ chuyển dần sang plugin hooks.

Một số cảnh báo điển hình:

- `Mutating a value returned from a function` / "do not mutate props".
- `React Hook called conditionally` / `React Hook "useState" is called in a callback`.
- "Non-reactive read" — đọc `ref.current` hoặc biến ngoài trong render.

## Cú pháp / API

### Cài đặt

```bash
# Khuyến nghị: plugin hooks v6+ (đã bao gồm compiler-powered rules)
npm i -D eslint-plugin-react-hooks@^6

# (tùy chọn) plugin cũ nếu bạn đang trong giai đoạn migrate
npm i -D eslint-plugin-react-compiler
```

### Cấu hình khuyến nghị (flat config) — `eslint-plugin-react-hooks@6+`

Cách gọn nhất là dùng preset có sẵn. `recommended` bật bộ rule ổn định;
`recommended-latest` bật thêm các rule compiler còn mới:

```js
// eslint.config.js
import reactHooks from 'eslint-plugin-react-hooks';
import { defineConfig } from 'eslint/config';
// Preset bật toàn bộ compiler-powered rules
export default defineConfig([reactHooks.configs.flat['recommended-latest']]);
```

Hoặc bật từng rule compiler cụ thể:

```js
// eslint.config.js
import reactHooks from 'eslint-plugin-react-hooks';
export default [{
  plugins: { 'react-hooks': reactHooks },
  rules: {
    'react-hooks/immutability': 'error', // không mutate props/state/render inputs
    'react-hooks/purity': 'error',       // render thuần, không side-effect
    'react-hooks/refs': 'error',         // không đọc/ghi ref trong render
    'react-hooks/rules-of-hooks': 'error',
  },
}];
```

### Cấu hình plugin cũ (đang migrate)

```js
// eslint.config.js
import reactCompiler from 'eslint-plugin-react-compiler';
export default [{
  plugins: { 'react-compiler': reactCompiler },
  rules: { 'react-compiler/react-compiler': 'error' },
}];
```

Chạy: `npx eslint .`. Lưu ý: các rule compiler trong `eslint-plugin-react-hooks` có tên riêng
(`react-hooks/immutability`, `react-hooks/purity`, `react-hooks/refs`,
`react-hooks/static-components`...), không phải một rule `react-compiler` duy nhất.

## Luồng hoạt động (Flow)

1. Cài `eslint-plugin-react-hooks@6` (khuyến nghị) và/hoặc `eslint-plugin-react-compiler`.
2. Thêm plugin + bật rule ở mức `error` trong `eslint.config.js`.
3. ESLint phân tích từng file bằng logic tương tự compiler.
4. Vi phạm Rules of React ⇒ báo lỗi kèm gợi ý sửa.
5. Chạy trong IDE (gạch đỏ tức thì) và trong CI/pre-commit.
6. Sửa lỗi ⇒ component được compiler tối ưu thật sự.

## Ví dụ chi tiết

Xem [`example.tsx`](example.tsx). Ba pattern lint sẽ bắt, kèm cách sửa:

```tsx
// eslint-plugin-react-compiler: 'error'  (khuyến nghị: eslint-plugin-react-hooks@6)
// 3 pattern dưới đây lint sẽ báo — kèm cách sửa.

import { useRef, useState } from 'react';

// ❌ 1. Mutate prop trong render → lint: do not mutate
export function BadMutate({ tags }: { tags: string[] }) {
  // @ts-expect-error minh họa
  tags.sort(); // SỬA: [...tags].sort()  (tạo bản sao rồi sort)
  return <p>{tags.join(', ')}</p>;
}

// ❌ 2. Hook có điều kiện → lint: hook called conditionally
export function BadHook({ enabled }: { enabled: boolean }) {
  const [count, setCount] = useState(0);
  // @ts-expect-error minh họa
  if (enabled) {
    // const [x] = useState(0); // SAI — hook trong if
    // SỬA: gọi useState ở top-level, dùng biến `enabled` trong thân hàm.
  }
  return <button onClick={() => setCount(count + 1)}>Count {count}</button>;
}

// ❌ 3. Đọc ref.current trong render → lint: non-reactive read
export function BadRefRead() {
  const ref = useRef(0);
  // const label = ref.current > 0 ? 'dương' : 'không'; // SAI trong render
  // SỬA: đọc ref trong event/effect; render dùng state.
  return (
    <button onClick={() => { ref.current += 1; }}>Tăng ref ({ref.current})</button>
  );
}

// ✅ Bản sửa gộp — lint pass, Compiler memoize được:
export function Good({ tags }: { tags: string[] }) {
  const sorted = [...tags].sort();      // copy, không mutate props
  const [count, setCount] = useState(0); // hook ở top-level
  return (
    <div>
      <p>{sorted.join(', ')}</p>
      <button onClick={() => setCount(count + 1)}>Count {count}</button>
    </div>
  );
}
```

## Giải thích từng phần

- **`BadMutate` — `tags.sort()`** — `.sort()` sửa mảng tại chỗ, tức mutate props. Lint báo "do not mutate". Sửa bằng `[...tags].sort()` để sort trên bản sao.
- **`BadHook`** — đặt `useState` bên trong `if` phá vỡ thứ tự hook cố định giữa các lần render. Lint báo "hook called conditionally". Sửa: kéo hook lên top-level.
- **`BadRefRead`** — đọc `ref.current` trong render là non-reactive read: giá trị này đổi mà không trigger render. Lint cảnh báo. Sửa: đọc ref trong handler/effect, dùng state cho giá trị hiển thị.
- **`Good`** — gộp mọi cách sửa: copy trước khi sort, hook top-level, không đọc ref trong render. Lint pass ⇒ compiler chắc chắn tối ưu.

## So sánh với cách làm cũ

| Cách cũ | Cách mới | Lợi ích |
|---------|----------|---------|
| Chỉ biết component bị skip khi đọc log build | Lint báo ngay trong IDE | Phát hiện sớm, sửa tức thì |
| `eslint-plugin-react-compiler` riêng lẻ | `eslint-plugin-react-hooks@6` gộp compiler rules | Một plugin, đồng bộ với rules-of-hooks |
| Dựa vào trí nhớ về Rules of React | Rule tự động dùng logic compiler | Không bỏ sót vi phạm |
| Không có tầng chặn ở CI | Rule `error` + CI/pre-commit | Không lọt code skip-compiler |

## Lỗi thường gặp

1. **Cài plugin nhưng quên bật rule** ⇒ không có cảnh báo nào. *Fix:* thêm rule vào `rules` và đặt `'error'`.
2. **Tưởng phải cài React Compiler mới lint được** ⇒ bỏ qua lint vì chưa bật compiler. *Fix:* theo blog 1.0, `eslint-plugin-react-hooks` **không cần** cài compiler vẫn chạy — cứ bật lint ngay để soi Rules of React.
3. **Đặt `warn` rồi bỏ qua** suốt thời gian dài ⇒ code skip-compiler tích tụ. *Fix:* code mới để `error`, code cũ `warn` rồi nâng dần.
4. **Disable rule không lý do** (`// eslint-disable-next-line`) ⇒ che mất vấn đề. *Fix:* nếu là interop thư viện mutable, dùng `"use no memo"` + comment giải thích.
5. **Quên chạy lint ở CI** ⇒ chỉ dev có IDE mới thấy. *Fix:* thêm `eslint .` vào pipeline và pre-commit hook.

## Khi nào dùng / Khi nào không

**Nên dùng:**
- **Code mới**: bật ở mức `error` — đảm bảo mọi component mới đều compile-safe.
- **Code cũ**: bắt đầu `warn`, đo số vi phạm, sửa dần rồi nâng lên `error`.
- **CI/pre-commit**: bắt buộc, để không lọt code skip-compiler.

**Cân nhắc:**
- File interop thư viện mutable thật sự không sửa được ⇒ dùng `"use no memo"` + disable rule **cục bộ kèm comment lý do**, đừng disable toàn repo.
- Với plugin cũ `eslint-plugin-react-compiler`, hãy lên kế hoạch migrate sang `eslint-plugin-react-hooks@6`.

## Bài tập nhỏ

Cấu hình ESLint với `eslint-plugin-react-hooks@6` ở `error`, rồi cố tình viết ba component vi phạm (mutate prop, hook trong `if`, đọc `ref.current` trong render). Quan sát thông báo lint, sửa từng cái cho tới khi sạch, và ghi lại tên rule tương ứng mỗi vi phạm.

## Reference

- [eslint-plugin-react-hooks (npm)](https://www.npmjs.com/package/eslint-plugin-react-hooks)
- [eslint-plugin-react-compiler (npm, đang migrate)](https://www.npmjs.com/package/eslint-plugin-react-compiler)
- [React Compiler docs](https://react.dev/learn/react-compiler)
- [Rules of React](https://react.dev/reference/rules)
