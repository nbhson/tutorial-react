# DAY 17: THƯ VIỆN UI (MATERIAL)

## Mục tiêu bài học
- Hiểu 3 hướng thư viện UI React 2026: **headless** (Radix/Ark/Base UI) + Tailwind, **full-suite** (MUI), **copy-paste/shared code** (shadcn/ui).
- Biết chọn đúng cho từng hoàn cảnh: shadcn/ui + Tailwind v4 cho prod mới (kiểm soát code), MUI cho admin nhanh, Radix cho a11y tối đa.
- Tự xây một "Button variants" mini để thấy bản chất của variant + style pipeline.

## Khái niệm cốt lõi (Core)

Mục này nói về bản đồ thư viện UI React 2026: headless, full-suite và copy-paste — đọc để biết có những hướng nào trước khi quyết "app này dùng lib gì".

### 1. Angular một cửa — React tách headless/styled
Angular có Material + CDK "một cửa" (component + behavior + a11y + theme một gói). React tách: **headless** (logic + a11y + focus/ESC/ARIA, không style: Radix/Ark/Base UI) và **styled** (đã style: MUI). Thường **ghép**: Radix (behavior) + Tailwind (style) — behavior đúng chuẩn, style tự do. Ví von: Angular bán cả bộ ghế sofa trọn gói; React chia thành "bộ khung ghế siêu chắc" (headless) và "vải bọc" (Tailwind) — bạn mua khung một chỗ, chọn vải ở chỗ khác.

> 📄 **Code ví dụ:** [`examples/01-1-angular-mot-cua-react-tach-headless-styled.tsx`](examples/01-1-angular-mot-cua-react-tach-headless-styled.tsx)

Vì sao tách tốt? Vì design đổi (rebrand màu) không phải đổi lib — behavior giữ, class thay. Full-suite (MUI) đổi design là chống lại theme engine của nó.

> **Tóm gọn 1 câu:** React tách "khung ghế" (headless: behavior + a11y) khỏi "vải bọc" (style) — bạn tự ghép theo design của mình.

### 2. shadcn/ui không phải package — là code bạn sở hữu
`npx shadcn@latest add button` **copy** `components/ui/button.tsx` vào repo (không `npm i` version lock). Bạn sửa tận gốc, không chờ upstream, không sợ breaking major. Giá: tự nâng cấp khi shadcn đổi (theo changelog). Ví von: thay vì mua đồ nội thất đóng sẵn (không được đục đẽo), shadcn giao cho bạn bản thiết kế gỗ thô — bạn tự chạm khắc tùy ý, nhưng cũng tự lo sơn lại mỗi mùa.

> 📄 **Code ví dụ:** [`examples/02-2-shadcn-ui-khong-phai-package-la-code.sh`](examples/02-2-shadcn-ui-khong-phai-package-la-code.sh)

> **Tóm gọn 1 câu:** shadcn/ui tặng code vào repo của bạn — sở hữu trọn vẹn, đổi gì cũng được, nhưng nâng cấp là việc của bạn.

### 3. Tailwind v4 CSS-first + Vite
`npm i tailwindcss @tailwindcss/vite`; plugin vào `vite.config.ts`; CSS `@import "tailwindcss"`; token trong `@theme { --color-primary: ... }`. Không `tailwind.config.js` kiểu v3. shadcn đọc token qua CSS vars — đổi theme không đụng component. Ví von: token như bảng màu chuẩn của công ty ghi trên một tấm poster — mọi người nhìn poster này mà vẽ, đổi poster là cả công ty đổi màu theo, không ai phải tô lại tranh của mình.

> **Tóm gọn 1 câu:** Tailwind v4 cấu hình ngay trong CSS (`@import` + `@theme`) — token một chỗ, mọi component tự đổi theo.

### 4. Variants pipeline: cva + clsx + tailwind-merge
`cva` định nghĩa biến thể có type (variant/size/defaultVariants); `clsx` nối class điều kiện; `tailwind-merge` giải xung đột (`px-4` vs `px-8` → giữ `px-8`). `cn()` = `twMerge(clsx(...))` — "style API" mọi component shadcn. Example mini trong bài là `cva` thủ công (object style thay class) để thấy bản chất map prop → style. Ví von: coi đây như dây chuyền lắp ráp class — `cva` là kho linh kiện theo loại variant, `clsx` là tay công nhân gắp linh kiện theo điều kiện, `tailwind-merge` là khâu kiểm cuối loại linh kiện thừa cùng loại.

> 📄 **Code ví dụ:** [`examples/03-4-variants-pipeline-cva-clsx-tailwind-merge.tsx`](examples/03-4-variants-pipeline-cva-clsx-tailwind-merge.tsx)

> **Tóm gọn 1 câu:** `cva` + `clsx` + `cn()` là dây chuyền biến prop thành class — có type, có điều kiện, và không bao giờ dư class xung đột.

### 5. MUI = Angular Material của React
Full set, theming (`ThemeProvider` + `sx`), sẵn dùng cho admin/prototype nhanh. Giá: bundle lớn, design theo MUI, trộn Tailwind bừa là specificity/theme chồng. Import named + tree-shaking khi chỉ cần vài component. Ví von: MUI như xôi gói lá trọn gói — mua về là ăn được ngay, nhưng muốn đổi nhân thì phải mở cả gói.

> **Tóm gọn 1 câu:** MUI cho tốc độ "lắp là chạy" cho admin — đổi lại bạn theo design và gánh bundle của nó.

### 6. Headless mạnh nhất a11y
Radix/Ark xử lý focus trap, ESC đóng, ARIA pattern phức tạp (dialog/combobox/menu), keyboard nav — tự viết dễ sót (quên `role`, focus không trap, ESC không đóng). Test bằng `getByRole` (DAY 21) để đảm bảo semantic (dùng `<button>` thật, không `<div onClick>`). Ví von: tự viết focus trap như tự rèn ổ khóa — làm được nhưng dễ sót khe; headless lib là ổ khóa có kiểm định sẵn.

> **Tóm gọn 1 câu:** Headless lib là "ổ khóa có kiểm định" a11y — focus trap, ESC, ARIA chuẩn sẵn, bạn chỉ việc bọc vải.

### Keyword chính
headless (Radix/Ark/Base UI: behavior + a11y, không style), styled/full-suite (MUI), shadcn/ui (copy-paste, sở hữu code), Tailwind v4 (`@import`, `@theme`), `cva` (variants có type), `clsx` (nối điều kiện), `tailwind-merge`/`cn()` (giải xung đột), theming (CSS vars/MUI theme).

> **Tóm gọn 1 câu:** 8 từ này là bản đồ chọn UI lib 2026: khung ghế (headless), vải bọc (Tailwind), bộ trọn gói (MUI), và nội thất đóng theo đơn (shadcn).

## Luồng hoạt động (Flow)
Mục này đi qua từng bước dựng UI kit từ Tailwind tới shadcn tới MUI/Radix — đọc để thấy thứ tự lắp ghép trong project thật.
1. Cài Tailwind v4 + Vite plugin; thêm vào `vite.config.ts`; CSS `@import "tailwindcss"` + `@theme` token. Không config JS v3.
2. `npx shadcn@latest init` — `components.json`, alias `@/`, `cn()` (`clsx` + `tailwind-merge`), theme CSS vars. `cn` là trái tim pipeline class.
3. `npx shadcn@latest add button` — copy `components/ui/button.tsx` (dùng `cva` variant default/outline/ghost + size + `cn`) vào repo. Sửa trong `src/`, không `node_modules`.
4. App `<Button variant="default">Lưu</Button>` → `cva` map variant → class Tailwind → CSS sinh style. `variant` union nên sai chính tả báo compile.
5. `Button` nhận `className` ngoài → `cn(variantClass, className)` hợp nhất, user thắng khi xung đột (nhờ `tailwind-merge`: `px-4` + `px-8` → `px-8`). Không `cn` là 2 class xung đột cùng tồn tại, kết quả theo thứ tự CSS (may rủi).
6. (MUI) `npm i @mui/material @emotion/react @emotion/styled` → `<Button variant="contained">` — style trong theme engine MUI, không phải Tailwind. Chọn 1 style system chính, không trộn bừa.
7. (Radix) `<Dialog.Root/Trigger/Content>` — Radix render hành vi + a11y; class bạn tự. Focus trap + ESC + `aria-modal` miễn phí.
8. Đổi theme (sáng/tối): CSS vars đổi → mọi component đọc token tự cập nhật, không re-render React. Token một chỗ, component không hardcode màu.

> **Tóm gọn 1 câu:** Luồng chuẩn 2026: Tailwind token → `shadcn add` copy code nhà → `cn()` gỡ xung đột → theme đổi ở tầng CSS, React chẳng phải render lại.

## Ví dụ chi tiết
Mục này cho code Button hoàn chỉnh từ mini tới shadcn thật — copy chạy rồi quay lại phần giải thích.
Khớp 1-1 với `example.tsx` (mini 3 variant + 3 size + disabled + a11y):

> 📄 **Code ví dụ:** [`examples/04-vi-du-chi-tiet.tsx`](examples/04-vi-du-chi-tiet.tsx)

shadcn/ui Button thật (component bạn sở hữu sau `add`):

> 📄 **Code ví dụ:** [`examples/05-vi-du-chi-tiet.tsx`](examples/05-vi-du-chi-tiet.tsx)

Hàm `cn()` — trái tim pipeline:

> 📄 **Code ví dụ:** [`examples/06-vi-du-chi-tiet.ts`](examples/06-vi-du-chi-tiet.ts)

## Giải thích từng phần
Mục này soi từng dòng của Button variants — đọc để hiểu bản chất variant pipeline trước khi dùng `cva` thật.
- Dòng `variant?: "primary" | "outline" | "ghost"`: union là "controlled vocabulary" — sai `"primay"` báo compile. `cva` variants cùng ý nhưng sinh class thay vì object. Thêm variant mới là thêm 1 nhánh map (mini) / 1 entry variants (cva) — không sửa nơi dùng.
- Dòng `variant = "primary"`, `size = "md"`: default destructuring = `defaultVariants` của cva. Vì sao default? Để 80% nơi dùng gọn (`<Button>Lưu</Button>`), 20% cần mới truyền.
- Khối `variantStyle`/`sizeStyle` thủ công ↔ class Tailwind: cùng map prop → style, khác công cụ. Hiểu mini thì `cva` không huyền bí: `cva` chỉ tách base (luôn có) + variants (theo prop) + default (mặc định) thành data thay vì `if`.
- Dòng `<button disabled>`: semantic + `disabled` thật (chặn click + focus + mờ). Vì sao không `<div onClick>`? Vì div mất keyboard (Tab/Enter), screen reader không biết là nút, phải tự `role/tabIndex/keyDown` — Radix/headless sinh để khỏi tự làm.
- Dòng `{saved && <p>Đã lưu!</p>}`: state-driven (DAY 2/19) — UI là hàm state, không `ref.textContent = ...`. Bấm Lưu/Hủy là `setSaved`, `<p>` theo.
- Dòng `cva` 3 phần (base/variants/default): base `inline-flex...` luôn có; variants theo prop; default khi không truyền. API style có type (`buttonVariants({ variant: "sai" })` báo).
- Dòng `clsx("p-2", isActive && "bg-blue-500")`: nối điều kiện gọn hơn nối chuỗi + `if`. `tailwind-merge` sau đó giải xung đột cùng thuộc tính (padding/margin/color) — giữ cái sau (user) bỏ cái trước (variant).
- Dòng Tailwind v4 `@theme`: token (`--color-primary`) một chỗ; shadcn class `bg-primary` đọc token. Đổi token là mọi Button/Nav đổi màu không sửa component — theming đúng nghĩa.

## Bảng so sánh Angular ↔ React
Mục này đối chiếu Angular Material/CDK với các hướng UI của React — đọc như tra từ điển khi chuyển dự án.

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

> **Cách đọc bảng này:** mỗi dòng là một mảnh của hệ UI Angular, cột giữa là các mảnh thay thế trong React, cột Ghi chú nêu khác biệt then chốt — tra theo mảnh đang cần chuyển, đừng học thuộc cả bảng.

## Lỗi thường gặp (Common pitfalls)
Mục này là "bản đồ bẫy" khi dùng thư viện UI — bundle phình, style đánh nhau, a11y vỡ; đọc trước để khỏi sửa về sau.

### 1. Import cả MUI cho 1 button → bundle phình
> 📄 **Code ví dụ:** [`examples/07-1-import-ca-mui-cho-1-button-bundle.tsx`](examples/07-1-import-ca-mui-cho-1-button-bundle.tsx)
> 📄 **Code ví dụ:** [`examples/08-1-import-ca-mui-cho-1-button-bundle.tsx`](examples/08-1-import-ca-mui-cho-1-button-bundle.tsx)

### 2. Trộn Tailwind + MUI không kiểm soát → specificity/theme chồng
Mô tả: class Tailwind `bg-blue-500` đấu với MUI emotion `background` — thứ tự khó đoán, theme 2 nơi. Fix: 1 style system chính; buộc trộn thì MUI `sx`/styled cho phần MUI, Tailwind cho phần riêng, không đè bừa.

### 3. Sửa trong `node_modules` (hiểu sai shadcn)
Mô tả: sửa `node_modules/@shadcn/...` (nếu quen package) — cài lại mất. Fix: shadcn copy vào `src/components/ui/` — sửa trong repo, commit như code mình.

### 4. Quên `cn()` (tailwind-merge) → class xung đột cùng tồn tại
> 📄 **Code ví dụ:** [`examples/09-4-quen-cn-tailwind-merge-class-xung-ot.tsx`](examples/09-4-quen-cn-tailwind-merge-class-xung-ot.tsx)
> 📄 **Code ví dụ:** [`examples/10-4-quen-cn-tailwind-merge-class-xung-ot.tsx`](examples/10-4-quen-cn-tailwind-merge-class-xung-ot.tsx)

### 5. `<div onClick>` thay `<button>` → mất a11y
> 📄 **Code ví dụ:** [`examples/11-5-div-onclick-thay-button-mat-a11y.tsx`](examples/11-5-div-onclick-thay-button-mat-a11y.tsx)
> 📄 **Code ví dụ:** [`examples/12-5-div-onclick-thay-button-mat-a11y.tsx`](examples/12-5-div-onclick-thay-button-mat-a11y.tsx)

### 6. Config Tailwind v3 cho v4 → không khớp
Mô tả: tạo `tailwind.config.js` + `content` kiểu v3 cho dự án v4. Fix: v4 CSS-first (`@import "tailwindcss"`, `@theme`) + plugin `@tailwindcss/vite` trong `vite.config.ts`.

### 7. Style inline mọi thứ → mất token/theme
Mô tả: `style={{ background: "#1976d2" }}` khắp app — rebrand sửa 50 file. Fix: class + token (`bg-primary`) — đổi 1 token xong. Inline chỉ demo/mini như example.

## Best practices / Mẹo
Mục này là "tủ đồ nghề" của người dựng UI kit: ma trận chọn lib, quy ước className, token một chỗ — đọc để quyết nhanh và làm đúng ngay từ đầu.
- **Ma trận chọn:** admin/prototype nhanh → MUI; prod mới kiểm soát + đẹp → shadcn + Tailwind v4; a11y đỉnh (dialog/combobox/menu) → Radix/Ark; design system riêng → Base UI + tokens. Vì sao ma trận? Vì mỗi hướng tối ưu một trục (tốc độ/kiểm soát/a11y) — không có "tốt nhất" chung.
- Component nhận `className` + `...props` "mở đuôi" — thói quen UI kit tốt. Vì sao? Để nơi dùng tùy biến (thêm `px-8`, `disabled`, `aria-*`) không sửa kit.
- **Mọi component nhận className qua `cn()`** — user ghi đè không xung đột. Vì sao quy ước? Để `px-8` ngoài luôn thắng `px-4` trong (merge), không may rủi.
- **Xuất cả component + variants** (`Button` + `buttonVariants`) — tái dùng class cho `<a>` styled như button. Vì sao? Để link trông như nút mà vẫn semantic `<a>`.
- Token (màu/spacing/radius) một chỗ (CSS vars/theme) — component đọc token, không hardcode. Vì sao? Để rebrand 1 chỗ.
- Test semantic `getByRole("button")` (DAY 21) — đảm bảo element đúng. Vì sao? Vì query theo role vỡ ngay khi ai đó đổi `<button>` thành `<div>`.

## Bài tập nhỏ
Làm tay để nhớ — mỗi bài là một thí nghiệm so sánh giữa các hướng lib hoặc giữa code thủ công và `cva`.

1. Mini thêm `ghost` + `size sm/md/lg` + `disabled` (như example đã có) — chuyển cùng API sang `cva` shadcn, so code thủ công vs cva (dài/gọn/type chỗ nào?).
2. MUI form (`TextField` + `Button` contained/outlined) vs shadcn/Tailwind form — so bundle (build size), thời gian code, tùy biến (đổi màu primary mấy chỗ?).
3. `npx shadcn add button` rồi so API với mini (variant/size/className) — khác gì ngoài class vs style?
4. `cn("px-4", "px-8")` → kiểm tra ra `"px-8"` (merge đúng); không `cn` thì ra gì và CSS quyết thế nào?
5. Đổi token primary — quan sát Button/Nav đổi màu không sửa component. Hardcode inline thì phải sửa mấy chỗ?

> **Tóm gọn 1 câu:** Chọn lib UI theo hoàn cảnh (MUI nhanh, shadcn sở hữu, Radix a11y) — và luôn có token + `cn()` để style không đánh nhau.

## Reference
- https://ui.shadcn.com/
- https://mui.com/
- https://www.radix-ui.com/
- https://tailwindcss.com/docs/installation/using-vite
- https://cva.style/docs
