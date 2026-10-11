# DAY 17: THƯ VIỆN UI (MATERIAL)

## Mục tiêu bài học
- Hiểu 3 hướng thư viện UI React 2026: **headless** (Radix/Ark/Base UI) + Tailwind, **full-suite** (MUI), **copy-paste/shared code** (shadcn/ui).
- Biết chọn đúng cho từng hoàn cảnh: shadcn/ui + Tailwind v4 cho prod mới (kiểm soát code), MUI cho admin nhanh, Radix cho a11y tối đa.
- Tự xây một "Button variants" mini để thấy bản chất của variant + style pipeline.

## Khái niệm cốt lõi (Core)

### 1. Angular một cửa — React tách headless/styled
Angular có Material + CDK "một cửa" (component + behavior + a11y + theme một gói). React tách: **headless** (logic + a11y + focus/ESC/ARIA, không style: Radix/Ark/Base UI) và **styled** (đã style: MUI). Thường **ghép**: Radix (behavior) + Tailwind (style) — behavior đúng chuẩn, style tự do.

```tsx
// Headless Radix: chỉ hành vi + a11y, class do bạn (Tailwind) quyết
import * as Dialog from "@radix-ui/react-dialog";
<Dialog.Root><Dialog.Trigger className="btn">Mở</Dialog.Trigger><Dialog.Content className="panel">Hi</Dialog.Content></Dialog.Root>
// Radix lo focus trap + ESC + aria-modal; bạn lo .btn/.panel đẹp kiểu nào cũng được
```

Vì sao tách tốt? Vì design đổi (rebrand màu) không phải đổi lib — behavior giữ, class thay. Full-suite (MUI) đổi design là chống lại theme engine của nó.

### 2. shadcn/ui không phải package — là code bạn sở hữu
`npx shadcn@latest add button` **copy** `components/ui/button.tsx` vào repo (không `npm i` version lock). Bạn sửa tận gốc, không chờ upstream, không sợ breaking major. Giá: tự nâng cấp khi shadcn đổi (theo changelog).

```bash
npx shadcn@latest init # tạo components.json + alias @/ + cn() + theme vars
npx shadcn@latest add button # copy components/ui/button.tsx (cva + cn) vào dự án — sửa trong repo, không node_modules
```

### 3. Tailwind v4 CSS-first + Vite
`npm i tailwindcss @tailwindcss/vite`; plugin vào `vite.config.ts`; CSS `@import "tailwindcss"`; token trong `@theme { --color-primary: ... }`. Không `tailwind.config.js` kiểu v3. shadcn đọc token qua CSS vars — đổi theme không đụng component.

### 4. Variants pipeline: cva + clsx + tailwind-merge
`cva` định nghĩa biến thể có type (variant/size/defaultVariants); `clsx` nối class điều kiện; `tailwind-merge` giải xung đột (`px-4` vs `px-8` → giữ `px-8`). `cn()` = `twMerge(clsx(...))` — "style API" mọi component shadcn. Example mini trong bài là `cva` thủ công (object style thay class) để thấy bản chất map prop → style.

```tsx
// shadcn Button thật (xem README cũ giữ lại dưới) — cùng ý Button mini trong example:
import { cva } from "class-variance-authority";
const buttonVariants = cva("inline-flex items-center rounded-md text-sm font-medium", {
  variants: { variant: { default: "bg-primary ...", outline: "border ...", ghost: "hover:bg-accent" }, size: { default: "h-9 px-4", sm: "h-8 px-3" } },
  defaultVariants: { variant: "default", size: "default" },
});
// Dùng: <button className={cn(buttonVariants({ variant, size }), className)}> — user className thắng khi xung đột
```

### 5. MUI = Angular Material của React
Full set, theming (`ThemeProvider` + `sx`), sẵn dùng cho admin/prototype nhanh. Giá: bundle lớn, design theo MUI, trộn Tailwind bừa là specificity/theme chồng. Import named + tree-shaking khi chỉ cần vài component.

### 6. Headless mạnh nhất a11y
Radix/Ark xử lý focus trap, ESC đóng, ARIA pattern phức tạp (dialog/combobox/menu), keyboard nav — tự viết dễ sót (quên `role`, focus không trap, ESC không đóng). Test bằng `getByRole` (DAY 21) để đảm bảo semantic (dùng `<button>` thật, không `<div onClick>`).

### Keyword chính
headless (Radix/Ark/Base UI: behavior + a11y, không style), styled/full-suite (MUI), shadcn/ui (copy-paste, sở hữu code), Tailwind v4 (`@import`, `@theme`), `cva` (variants có type), `clsx` (nối điều kiện), `tailwind-merge`/`cn()` (giải xung đột), theming (CSS vars/MUI theme).

## Luồng hoạt động (Flow)
1. Cài Tailwind v4 + Vite plugin; thêm vào `vite.config.ts`; CSS `@import "tailwindcss"` + `@theme` token. Không config JS v3.
2. `npx shadcn@latest init` — `components.json`, alias `@/`, `cn()` (`clsx` + `tailwind-merge`), theme CSS vars. `cn` là trái tim pipeline class.
3. `npx shadcn@latest add button` — copy `components/ui/button.tsx` (dùng `cva` variant default/outline/ghost + size + `cn`) vào repo. Sửa trong `src/`, không `node_modules`.
4. App `<Button variant="default">Lưu</Button>` → `cva` map variant → class Tailwind → CSS sinh style. `variant` union nên sai chính tả báo compile.
5. `Button` nhận `className` ngoài → `cn(variantClass, className)` hợp nhất, user thắng khi xung đột (nhờ `tailwind-merge`: `px-4` + `px-8` → `px-8`). Không `cn` là 2 class xung đột cùng tồn tại, kết quả theo thứ tự CSS (may rủi).
6. (MUI) `npm i @mui/material @emotion/react @emotion/styled` → `<Button variant="contained">` — style trong theme engine MUI, không phải Tailwind. Chọn 1 style system chính, không trộn bừa.
7. (Radix) `<Dialog.Root/Trigger/Content>` — Radix render hành vi + a11y; class bạn tự. Focus trap + ESC + `aria-modal` miễn phí.
8. Đổi theme (sáng/tối): CSS vars đổi → mọi component đọc token tự cập nhật, không re-render React. Token một chỗ, component không hardcode màu.

## Ví dụ chi tiết
Khớp 1-1 với `example.tsx` (mini 3 variant + 3 size + disabled + a11y):

```tsx
// example.tsx — DAY 17: Button variants mini + cva/cn ý tưởng + a11y (khớp README)
// Mục đích: variant = map prop -> style; cva/cn chỉ là pipeline gọn cho việc đó.
import { useState } from "react"; // (1) State saved để minh họa UI phản hồi (render có điều kiện DAY 2)

// (2) Mini Button 3 variant + 3 size + disabled — cùng ý cva (variants/size/defaultVariants) bản thủ công.
function Button({ variant = "primary", size = "md", disabled = false, children, onClick }: {
  variant?: "primary" | "outline" | "ghost"; // union chặn giá trị lạ — cva variants tương đương
  size?: "sm" | "md" | "lg"; // size pipeline — cva size tương đương
  disabled?: boolean; // disabled đổi cursor/opacity + chặn click (a11y: dùng <button disabled>, không div onClick)
  children: React.ReactNode;
  onClick?: () => void;
}) {
  // (3) Map variant -> style (thủ công). Prod: cva tách base/variants/defaultVariants + Tailwind class.
  const variantStyle =
    variant === "primary"
      ? { background: "#1976d2", color: "#fff", border: "none" }
      : variant === "outline"
        ? { background: "#fff", color: "#1976d2", border: "1px solid #1976d2" }
        : { background: "transparent", color: "#1976d2", border: "none" }; // ghost
  // (4) Map size -> padding/font. Prod: cva size { sm: "h-8 px-3", md: "h-9 px-4", lg: "h-10 px-6" }.
  const sizeStyle =
    size === "sm" ? { padding: "4px 12px", fontSize: 12 } : size === "lg" ? { padding: "12px 24px", fontSize: 16 } : { padding: "8px 16px", fontSize: 14 };
  return (
    // (5) <button> semantic (không div onClick) — keyboard focus/Enter + screen reader miễn phí.
    // className mở đuôi (prod: cn(variantClass, className) với tailwind-merge để user ghi đè không xung đột).
    <button
      style={{ ...variantStyle, ...sizeStyle, borderRadius: 6, cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.5 : 1 } as React.CSSProperties}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}

export default function App() {
  const [saved, setSaved] = useState(false); // (6) State phản hồi — minh họa state-driven (DAY 19 ý tưởng)
  return (
    <>
      <Button onClick={() => setSaved(true)}>Lưu (primary)</Button>{" "}
      <Button variant="outline" onClick={() => setSaved(false)}>Hủy (outline)</Button>{" "}
      <Button variant="ghost" size="sm">Chi tiết (ghost sm)</Button>{" "}
      <Button size="lg" disabled>Lưu (disabled)</Button>
      {/* (7) Render có điều kiện theo state — UI là hàm của state, không gọi DOM tay */}
      {saved && <p>Đã lưu!</p>}
    </>
  );
}

// Ghi chú prod (xem README copy):
// - shadcn: cva("base", { variants: { variant: { default, outline, ghost }, size: {...} }, defaultVariants }) + cn().
// - cn(...inputs) = twMerge(clsx(inputs)) — clsx điều kiện + tailwind-merge giải xung đột (px-4 vs px-8 -> px-8).
// - Tailwind v4 CSS-first: @import "tailwindcss" + @theme token; headless Radix lo a11y (focus/ESC), bạn lo class.
```

shadcn/ui Button thật (component bạn sở hữu sau `add`):

```tsx
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
// Dùng: <button className={cn(buttonVariants({ variant, size }), className)}> — "style API" có type
```

Hàm `cn()` — trái tim pipeline:

```ts
// src/lib/utils.ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs)); // ghép điều kiện (clsx) + giải xung đột (twMerge)
}
// Thử: cn("px-4", "px-8") -> "px-8" (user thắng); không cn là "px-4 px-8" (may rủi theo CSS)
```

## Giải thích từng phần
- Dòng `variant?: "primary" | "outline" | "ghost"`: union là "controlled vocabulary" — sai `"primay"` báo compile. `cva` variants cùng ý nhưng sinh class thay vì object. Thêm variant mới là thêm 1 nhánh map (mini) / 1 entry variants (cva) — không sửa nơi dùng.
- Dòng `variant = "primary"`, `size = "md"`: default destructuring = `defaultVariants` của cva. Vì sao default? Để 80% nơi dùng gọn (`<Button>Lưu</Button>`), 20% cần mới truyền.
- Khối `variantStyle`/`sizeStyle` thủ công ↔ class Tailwind: cùng map prop → style, khác công cụ. Hiểu mini thì `cva` không huyền bí: `cva` chỉ tách base (luôn có) + variants (theo prop) + default (mặc định) thành data thay vì `if`.
- Dòng `<button disabled>`: semantic + `disabled` thật (chặn click + focus + mờ). Vì sao không `<div onClick>`? Vì div mất keyboard (Tab/Enter), screen reader không biết là nút, phải tự `role/tabIndex/keyDown` — Radix/headless sinh để khỏi tự làm.
- Dòng `{saved && <p>Đã lưu!</p>}`: state-driven (DAY 2/19) — UI là hàm state, không `ref.textContent = ...`. Bấm Lưu/Hủy là `setSaved`, `<p>` theo.
- Dòng `cva` 3 phần (base/variants/default): base `inline-flex...` luôn có; variants theo prop; default khi không truyền. API style có type (`buttonVariants({ variant: "sai" })` báo).
- Dòng `clsx("p-2", isActive && "bg-blue-500")`: nối điều kiện gọn hơn nối chuỗi + `if`. `tailwind-merge` sau đó giải xung đột cùng thuộc tính (padding/margin/color) — giữ cái sau (user) bỏ cái trước (variant).
- Dòng Tailwind v4 `@theme`: token (`--color-primary`) một chỗ; shadcn class `bg-primary` đọc token. Đổi token là mọi Button/Nav đổi màu không sửa component — theming đúng nghĩa.

## Bảng so sánh Angular ↔ React
| Angular | React | Ghi chú |
|---|---|---|
| Angular Material (full-suite) | MUI / shadcn/ui / AntD | MUI gần Material nhất (theme + sẵn) |
| CDK (a11y, overlay, virtual scroll, DnD) | Radix / Ark UI / Base UI (headless) | Behavior không style, tự class |
| SCSS theme + `mat.theme()` | Tailwind v4 `@theme` + CSS vars / MUI theme | Token một chỗ, component đọc |
| `@Component({styleUrls})` scoped (ViewEncapsulation) | Tailwind class / CSS Modules (không scoped mặc định) | React không encapsulation ẩn |
| `ng add @angular/material` (package) | `npx shadcn init && add <comp>` (copy code) | shadcn sở hữu code, sửa trong repo |
| Material Icons | `lucide-react` / `react-icons` | Icon tách gói riêng |
| `ngClass` điều kiện | `cn()` / template string / `clsx` | Linh hoạt hơn, merge xung đột |
| `ngStyle` | `style={{...}}` hoặc class Tailwind | Ưu tiên class + token, inline khi demo |
| Theme Angular Material provider | MUI `<ThemeProvider>` / CSS vars Tailwind | Cơ chế khác, cùng ý token |
| CDK Overlay/Dialog | Radix Dialog/Popover + Tailwind | Focus/ESC/ARIA miễn phí |

## Lỗi thường gặp (Common pitfalls)

### 1. Import cả MUI cho 1 button → bundle phình
```tsx
// ❌ SAI: kéo cả lib khi chỉ cần 1 nút (bundle + theme engine thừa)
// import Button from "@mui/material/Button"; + theme setup cho landing 1 trang
```
```tsx
// ✅ ĐÚNG (MUI v5+): named + tree-shaking khi đã chọn MUI; app nhẹ thì shadcn/Tailwind
import { Button, TextField } from "@mui/material"; // bundler loại phần không dùng
// Landing nhẹ: shadcn Button (copy 1 file) + Tailwind — không theme engine
```

### 2. Trộn Tailwind + MUI không kiểm soát → specificity/theme chồng
Mô tả: class Tailwind `bg-blue-500` đấu với MUI emotion `background` — thứ tự khó đoán, theme 2 nơi. Fix: 1 style system chính; buộc trộn thì MUI `sx`/styled cho phần MUI, Tailwind cho phần riêng, không đè bừa.

### 3. Sửa trong `node_modules` (hiểu sai shadcn)
Mô tả: sửa `node_modules/@shadcn/...` (nếu quen package) — cài lại mất. Fix: shadcn copy vào `src/components/ui/` — sửa trong repo, commit như code mình.

### 4. Quên `cn()` (tailwind-merge) → class xung đột cùng tồn tại
```tsx
// ❌ SAI: px-2 và px-4 cùng trong DOM — kết quả theo thứ tự CSS (may rủi)
<button className={`px-4 ${className}`}>Hi</button> // className="px-8" -> "px-4 px-8"
```
```tsx
// ✅ ĐÚNG: cn giữ cái sau (user) bỏ cái trước
import { cn } from "@/lib/utils";
<button className={cn("px-4", className)}>Hi</button> // "px-8" đúng
```

### 5. `<div onClick>` thay `<button>` → mất a11y
```tsx
// ❌ SAI: Tab không tới, Enter không bấm, screen reader không biết
<div onClick={save}>Lưu</div>
```
```tsx
// ✅ ĐÚNG: semantic hoặc headless (Radix tự role/focus/ESC)
<button onClick={save}>Lưu</button>
```

### 6. Config Tailwind v3 cho v4 → không khớp
Mô tả: tạo `tailwind.config.js` + `content` kiểu v3 cho dự án v4. Fix: v4 CSS-first (`@import "tailwindcss"`, `@theme`) + plugin `@tailwindcss/vite` trong `vite.config.ts`.

### 7. Style inline mọi thứ → mất token/theme
Mô tả: `style={{ background: "#1976d2" }}` khắp app — rebrand sửa 50 file. Fix: class + token (`bg-primary`) — đổi 1 token xong. Inline chỉ demo/mini như example.

## Best practices / Mẹo
- **Ma trận chọn:** admin/prototype nhanh → MUI; prod mới kiểm soát + đẹp → shadcn + Tailwind v4; a11y đỉnh (dialog/combobox/menu) → Radix/Ark; design system riêng → Base UI + tokens. Vì sao ma trận? Vì mỗi hướng tối ưu một trục (tốc độ/kiểm soát/a11y) — không có "tốt nhất" chung.
- Component nhận `className` + `...props` "mở đuôi" — thói quen UI kit tốt. Vì sao? Để nơi dùng tùy biến (thêm `px-8`, `disabled`, `aria-*`) không sửa kit.
- **Mọi component nhận className qua `cn()`** — user ghi đè không xung đột. Vì sao quy ước? Để `px-8` ngoài luôn thắng `px-4` trong (merge), không may rủi.
- **Xuất cả component + variants** (`Button` + `buttonVariants`) — tái dùng class cho `<a>` styled như button. Vì sao? Để link trông như nút mà vẫn semantic `<a>`.
- Token (màu/spacing/radius) một chỗ (CSS vars/theme) — component đọc token, không hardcode. Vì sao? Để rebrand 1 chỗ.
- Test semantic `getByRole("button")` (DAY 21) — đảm bảo element đúng. Vì sao? Vì query theo role vỡ ngay khi ai đó đổi `<button>` thành `<div>`.

## Bài tập nhỏ
1. Mini thêm `ghost` + `size sm/md/lg` + `disabled` (như example đã có) — chuyển cùng API sang `cva` shadcn, so code thủ công vs cva (dài/gọn/type chỗ nào?).
2. MUI form (`TextField` + `Button` contained/outlined) vs shadcn/Tailwind form — so bundle (build size), thời gian code, tùy biến (đổi màu primary mấy chỗ?).
3. `npx shadcn add button` rồi so API với mini (variant/size/className) — khác gì ngoài class vs style?
4. `cn("px-4", "px-8")` → kiểm tra ra `"px-8"` (merge đúng); không `cn` thì ra gì và CSS quyết thế nào?
5. Đổi token primary — quan sát Button/Nav đổi màu không sửa component. Hardcode inline thì phải sửa mấy chỗ?

## Reference
- https://ui.shadcn.com/
- https://mui.com/
- https://www.radix-ui.com/
- https://tailwindcss.com/docs/installation/using-vite
- https://cva.style/docs
