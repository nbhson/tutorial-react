# Tailwind CSS v4 + React

> Nguồn: https://tailwindcss.com/docs/installation/using-vite — https://tailwindcss.com/docs/functions-and-directives

## Mục tiêu
- Nắm cách tích hợp Tailwind v4 với Vite (plugin `@tailwindcss/vite`, config bằng CSS).
- Tùy biến theme qua `@theme`, dark mode bằng `@custom-variant`, utility tùy chỉnh bằng `@utility`.
- Gộp class điều kiện không xung đột bằng `cn()` (clsx + tailwind-merge).

## Tổng quan
- Tailwind v4 không còn `tailwind.config.js` — **CSS-first configuration**: mọi khi báo qua `@theme` ngay trong CSS.
- Build nhanh hơn nhiều nhờ engine Oxide (Rust) scan class và sinh CSS theo nhu cầu.
- Cài qua `@tailwindcss/vite`, khai báo một dòng `@import "tailwindcss";` trong CSS entry.
- Áp dụng mọi dự án React cần utility CSS nhanh, responsive, dark mode; v4 hỗ trợ tốt React 19 + Vite 7.

## Khái niệm cốt lõi
- **`@import "tailwindcss"`**: thay thế cả `@tailwind base; @tailwind components; @tailwind utilities;` của v3.
- **`@theme`**: định nghĩa design token → sinh utility. `--color-brand: #4f46e5` → class `bg-brand`, `text-brand`... Tên biến quyết định tên class.
- **`@theme inline`**: khi cần giá trị reference sang variable khác (`--color-primary: var(--color-brand)`).
- **`@custom-variant dark`**: v4 dark mode mặc định theo `prefers-color-scheme`; muốn toggle class dùng `@custom-variant dark (&:where(.dark, .dark *));`.
- **`@utility`**: tạo utility riêng có chạy khi cần (khác `@layer utilities` luôn thêm).
- **`@source`**: nói cho scanner biết đâu có class (bao gồm các file ngoài `src`) — v4 tự scan nhưng đôi khi cần khai thêm.
- **`cn()`**: `twMerge(clsx(...))` — `clsx` gộp điều kiện, `tailwind-merge` loại class trùng lệnh (`bg-brand` + `bg-gray-100` cùng lúc → giữ class sau).
- **không chuỗi**: v4 dùng CSS (không JS runtime) → toàn bộ config đọc được từ `.css`.

## Luồng hoạt động / Cách áp dụng
1. Cài: `npm i tailwindcss @tailwindcss/vite`.
2. `vite.config.ts`: thêm plugin `tailwindcss()`.
3. CSS entry (`src/index.css`): `@import "tailwindcss";` + `@theme` tùy chỉnh.
4. Import `index.css` trong `main.tsx` (hoặc App).
5. Dùng class trực tiếp; tạo `cn()` helper cho class điều kiện.
6. Nếu dùng dark-mode toggle: thêm `@custom-variant dark`.

## Ví dụ chi tiết
```css
/* src/index.css — CSS-first config, không cần tailwind.config.js */
@import "tailwindcss";

/* Design token → sinh utility Brand (--color-brand → bg-brand/text-brand...) */
@theme {
  --color-brand: #4f46e5;
  --color-brand-dark: #4338ca;
  --font-display: "Inter", sans-serif; /* → font-display */
  --shadow-pop: 0 10px 30px rgb(0 0 0 / 0.1); /* → shadow-pop */
}

/* Dark mode bằng class .dark ở <html> */
@custom-variant dark (&:where(.dark, .dark *));

/* Utility riêng chỉ sinh khi được dùng */
@utility text-balance {
  text-wrap: balance;
}
```

```tsx
// src/main.tsx — nạp CSS đã khai báo Tailwind
import './index.css';
```

```tsx
// cn() helper + Button đa variant — class không đá nhau nhờ tailwind-merge
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const cn = (...xs: ClassValue[]) => twMerge(clsx(xs));

type Props = {
  variant?: 'primary' | 'ghost';
  children: React.ReactNode;
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

export function Button({ variant = 'primary', children, className, ...rest }: Props) {
  return (
    <button
      {...rest}
      className={cn(
        // Class nền + trạng thái
        'rounded-lg px-4 py-2 text-sm font-medium transition-colors',
        'focus-visible:outline-2 focus-visible:outline-offset-2',
        variant === 'primary'
          ? 'bg-brand text-white hover:opacity-90'   // brand từ @theme
          : 'bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800',
        className, // từ caller — twMerge ưu tiên class ở đây nếu trùng lệnh
      )}
    >
      {children}
    </button>
  );
}
```

```ts
// vite.config.ts — thêm plugin Tailwind v4
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
});
```

## Giải thích từng phần
- `@theme { --color-brand: #4f46e5 }`: khai 1 biến → hàng loạt utility `bg-brand`, `border-brand`, `text-brand`, `ring-brand`...
- `@custom-variant dark`: bật dark mode theo class; toggle `document.documentElement.classList.toggle('dark')`.
- `@utility text-balance`: utility mới, tree-shaken (chỉ xuất hiện khi dùng).
- `cn()`: `clsx` gộp 2 danh sách (layout + variant + truyền vào), `twMerge` loại class mâu thuẫn để `className` ngoài thắng.
- `dark:hover:bg-gray-800`: kết hợp variant dark + hover.

## Lỗi thường gặp / Chống chỉ định
- **Giữ file `tailwind.config.js` với cú pháp cũ**: v4 không đọc nữa → chuyển hết config vào `@theme`; chỉ giữ file nếu dùng `@config` cho code cũ.
- **Thiếu `@import "tailwindcss"`**: class không sinh CSS → khai đúng CSS entry và đảm bảo import trong `main.tsx`.
- **`@custom-variant dark` sai cú pháp**: dark mode không hoạt động theo class → dùng form `(&:where(.dark, .dark *))`.
- **Không dùng `twMerge`**: `'bg-brand'` + `className="bg-red-500"` giữ cả 2, CSS không đoán được → `cn()` giải quyết.
- **Scanner bỏ sót file ngoài `src`** (ví dụ file trong thư mục khác): class bị mất → thêm `@source '../shared/**'`.

## Best practices / Mẹo
- Khai toàn bộ design token trong `@theme` — thống nhất màu/font/shadow toàn dự án.
- Dùng `cn()` cho mọi component nhận `className`; đặt tên variant rõ ràng.
- Tận dụng variant mới v4: `@container`, `text-shadow-*`, `mask-*`.
- Có thể dùng Prettier plugin `prettier-plugin-tailwindcss` để sắp xếp class ổn định.
- Đo CSS output: v4 tự purge nên bundle CSS rất nhỏ nếu không lạm dụng `safelist`.

## Bài tập nhỏ
Thêm token `--color-danger: #dc2626` và tạo variant `danger` cho `Button` (nền đỏ, hover đậm hơn). Thêm utility `@utility line-clamp-3` (dùng `-webkit-line-clamp`) và dùng cho một card mô tả dài.

## Reference
- [Tailwind CSS + Vite](https://tailwindcss.com/docs/installation/using-vite)
- [Tailwind — Functions and Directives](https://tailwindcss.com/docs/functions-and-directives)
- [Tailwind — Theme](https://tailwindcss.com/docs/theme)
- [tailwind-merge](https://github.com/dcastil/tailwind-merge)