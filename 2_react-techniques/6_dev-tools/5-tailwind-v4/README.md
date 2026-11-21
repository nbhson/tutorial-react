# Tailwind CSS v4 + React

> Nguồn: https://tailwindcss.com/docs/installation/using-vite — https://tailwindcss.com/docs/functions-and-directives

## Mục tiêu
- Nắm cách tích hợp Tailwind v4 với Vite (plugin `@tailwindcss/vite`, config bằng CSS).
- Tùy biến theme qua `@theme`, dark mode bằng `@custom-variant`, utility tùy chỉnh bằng `@utility`.
- Gộp class điều kiện không xung đột bằng `cn()` (clsx + tailwind-merge).

## Tổng quan

Mục này phác làn da mới của Tailwind v4 trước khi đi chi tiết directive: đọc để hiểu vì sao v4 "không còn file config".

- Tailwind v4 không còn `tailwind.config.js` — **CSS-first configuration**: mọi khi báo qua `@theme` ngay trong CSS. Ví von: v3 như khai báo nguyên liệu ở quầy lễ tân (file JS riêng), v4 là ghi chú ngay trong bếp (CSS) — đầu bếp nhìn thấy liền, khỏi đi hỏi ai.
- Build nhanh hơn nhiều nhờ engine Oxide (Rust) scan class và sinh CSS theo nhu cầu.
- Cài qua `@tailwindcss/vite`, khai báo một dòng `@import "tailwindcss";` trong CSS entry.
- Áp dụng mọi dự án React cần utility CSS nhanh, responsive, dark mode; v4 hỗ trợ tốt React 19 + Vite 7.

> **Tóm gọn 1 câu:** Tailwind v4 = config sống ngay trong CSS: `@theme` sinh utility, `@custom-variant` lo dark mode, `cn()` gom class không xung đột.

## Khái niệm cốt lõi

Mục này giải nghĩa từng directive mới của v4: `@import` thay 3 dòng `@tailwind`, `@theme` sinh class từ biến, `@custom-variant`, `@utility`, `@source`, và helper `cn()`. Đọc để "đọc hiểu" mọi file CSS Tailwind v4 người khác viết.

- **`@import "tailwindcss"`**: thay thế cả `@tailwind base; @tailwind components; @tailwind utilities;` của v3.
- **`@theme`**: định nghĩa design token → sinh utility. `--color-brand: #4f46e5` → class `bg-brand`, `text-brand`... Tên biến quyết định tên class. Ví von: đặt một màu vào "hộp màu gia đình" là cả họ class `bg-`, `text-`, `border-` tự sinh ra như cây cờ phát từ cột mốc.
- **`@theme inline`**: khi cần giá trị reference sang variable khác (`--color-primary: var(--color-brand)`).
- **`@custom-variant dark`**: v4 dark mode mặc định theo `prefers-color-scheme`; muốn toggle class dùng `@custom-variant dark (&:where(.dark, .dark *));`.
- **`@utility`**: tạo utility riêng có chạy khi cần (khác `@layer utilities` luôn thêm).
- **`@source`**: nói cho scanner biết đâu có class (bao gồm các file ngoài `src`) — v4 tự scan nhưng đôi khi cần khai thêm.
- **`cn()`**: `twMerge(clsx(...))` — `clsx` gộp điều kiện, `tailwind-merge` loại class trùng lệnh (`bg-brand` + `bg-gray-100` cùng lúc → giữ class sau). Ví von: `clsx` là người gom đồ vào túi, `tailwind-merge` là người soi túi lần cuối bỏ thứ thừa trước khi ra cửa.
- **không chuỗi**: v4 dùng CSS (không JS runtime) → toàn bộ config đọc được từ `.css`.

## Luồng hoạt động / Cách áp dụng

Mục này là 6 bước cài Tailwind v4 vào dự án Vite từ npm install tới dark mode toggle.

1. Cài: `npm i tailwindcss @tailwindcss/vite`.
2. `vite.config.ts`: thêm plugin `tailwindcss()`.
3. CSS entry (`src/index.css`): `@import "tailwindcss";` + `@theme` tùy chỉnh.
4. Import `index.css` trong `main.tsx` (hoặc App).
5. Dùng class trực tiếp; tạo `cn()` helper cho class điều kiện.
6. Nếu dùng dark-mode toggle: thêm `@custom-variant dark`.

> **Tóm gọn 1 câu:** Cài plugin Vite → một dòng `@import "tailwindcss"` → token trong `@theme` → `cn()` cho class điều kiện — hết, không còn file config JS.

## Ví dụ chi tiết
> 📄 **Code ví dụ:** [`examples/01-vi-du-chi-tiet.css`](examples/01-vi-du-chi-tiet.css)

> 📄 **Code ví dụ:** [`examples/02-vi-du-chi-tiet.tsx`](examples/02-vi-du-chi-tiet.tsx)

> 📄 **Code ví dụ:** [`examples/03-vi-du-chi-tiet.tsx`](examples/03-vi-du-chi-tiet.tsx)

> 📄 **Code ví dụ:** [`examples/04-vi-du-chi-tiet.ts`](examples/04-vi-du-chi-tiet.ts)

## Giải thích từng phần
- `@theme { --color-brand: #4f46e5 }`: khai 1 biến → hàng loạt utility `bg-brand`, `border-brand`, `text-brand`, `ring-brand`...
- `@custom-variant dark`: bật dark mode theo class; toggle `document.documentElement.classList.toggle('dark')`.
- `@utility text-balance`: utility mới, tree-shaken (chỉ xuất hiện khi dùng).
- `cn()`: `clsx` gộp 2 danh sách (layout + variant + truyền vào), `twMerge` loại class mâu thuẫn để `className` ngoài thắng.
- `dark:hover:bg-gray-800`: kết hợp variant dark + hover.

## Lỗi thường gặp / Chống chỉ định

Mục này là 5 chỗ v3 "còn ám ảnh" v4 — giữ file config cũ, thiếu import, sai cú pháp variant, thiếu `twMerge`, scanner sót file. Đọc để chuyển version không tông nhau.

- **Giữ file `tailwind.config.js` với cú pháp cũ**: v4 không đọc nữa → chuyển hết config vào `@theme`; chỉ giữ file nếu dùng `@config` cho code cũ.
- **Thiếu `@import "tailwindcss"`**: class không sinh CSS → khai đúng CSS entry và đảm bảo import trong `main.tsx`.
- **`@custom-variant dark` sai cú pháp**: dark mode không hoạt động theo class → dùng form `(&:where(.dark, .dark *))`.
- **Không dùng `twMerge`**: `'bg-brand'` + `className="bg-red-500"` giữ cả 2, CSS không đoán được → `cn()` giải quyết.
- **Scanner bỏ sót file ngoài `src`** (ví dụ file trong thư mục khác): class bị mất → thêm `@source '../shared/**'`.

> **Tóm gọn 1 câu:** v4 là "CSS-first": mọi config nằm trong CSS — giữ file JS cũ, thiếu `@import`, hay thiếu `twMerge` đều là bụi của thời v3.

## Best practices / Mẹo
- Khai toàn bộ design token trong `@theme` — thống nhất màu/font/shadow toàn dự án.
- Dùng `cn()` cho mọi component nhận `className`; đặt tên variant rõ ràng.
- Tận dụng variant mới v4: `@container`, `text-shadow-*`, `mask-*`.
- Có thể dùng Prettier plugin `prettier-plugin-tailwindcss` để sắp xếp class ổn định.
- Đo CSS output: v4 tự purge nên bundle CSS rất nhỏ nếu không lạm dụng `safelist`.

> **Tóm gọn 1 câu:** Token tập trung ở `@theme`, class gộp bằng `cn()`, class sắp xếp bằng Prettier plugin — ba thói quen này giữ styling gọn gàng như tủ quần áo phân loại sẵn.

## Bài tập nhỏ
Thêm token `--color-danger: #dc2626` và tạo variant `danger` cho `Button` (nền đỏ, hover đậm hơn). Thêm utility `@utility line-clamp-3` (dùng `-webkit-line-clamp`) và dùng cho một card mô tả dài.

## Reference
- [Tailwind CSS + Vite](https://tailwindcss.com/docs/installation/using-vite)
- [Tailwind — Functions and Directives](https://tailwindcss.com/docs/functions-and-directives)
- [Tailwind — Theme](https://tailwindcss.com/docs/theme)
- [tailwind-merge](https://github.com/dcastil/tailwind-merge)