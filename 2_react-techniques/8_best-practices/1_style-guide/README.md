# Style Guide (React 19 + Compiler)

> Nguồn: https://react.dev/learn — https://github.com/airbnb/javascript/tree/master/react

## Mục tiêu
- Có bộ quy tắc đặt tên + cấu trúc file thống nhất cho cả team và AI sinh code.
- Viết code "Compiler-safe": không mutate props/state, deps hooks đầy đủ.
- Biết nền tảng Airbnb và phần nào đã lỗi thời với React 19.

## Tổng quan
- Style guide không phải để "đẹp" mà để **nhất quán**: review nhanh, AI bắt chước đúng, ít tranh cãi.
- React 19 thay đổi vài thói quen cũ (bỏ `defaultProps`, `forwardRef` không cần, function-first).
- Áp dụng từ ngày đầu dự án; gắn với lint (bài 6/2) để tự động hóa thay vì nhắc nhở bằng mồm.

## Khái niệm cốt lõi
- **Function-first**: tất cả component là function; chỉ Error Boundary cần class (vì `getDerivedStateFromError` chưa có hook tương đương).
- **Naming**: `PascalCase.tsx` cho component, `useX.ts` cho hook, `kebab-case` cho folder feature; type/interface `PascalCase` (không prefix `I`).
- **Props**: `type Props = {...}` inline; default qua destructuring, **không** `defaultProps` (bỏ từ React 19 với function component).
- **Immutability**: không sửa props/state trực tiếp (`items.push`, `user.name = ...`); tạo bản mới (`[...items, x]`) — vừa đúng React vừa để **React Compiler** memoize được.
- **Deps hooks đầy đủ**: eslint `react-hooks/exhaustive-deps` (v6) là nguồn sự thật.
- **Import order**: react → thư viện ngoài → internal (`@/`) → relative; nhóm cách nhau dấu cách.
- **File layout**: 1 component/1 file; barrel `index.ts` chỉ ở `shared/ui` (tránh lạm dụng gây phình bundle).

## Luồng hoạt động / Cách áp dụng
1. Chốt quy ước trong `CONTRIBUTING.md` / `AGENTS.md`.
2. Cấu hình lint để enforce tự động (react-hooks v6, typescript-eslint, jsx-a11y).
3. Đặt template component (snippet) để mọi người tạo đúng cấu trúc.
4. Review theo checklist ngắn; vi phạm → sửa, không tranh luận phong cách.
5. Với AI: đính kèm file mẫu chuẩn (few-shot) + `AGENTS.md`.

## Ví dụ chi tiết
```tsx
// Badge.tsx — chuẩn: PascalCase file, props typed, default qua destructuring
export type BadgeProps = {
  text: string;
  tone?: 'info' | 'success' | 'danger';
};

export function Badge({ text, tone = 'info' }: BadgeProps) {
  // Bảng tone tách riêng, as const để suy ra literal type
  const tones = {
    info: 'bg-blue-100 text-blue-800',
    success: 'bg-green-100 text-green-800',
    danger: 'bg-red-100 text-red-800',
  } as const;
  return <span className={`rounded px-2 py-0.5 text-xs ${tones[tone]}`}>{text}</span>;
}
```

```tsx
// ❌ Tránh — các pattern lỗi thời/có hại
// import React, { Component } from 'react';
// class UserCard extends Component { ... }        // class (chỉ còn cho Error Boundary)
// UserCard.defaultProps = { tone: 'info' };       // bỏ từ React 19 với function component
// items.push(newItem);                            // mutate state → React không re-render/Compiler skip
// function Component() { if (x) useMemo(...) }    // hook có điều kiện — vi phạm rules-of-hooks
```

```tsx
// UserCard.tsx — ref như prop thường (React 19), không forwardRef
export type UserCardProps = {
  user: { id: number; name: string };
  onSelect: (id: number) => void;
  ref?: React.Ref<HTMLButtonElement>;
};

export function UserCard({ user, onSelect, ref }: UserCardProps) {
  return (
    <button ref={ref} type="button" onClick={() => onSelect(user.id)}>
      {user.name}
    </button>
  );
}
```

```ts
// hooks/useToggle.ts — PascalCase cho hook, file useX.ts
import { useCallback, useState } from 'react';

export function useToggle(initial = false): [boolean, () => void] {
  const [on, setOn] = useState(initial);
  // useCallback để hàm ổn định (an toàn khi truyền xuống con)
  const toggle = useCallback(() => setOn((v) => !v), []);
  return [on, toggle];
}
```

## Giải thích từng phần
- `tone = 'info'`: default qua destructuring — đọc ngay ở signature, khác `defaultProps`.
- `as const`: giữ literal type cho `tones`, tránh `string` chung chung.
- `ref?: React.Ref<...>` + `<button ref={ref}>`: pattern React 19 chuẩn.
- `setOn((v) => !v)`: functional update, không phụ thuộc giá trị mới, deps `[]` an toàn.
- Comment "❌ Tránh" minh họa cụ thể những gì cần loại bỏ.
- `as const` + `tones[tone]`: vừa gọn vừa type-safe, tránh chuỗi điều kiện `if/else` dài.

### Gợi ý cấu trúc thư mục
```text
src/
  app/            # composition root: router, providers, layout
  features/       # theo domain: features/cart/ui, model, api
  shared/         # dùng chung: ui, lib, hooks, config
  pages/          # (tùy chọn) ghép feature theo route
```

## Lỗi thường gặp / Chống chỉ định
- **Dùng `defaultProps`/`propTypes`**: lỗi thời với function component → default trong destructuring; type do TS lo.
- **Mutate props/state** (`props.items.sort()`): không re-render + React Compiler bỏ qua component → tạo bản copy (`[...items].sort()`).
- **Hook có điều kiện / đặt tên sai**: `rules-of-hooks` báo → gọi hook vô điều kiện ở đỉnh component.
- **Prefix `I` cho interface** (`IUserProps`): lệch cộng đồng; dùng `UserProps`.
- **Barrel import khắp nơi**: phình bundle, vòng lặp import → chỉ dùng cho `shared/ui`, import trực tiếp phần khác.

## Best practices / Mẹo
- Một component/1 file, tên file khớp tên component (dễ tìm, dễ AI sinh).
- Giữ thứ tự import cố định — có thể tự động bằng ESLint `import/order`.
- Viết hook nhỏ, mỗi hook một nhiệm vụ; tên bắt đầu bằng `use`.
- Ưu tiên `type` cho props, `interface` chỉ khi cần mở rộng.
- Khi bất đồng phong cách: chạy Prettier/ESLint, không tranh luận.
- Đồng bộ với Angular-style guide (bài đối chiếu): cùng triết lý "one-file-one-thing", khác cú pháp.

## Bài tập nhỏ
Refactor một component lộn xộn theo chuẩn: tách type ra `export type`, thay `defaultProps` bằng destructuring, dời hook lên đỉnh, sửa `items.push` thành immutable, và đổi tên file/hook cho đúng quy ước. Chạy `eslint` xác nhận sạch.

## Reference
- [Airbnb React Style Guide](https://github.com/airbnb/javascript/tree/master/react)
- [React — Describing the UI](https://react.dev/learn/describing-the-ui)
- [React 19 — ref as a prop](https://react.dev/blog/2024/12/05/react-19)
- [React Compiler rules](https://react.dev/learn/react-compiler/rules)