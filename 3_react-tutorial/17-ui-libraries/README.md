# DAY 17: THƯ VIỆN UI (MATERIAL)

## Mục tiêu bài học
- Hiểu 3 hướng thư viện UI React 2026: **headless** (Radix/Ark/Base UI) + Tailwind, **full-suite** (MUI), **copy-paste/shared code** (shadcn/ui).
- Biết chọn đúng cho từng hoàn cảnh: shadcn/ui + Tailwind v4 cho prod mới (kiểm soát code), MUI cho admin nhanh, Radix cho a11y tối đa.
- Tự xây một "Button variants" mini để thấy bản chất của variant + style pipeline.

## Khái niệm cốt lõi (Core)
- **Angular có Angular Material + CDK "một cửa".** React ecosystem tách làm hai: **headless** (logic + a11y, không style) và **styled** (đã style). Bạn thường **ghép**: Radix (behavior) + Tailwind (style).
- **shadcn/ui không phải package npm** — nó là **bộ code bạn copy vào dự án** (`npx shadcn@latest add button`). Bạn sở hữu component, tùy biến tận gốc, không phụ thuộc version lock.
- **Tailwind v4:** cấu hình CSS-first (`@import "tailwindcss"`, `@theme`), tích hợp Vite qua `@tailwindcss/vite` — nhanh, không cần file config JS phức tạp.
- **Variants pipeline:** `class-variance-authority (cva)` định nghĩa biến thể (variant/size), `clsx` + `tailwind-merge` nối/tinh chỉnh class không đụng nhau. Đây là "style API" của component.
- **MUI = đối trọng Angular Material:** full component set, theming, sẵn dùng — đổi lại bạn đi theo design of MUI và bundle lớn hơn.
- **Headless mạnh nhất về a11y:** Radix/Ark xử lý focus trap, ESC, ARIA pattern phức tạp (dialog, combobox) — bạn tự style 100%.
- **Keyword chính:** headless, Radix, Ark UI, Base UI, shadcn/ui, Tailwind v4, `cva`, `clsx`, `tailwind-merge`, MUI, theming.

## Luồng hoạt động (Flow)
1. Cài Tailwind v4 + Vite plugin: `npm i tailwindcss @tailwindcss/vite`; thêm plugin vào `vite.config.ts`; CSS `@import "tailwindcss"`.
2. `npx shadcn@latest init` — tạo `components.json`, alias `@/`, hàm `cn()` (clsx + tailwind-merge), theme CSS variables.
3. `npx shadcn@latest add button` — copy `components/ui/button.tsx` vào dự án: component dùng `cva` cho variant (default/outline/ghost...) và `cn()` để ghép class.
4. App render `<Button variant="default">Lưu</Button>` — component đọc `variant` → trả class Tailwind tương ứng → Tailwind CSS sinh style.
5. (MUI) `npm i @mui/material @emotion/react @emotion/styled` → `<Button variant="contained">` — style nằm trong theme engine của MUI, không phải Tailwind.
6. (Radix) `npm i @radix-ui/react-dialog` → `<Dialog.Root>/<Dialog.Trigger>/<Dialog.Content>` — Radix chỉ render hành vi + a11y; bạn tự class cho đẹp.
7. `Button` nhận `className` từ nơi dùng → `cn(variantClass, className)` hợp nhất: class người dùng thắng khi xung đột (nhờ tailwind-merge).
8. Khi theme đổi (sáng/tối), CSS variables đổi giá trị → mọi component đọc token tự cập nhật, không cần re-render React.

## Ví dụ chi tiết
```tsx
// example.tsx — DAY 17: ví dụ không cần lib (mô phỏng Button variants)
import { useState } from "react";

// Mini "Button" với 2 variant — cùng ý tưởng cva trong shadcn/ui
function Button({ variant = "primary", children, onClick }: {
  variant?: "primary" | "outline";
  children: React.ReactNode;
  onClick?: () => void;
}) {
  // Chọn style theo variant — "cva" phiên bản thủ công
  const style =
    variant === "primary"
      ? { background: "#1976d2", color: "#fff", border: "none", padding: "8px 16px", borderRadius: 6 }
      : { background: "#fff", color: "#1976d2", border: "1px solid #1976d2", padding: "8px 16px", borderRadius: 6 };
  return <button style={style} onClick={onClick}>{children}</button>;
}

export default function App() {
  const [saved, setSaved] = useState(false);
  return (
    <>
      <Button onClick={() => setSaved(true)}>Lưu (primary)</Button>{" "}
      <Button variant="outline" onClick={() => setSaved(false)}>Hủy (outline)</Button>
      {saved && <p>Đã lưu!</p>}
    </>
  );
}
```

```tsx
// shadcn/ui Button (thực tế) — component bạn sở hữu
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva("inline-flex items-center rounded-md text-sm font-medium", {
  variants: {
    variant: {
      default: "bg-primary text-primary-foreground hover:bg-primary/90",
      outline: "border border-input bg-background hover:bg-accent",
      ghost: "hover:bg-accent",
    },
    size: { default: "h-9 px-4", sm: "h-8 px-3" },
  },
  defaultVariants: { variant: "default", size: "default" },
});
// cn() chỉ ghép class không đè nhau (tailwind-merge) -> "style API" của bạn
```

Hàm `cn()` — trái tim của pipeline class:

```ts
// src/lib/utils.ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs)); // ghép có điều kiện + tinh chỉnh xung đột
}
```

## Giải thích từng phần
- `variant?: "primary" | "outline"`: union type chặn giá trị lạ — chính là "controlled vocabulary" mà cva dùng khi sinh class.
- `variant = "primary"`: default value trong destructuring (DAY 3) — giống `defaultVariants` của cva.
- So sánh: `style` object thủ công ↔ chuỗi class Tailwind. Bản chất như nhau: **map variant → style**, chỉ khác công cụ. Hiểu cái tối giản giúp bạn không "huyền bí hóa" shadcn.
- `{saved && <p>Đã lưu!</p>}`: render có điều kiện (DAY 2) — UI phản hồi hành động.
- Trong shadcn thật: `cva` tách style khỏi logic; `cn()` hợp nhất class người dùng truyền (`className`) với class variant mà không xung đột — chi tiết quan trọng khi bạn tùy biến.
- **`cva` tách 3 phần:** base class (luôn có), `variants` (theo prop), `defaultVariants` (mặc định) — API style có type.
- **`clsx` xử lý điều kiện:** `clsx("p-2", isActive && "bg-blue-500")` gọn hơn nối chuỗi thủ công; `tailwind-merge` giải quyết xung đột.
- **Tailwind v4 CSS-first:** token khai trong `@theme { --color-primary: ... }`; shadcn đọc qua CSS variables — đổi theme không đụng component.

## Bảng so sánh Angular ↔ React
| Angular | React | Ghi chú |
|---|---|---|
| Angular Material | MUI / shadcn/ui / Ant Design | MUI gần Material nhất |
| CDK (a11y, overlay, virtual scroll) | Radix / Ark UI / Base UI | Headless behavior |
| SCSS theme + `mat.theme()` | Tailwind v4 `@theme` + CSS vars / MUI theme | Theming khác cơ chế |
| `@Component({styleUrls})` scoped CSS | Tailwind class / CSS Modules | React không có ViewEncapsulation mặc định |
| `ng add @angular/material` | `npx shadcn@latest init && add <comp>` | shadcn copy code vào dự án |
| Material Icons | lucide-react / react-icons | Icon tách riêng, phổ biến |
| `ngClass="{{...}}"` | `cn()` / template string | Điều kiện class linh hoạt hơn |
| `ngStyle` | `style={{...}}` hoặc class Tailwind | Ưu tiên class |
| Theme Angular Material | `<ThemeProvider>` MUI / CSS vars | Cơ chế khác nhau |

## Lỗi thường gặp (Common pitfalls)
- **Import cả bộ MUI cho 1 button** → bundle phình. → Fix (MUI v5+): import named từ `@mui/material` + tree-shaking; hoặc chọn shadcn/Tailwind cho app nhẹ.
- **Trộn Tailwind + MUI không kiểm soát** → conflict specificity, theme chồng chéo. → Fix: chọn một style system chính; nếu buộc trộn, dùng MUI `sx`/styled, đừng đè Tailwind bừa.
- **Sửa trực tiếp file trong `node_modules`** (shadcn cũ hiểu sai) → mất khi cài lại. → Fix: shadcn copy vào `src/components/ui/` — sửa trong repo.
- **Quên `cn()` (tailwind-merge)** khi ghép `className` → class mâu thuẫn (`p-2` và `p-4`) cùng tồn tại, thứ tự quyết định. → Fix: luôn dùng `cn()` cho component nhận className.
- **Dùng `<div onClick>` thay `<button>`** cho control tương tác → mất a11y bàn phím. → Fix: dùng element semantic hoặc headless lib (Radix tự lo role/focus).
- **Tailwind v4 config kiểu v3** (`tailwind.config.js` + `content`) → không khớp. → Fix: theo CSS-first `@theme` + plugin `@tailwindcss/vite`.
- **Không dùng `tailwind-merge`** → class trùng thuộc tính (`px-2` và `px-4`) cùng nằm trong DOM → kết quả tùy thứ tự CSS. → Fix: luôn qua `cn()`.
- **Copy component shadcn rồi quên cập nhật khi lib thay đổi** → code cũ. → Fix: theo dõi changelog, chủ động nâng cấp (đây là "cái giá" của sở hữu code).
- **Style inline cho mọi thứ** → mất lợi ích theme/token. → Fix: dùng class + token.

## Best practices / Mẹo
- **Ma trận chọn:** admin nhanh/prototype → MUI; prod mới muốn kiểm soát + đẹp → shadcn/ui + Tailwind v4; cần a11y đỉnh (dialog, combobox, menu) → Radix/Ark; design system riêng → Base UI + tokens.
- Ở tutorial này, ví dụ "không cần lib" cho thấy bản chất variant — khi lên prod hãy chuyển sang shadcn để đổi variant/theme dễ dàng.
- Tạo **design tokens** (màu, spacing, radius) một chỗ (CSS vars/Tailwind theme) — component đọc token, không hardcode.
- Component nhận `className` + `...props` để "mở đuôi" tùy biến — thói quen của UI kit tốt.
- Với a11y: ưu tiên headless lib thay vì tự viết focus trap; test bằng `getByRole` (DAY 21) để đảm bảo semantic.
- **Dùng `cn()` ở mọi component nhận `className`** — quy ước giúp mở rộng/tùy biến không xung đột.
- **Xuất cả component + variants** (`buttonVariants`) để tái dùng class ở nơi khác (vd `<a>` styled như button).
- **Kiểm thử semantic:** render và query bằng `getByRole("button")` — đảm bảo component dùng element đúng (DAY 21).

## Bài tập nhỏ
1. Mở rộng `Button` mini thêm variant `"ghost"` + prop `size: "sm" | "md" | "lg"` và prop `disabled` (đổi `cursor` + `opacity`) — sau đó chuyển cùng API sang `cva` trong shadcn (so sánh code).
2. Cài MUI, dựng 1 form gồm `TextField` + `Button` (contained/outlined) và so sánh với cùng form dựng bằng shadcn/Tailwind: dung lượng bundle, thời gian code, độ tùy biến.
3. Cài Tailwind v4 + shadcn, thêm `Button` từ shadcn và so sánh API với `Button` mini (variant/size/className).
4. Viết hàm `cn()` và thử truyền `className="px-8"` để ghi đè `px-4` — kiểm tra tailwind-merge chọn đúng.
5. Đổi theme token (màu primary) và quan sát toàn bộ Button/Nav đổi màu không cần sửa component.

## Reference
- https://ui.shadcn.com/
- https://mui.com/
- https://www.radix-ui.com/
- https://tailwindcss.com/docs/installation/using-vite
- https://cva.style/docs