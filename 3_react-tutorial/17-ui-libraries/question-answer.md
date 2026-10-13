# DAY 17 — Hỏi & Đáp: Thư viện UI

> File hỏi–đáp chi tiết cho `3_react-tutorial/17-ui-libraries`.
> Đọc kèm: `README.md` (lý thuyết) + `example.tsx` (Button variants mô phỏng, không cần lib).

---

## 1. Vì sao React không có "Angular Material một cửa"?

**Hỏi:** Angular có Material + CDK chính chủ, React dùng gì?

**Đáp:**
- Ecosystem React **tách làm hai**: **headless** (logic + a11y, không style) và **styled** (đã style).
  Thực tế bạn **ghép**: Radix/Ark (behavior) + Tailwind (style), hoặc shadcn/ui, hoặc MUI nguyên bộ.
- Không có "một cửa" nhưng được tự do: bundle chỉ chứa thứ dùng, design không bị khóa theo hãng.

---

## 2. Headless (Radix/Ark/Base UI) là gì? Mạnh ở đâu?

**Hỏi:** Lib không cho style thì dùng làm gì?

**Đáp:**
- Headless chỉ render **hành vi + a11y**: focus trap, ESC đóng, ARIA dialog/combobox, keyboard —
  những thứ tự làm đúng rất khó. **Style bạn tự 100%** nên khớp mọi design system.
- Mạnh nhất về a11y trong 3 hướng. Giá: phải tự viết CSS (thường ghép Tailwind).

---

## 3. shadcn/ui khác package npm ở đâu?

**Hỏi:** `npx shadcn@latest add button` cài lib à?

**Đáp:**
- **Không phải package** — nó **copy code component vào dự án** (`components/ui/button.tsx`).
  Bạn **sở hữu code**: tùy biến tận gốc, không version lock, không chờ upstream fix.
- Khởi tạo tạo `components.json`, alias `@/`, hàm `cn()` (`clsx` + `tailwind-merge`), theme CSS variables —
  sau đó mỗi component là code nhà, sửa thoải mái.

---

## 4. Tailwind v4 + `cva` + `clsx` + `tailwind-merge` là bộ gì?

**Hỏi:** 4 cái tên này mỗi cái làm gì trong "style API"?

**Đáp:**
- **Tailwind v4** — utility CSS, cấu hình CSS-first (`@import "tailwindcss"`, `@theme`), plugin Vite,
  không file config JS phức tạp.
- **`cva` (class-variance-authority)** — định nghĩa **biến thể**: `variant: primary/outline/ghost`, `size: sm/md/lg`.
- **`clsx`** — nối class có điều kiện gọn. **`tailwind-merge`** — hợp nhất class xung đột
  (class người dùng thắng, không chập 2 padding đối nghịch).
- Example mô phỏng thủ công đúng pipeline này: `variant === "primary" ? styleA : styleB` chính là "cva chay",
  `onClick`/`children` truyền qua là API component.

---

## 5. MUI hợp khi nào? Đổi lại gì?

**Hỏi:** Khi nào chọn MUI thay vì shadcn/Tailwind?

**Đáp:**
- **MUI** = đối trọng Angular Material: full component set, theming, **lên admin/internal tool cực nhanh**.
  Đổi lại: đi theo design của MUI (thoát ra tốn công), bundle lớn hơn.
- Quy tắc chọn 2026: prod mới cần kiểm soát design → shadcn/ui + Tailwind; admin nhanh → MUI;
  a11y tối đa + design riêng → Radix/Ark + Tailwind.

---

## 6. Theme sáng/tối đổi mà không re-render React?

**Hỏi:** Đổi theme có phải setState cả app?

**Đáp:**
- Không cần — theme nằm ở **CSS variables**: đổi giá trị token là mọi component đọc token tự cập nhật
  ở tầng CSS, React không render lại. Đây là lợi thế của pipeline token-based so với truyền theme qua props/context.

---

## 7. Pipeline `cva` + `cn()` thật: viết Button shadcn-style từ example mini thế nào?

**Hỏi:** Example mini dùng `style` object — chuyển sang `cva` + Tailwind thì code ra sao từng bước?

**Đáp:**
- Cơ chế pipeline có 3 tầng tách bạch: `cva` định nghĩa **từ điển variant→class** (base luôn có + `variants` theo prop + `defaultVariants`), `clsx` nối class có điều kiện gọn, `tailwind-merge` (qua `cn()`) hợp nhất khi class xung đột (người dùng truyền `px-8` thắng `px-4` gốc thay vì chập cả hai). Example mini `variant === "primary" ? styleA : styleB` chính là "cva chay" — thay object bằng chuỗi Tailwind là thành shadcn thật.
- Vì sao phải qua `cn()` mà không nối chuỗi: Tailwind sinh cả `p-2` lẫn `p-4` vào CSS, kết quả phụ thuộc thứ tự stylesheet — khó đoán. `twMerge` loại class thua trước khi render nên DOM chỉ còn class thắng, quyết định nằm ở code chứ không ở thứ tự CSS.
- Sai thì sao: quên `cn()` mà nối chuỗi, truyền `className="px-8"` để ghi đè thì DOM có cả `px-4 px-8` — padding theo cái nào là hên xui. Fix: mọi component nhận `className` đều `cn(variantClass, className)`.

```tsx
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils"; // cn = twMerge(clsx(...)): ghép + khử xung đột

// Từ điển variant: base luôn có + variant/size + mặc định (thay style object thủ công)
const buttonVariants = cva("inline-flex items-center rounded-md text-sm font-medium", {
  variants: {
    variant: {
      default: "bg-primary text-primary-foreground hover:bg-primary/90", // primary
      outline: "border border-input bg-background hover:bg-accent", // outline
      ghost: "hover:bg-accent", // thêm ghost như bài tập README
    },
    size: { default: "h-9 px-4", sm: "h-8 px-3" },
  },
  defaultVariants: { variant: "default", size: "default" }, // khớp variant = "primary" mặc định
});

function Button({ variant, size, className, ...props }: {
  variant?: "default" | "outline" | "ghost"; size?: "default" | "sm"; className?: string;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  // cn: class người dùng truyền thắng khi xung đột (px-8 thắng px-4)
  return <button className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
```

---

## 8. Ma trận chọn lib 2026: admin nhanh, prod mới, a11y đỉnh — chọn gì và đổi gì?

**Hỏi:** Ba hoàn cảnh phổ biến thì pick bộ nào, giá phải trả là gì?

**Đáp:**
- Không có lib "ngon mọi case" — chọn theo ràng buộc dự án. Admin/internal tool cần **nhanh**: MUI full bộ (Table, Dialog, TextField có sẵn, theme engine riêng) — giá là design theo MUI và bundle lớn. Prod customer-facing cần **kiểm soát design + sở hữu code**: shadcn/ui + Tailwind v4 (copy code vào repo, token CSS vars) — giá là tự bảo trì khi upstream đổi. Dialog/combobox/menu cần **a11y đỉnh + design riêng**: Radix/Ark headless + tự style Tailwind — giá là tự viết CSS.
- Cơ chế quyết định nhanh: hỏi "có cần thoát khỏi design của lib không?" — không (admin) → MUI; có (brand riêng) → shadcn/headless. Hỏi "ai lo focus trap/ESC/ARIA?" — tự lo không nổi → headless lib, đừng tự viết `<div onClick>` giả button.
- Sai thì sao: pick MUI cho brand cao cấp rồi override CSS từng component — tốn hơn viết shadcn từ đầu. Hoặc pick headless cho admin cần nhanh — viết CSS cho 30 component tốn tuần. Fix: đúng ma trận từ đầu.

| Hoàn cảnh | Pick | Được | Giá |
|---|---|---|---|
| Admin/internal, cần nhanh | MUI | Full set + theme sẵn | Theo design MUI, bundle lớn |
| Prod mới, brand riêng | shadcn/ui + Tailwind v4 | Sở hữu code, token theme | Tự nâng cấp khi upstream đổi |
| Dialog/combobox, a11y đỉnh | Radix/Ark + Tailwind | Focus/ARIA chuẩn, style tự do | Tự viết CSS |

---

## 9. Lỗi thực chiến: import cả bộ MUI + trộn Tailwind/MUI + sửa `node_modules`?

**Hỏi:** Ba lỗi setup này phình bundle và mất code thế nào, fix từng cái?

**Đáp:**
- **Import cả bộ cho 1 button**: `import { Button } from "@mui/material"` ở MUI v5+ đã tree-shake được, nhưng import kiểu deep sai hoặc lib cũ có thể lôi cả bộ — bundle phình, FCP chậm. Fix: import named chuẩn + kiểm tra visualizer sau build; app nhẹ chỉ cần 1-2 component thì cân nhắc shadcn/Tailwind thay vì MUI.
- **Trộn Tailwind + MUI không kiểm soát**: hai system (utility vs theme engine Emotion) đè specificity lẫn nhau, màu/spacing hai nguồn — sửa một chỗ vỡ chỗ khác. Fix: chọn **một style system chính**; nếu buộc trộn, phía MUI dùng `sx`/styled API, không đè Tailwind bừa lên class MUI.
- **Sửa file trong `node_modules`**: tưởng sửa shadcn nhưng sửa nhầm package — `npm ci` là mất. Fix: nhớ shadcn **copy vào `src/components/ui/`** — sửa trong repo, đó là code nhà. Đây là "cái giá của sở hữu": chủ động theo changelog để nâng cấp.
- Cơ chế phòng ngừa chung: sau mỗi lần thêm lib UI, chạy build + xem kích thước chunk (như DAY 13) — chunk phình đột ngột là tín hiệu import sai.

```tsx
// ĐÚNG: component mở đuôi className + ...props để tùy biến không cần sửa lib
import { cn } from "@/lib/utils";

function Card({ className, children, ...props }: {
  className?: string; children: React.ReactNode;
} & React.HTMLAttributes<HTMLDivElement>) {
  // cn hợp nhất class gốc với class người dùng, props lạ (onClick, id...) xuyên qua
  return <div className={cn("rounded-lg border bg-card p-4", className)} {...props}>{children}</div>;
}
```

---

## 10. `cn()` + design tokens: ghi đè `px-4` bằng `px-8` và đổi theme không re-render?

**Hỏi:** Ghi đè class và đổi theme hai việc này chạy ở tầng nào?

**Đáp:**
- Ghi đè class chạy ở **tầng JS lúc render**: `cn(buttonVariants({ variant: "default" }), "px-8")` → `clsx` nối, `twMerge` thấy `px-4` (gốc) vs `px-8` (người dùng) cùng nhóm padding-x thì giữ `px-8`, bỏ `px-4`. DOM chỉ có class thắng — quyết định ở code, không ở thứ tự CSS. Không có `twMerge` thì cả hai cùng nằm trong DOM, kết quả tùy stylesheet.
- Đổi theme chạy ở **tầng CSS không qua React**: token nằm trong CSS variables (`--color-primary`), component đọc token qua class (`bg-primary`). Đổi giá trị biến là mọi component tự đổi màu ở tầng trình duyệt — React không re-render (khác hẳn truyền theme qua props/context ở DAY 7). Đây là lợi thế token-based.
- Sai thì sao: hardcode màu hex trong từng component thay vì token thì đổi theme phải sửa N file. Fix: màu/spacing/radius một chỗ (`@theme`), component chỉ đọc token.

| Việc | Tầng chạy | Re-render React? |
|---|---|---|
| `cn()` ghi đè `px-4` → `px-8` | JS lúc render (twMerge) | Có (render ra class mới) |
| Đổi token `--color-primary` | CSS variables ở trình duyệt | Không — CSS tự cập nhật |
| Hardcode hex mỗi component | Sửa code N file | Có + tốn công |

---

## 11. A11y + test UI lib: vì sao `<div onClick>` thua `<button>` và `getByRole` ép code tốt?

**Hỏi:** Dùng div giả button cho dễ style có sao? Test query bằng gì để khóa?

**Đáp:**
- `<div onClick>` mất toàn bộ hành vi button miễn phí: focus bằng Tab, bấm bằng Enter/Space, role cho screen reader, disabled chuẩn. Tự bù bằng `tabIndex + onKeyDown + role="button"` cho 1 div thì được, cho 50 div là nợ a11y — headless lib (Radix) sinh đúng element + ARIA nên không phải bù tay.
- Cơ chế test ép code tốt (nối DAY 21): query bằng `getByRole("button", { name: "Lưu" })` chỉ pass khi component render **đúng element semantic có accessible name**. Div giả không role/name thì query không ra — test đỏ báo hiệu phải sửa component (dùng `<button>` hoặc headless), không được sửa test sang `querySelector` cho dễ. Nhờ vậy suite test thành lưới a11y tự động.
- Quy tắc: component tương tác luôn dùng element đúng (`button`, `a`, `input` + `label`); xuất cả `buttonVariants` để nơi khác (`<a styled như button>`) tái dùng class mà vẫn đúng semantic.

```tsx
// ĐÚNG: button thật + accessible name rõ -> getByRole query được, keyboard miễn phí
function SaveButton({ onSave }: { onSave: () => void }) {
  // Test khóa: getByRole("button", { name: "Lưu" }) chỉ pass với button thật có text
  return <button type="button" onClick={onSave}>Lưu</button>;
}
// SAI: <div onClick={onSave}>Lưu</div> -> Tab không focus, Enter không bấm, test role không ra
```

---

## Reference

- `README.md` + `example.tsx` trong cùng thư mục (DAY 17)
- https://ui.shadcn.com/ · https://tailwindcss.com/ · https://mui.com/
- https://www.radix-ui.com/ (headless + a11y patterns)
