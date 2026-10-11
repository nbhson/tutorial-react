# Accessibility (a11y)

> Nguồn: https://react.dev/learn/accessibility — https://www.w3.org/WAI/ARIA/apg/

## Mục tiêu

### 1. Dùng semantic HTML đúng: nút/nav/main/heading thay cho `div onClick`

**Vì sao:** `<button>` có sẵn focus (Tab tới được), keyboard (Enter/Space kích hoạt), role (screen reader đọc "button"), trạng thái (disabled). `div onClick` không có gì cả — user bàn phím không tới được, screen reader đọc "text" (không biết bấm được), không disabled đúng. Quy tắc đầu tiên của ARIA là "đừng dùng ARIA nếu HTML làm được" — semantic là a11y miễn phí.

**Cơ chế:** React render HTML thật — thẻ đúng là trình duyệt + AT (assistive technology) hiểu ngay, không cần code thêm. Thẻ sai phải bù bằng `role` + `tabIndex` + key handler + focus style — 20 dòng để bằng 1 thẻ đúng.

```tsx
// ❌ SAI: div giả button — Tab không tới, Enter không bấm, SR không đọc là nút
<div onClick={dong}>X</div>
// ✅ ĐÚNG: button thật — focus/keyboard/role miễn phí
<button type="button" onClick={dong}>Đóng</button>
```

**Usecase thực tế:** mọi nút/icon-link/menu trong app. Quy tắc nhận diện: cái gì bấm được thì `button`/`a`; điều hướng thì `a`/`Link`; tiêu đề thì `h1-h6` đúng cấp; vùng chính thì `main`/`nav`/`header`. Chỉ `role="button"` + `tabIndex={0}` khi bất khả kháng (lib cũ render div).

### 2. Quản lý focus, label, thông báo lỗi cho screen reader

**Vì sao:** user SR "nhìn" bằng tai + Tab. Input không label thì SR đọc "edit text" (không biết nhập gì). Lỗi chỉ màu đỏ thì mù màu không biết. Modal không trap focus thì Tab lạc ra ngoài (bấm nhầm nền). Route đổi mà focus ở cuối trang thì SR đọc tiếp chỗ cũ (lạc). Mỗi thứ một thuộc tính: `label`/`aria-label` (tên), `aria-invalid` + `aria-describedby` (lỗi), `role="alert"` (đọc ngay), trap + `Esc` + trả focus (modal), focus đầu trang khi đổi route.

### 3. Kiểm tra bằng công cụ (eslint jsx-a11y, axe, keyboard walkthrough) và tôn trọng `prefers-reduced-motion`

**Vì sao một công cụ không đủ:** eslint bắt tĩnh (thiếu alt, thiếu label) lúc gõ; axe bắt runtime (tương phản, cấu trúc) lúc chạy; keyboard walkthrough (Tab/Enter/Esc tay) bắt trải nghiệm thật (trap, thứ tự). Ba lớp như unit/integration/e2e. `prefers-reduced-motion` là tôn trọng OS (slide/parallax gây chóng mặt) — media query tắt animation khi user yêu cầu.

## Tổng quan

- a11y là yêu cầu sản phẩm (người dùng bàn phím/screen reader), không phải "nice to have". Kiện tụng + hợp đồng chính phủ + thị phần (15% dân số khuyết tật) đều đòi.
- Gốc rễ: React render HTML thật — dùng đúng thẻ semantic, phần lớn a11y miễn phí. ARIA chỉ khi HTML không đủ (menu phức tạp, live region, trạng thái động).
- Áp dụng từ lúc viết component; retro-fit (sửa sau) đắt gấp 10 (đổi thẻ = đổi CSS + test + snapshot). Mỗi component mới đi qua checklist a11y nhanh (mục Giải thích).
- Đối chiếu Angular `8_best-practices/a11y`: cùng chuẩn WAI-ARIA/APG, khác bind (JSX `htmlFor`/`aria-*` vs template `[attr.]`).

## Khái niệm cốt lõi

### 1. Semantic trước, ARIA sau — đừng ARIA khi HTML đủ

`<button>` > `div[role=button]`; `<a href>` > `span[onClick]`; `<h1>` > `div.lon`. ARIA là keo cho trường hợp HTML không có (tablist, tree, live region), không phải thay thẻ đúng. Thừa ARIA (`role="button"` trên `<button>`) gây nhiễu SR.

### 2. Accessible name — nút/link phải có tên đọc được

Text trong (`<button>Lưu</button>`), hoặc `aria-label` khi chỉ icon (`aria-label="Đóng menu"`). Icon-only không label là SR đọc "button" câm (không biết nút gì). Ảnh ý nghĩa cần `alt`; trang trí `alt=""` + `aria-hidden`.

```tsx
// ❌ SAI: icon câm — SR đọc "button" không biết làm gì
<button onClick={dong}><XIcon /></button>
// ✅ ĐÚNG: tên rõ + icon ẩn với AT (trang trí)
// (mirror CloseButton ở Ví dụ chi tiết)
<button type="button" aria-label="Đóng menu" onClick={dong}><XIcon aria-hidden /></button>
```

### 3. Label liên kết — mọi input có chủ

`<label htmlFor={id}>` + `<input id={id}>`, hoặc `aria-label` khi không label hiện. `useId()` sinh id ổn định không trùng khi render nhiều field (dùng counter tay là trùng khi 2 form cùng trang). `autoComplete` giúp autofill + SR (email, current-password...).

### 4. Trạng thái động — `aria-invalid`/`describedby` (lỗi), `aria-busy`/`expanded` (menu), `role="alert"` (đọc ngay)

Lỗi: `aria-invalid={!!error}` (SR biết đang lỗi) + `aria-describedby={errId}` (SR đọc luôn thông báo). Quan trọng: `role="alert"` (live region assertive — xuất hiện là đọc ngay, không đợi). Menu/accordion: `aria-expanded` (đóng/mở) + `aria-controls` (điều khiển cái gì). Đang tải: `aria-busy` + `aria-live="polite"` (đọc khi rảnh, không ngắt).

### 5. Focus management — modal trap + Esc + trả focus; route đổi đưa focus về đầu

Modal mở: focus vào dialog, Tab quẩn trong (trap), `Esc` đóng, đóng xong trả về nút mở (không để focus rơi vào không khí). Route đổi: `h1` đầu trang `tabIndex={-1}` + `.focus()` (SR đọc tiêu đề mới, không đọc tiếp chỗ cũ). Không làm là user lạc (Tab ra ngoài modal, SR đọc sai trang).

### 6. `prefers-reduced-motion` — tắt animation khi OS yêu cầu

```css
/* Tôn trọng người nhạy cảm chuyển động — animation mạnh thành tức thì */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; scroll-behavior: auto !important; }
}
```

Parallax/slide/spin là thủ phạm chính. Test bằng DevTools Rendering → Emulate reduce motion.

### 7. Công cụ — eslint tĩnh, axe runtime, keyboard tay

`eslint-plugin-jsx-a11y` (thiếu alt/label/role sai lúc gõ). axe DevTools (tương phản, heading order, landmark lúc chạy). Keyboard walkthrough (Tab hết flow, Enter/Space/Esc) — máy không thay được cảm giác Tab lạc. Ba lớp đi cùng mỗi PR flow chính.

## Luồng hoạt động / Cách áp dụng

### Bước 1. Viết semantic trước, ARIA chỉ khi cần

Nút/nav/main/heading đúng. Icon trang trí `aria-hidden`, ảnh ý nghĩa `alt`. Không `div onClick` mới.

### Bước 2. Mọi input có label + lỗi có `alert`

`useId` + `htmlFor` + `aria-invalid`/`describedby` + `role="alert"` như EmailField. Lỗi gồm text + icon (không chỉ màu).

### Bước 3. Keyboard walkthrough: Tab/Shift+Tab/Enter/Space/Esc

Tab hết flow chính không chuột. Mọi thứ bấm được đều tới + kích hoạt được. Modal trap + Esc + trả focus. Ghi lại chỗ Tab lạc để sửa.

### Bước 4. axe + eslint jsx-a11y trên flow chính

Eslint lúc code, axe lúc review (0 critical). Tương phản ≥ 4.5:1 (text thường), zoom 200% không vỡ.

### Bước 5. Modal/menu phức tạp dùng headless (Radix/ariakit/React Aria)

Combobox/menu/dialog tự viết dễ sai trap/arrow/aria (APG dài 50 trang). Headless lo sẵn, ta style. Không tự bịa khi lib đã đúng.

### Bước 6. Reduced-motion + heading order + landmark

Một `h1`/trang, không nhảy cấp (`h1` → `h3`). `main`/`nav`/`header` đúng. Animation tôn trọng OS.

## Ví dụ chi tiết

Mirror 1-1 với `example.tsx` cùng thư mục (không rút gọn — file thật chỉ có EmailField; CloseButton + CSS là khối bổ sung trong README gốc, giữ nguyên):

```tsx
// example.tsx — mirror đầy đủ, khớp từng dòng với file thật
import { useId } from 'react';

// Form field accessible: label liên kết id, lỗi báo qua role="alert"
// Vì sao 4 thuộc tính này: label để biết nhập gì, invalid để biết đang lỗi,
// describedby để đọc luôn thông báo, alert để đọc ngay khi xuất hiện
export function EmailField({ error }: { error?: string }) {
  const id = useId(); // id duy nhất, ổn định — tránh trùng khi render nhiều field cùng trang
  const errId = `${id}-err`; // id vùng lỗi để aria-describedby trỏ tới (không trùng field khác)
  return (
    <div>
      <label htmlFor={id}>Email</label> {/* liên kết với input qua id — bấm label là focus input */}
      <input
        id={id}
        type="email" // type đúng để mobile hiện bàn phím @ + validate cơ bản
        autoComplete="email" // giúp autofill + trình đọc màn hình biết đây là email
        aria-invalid={!!error} // báo trạng thái lỗi cho AT (không có là SR không biết đang lỗi)
        aria-describedby={error ? errId : undefined} // liên kết input với thông báo lỗi — focus là đọc lỗi
      />
      {error && (
        // role="alert": live region — xuất hiện là SR đọc ngay, không đợi user Tab tới
        <p id={errId} role="alert" style={{ color: 'red' }}>
          {error} {/* lỗi bằng TEXT (không chỉ màu) — mù màu vẫn biết */}
        </p>
      )}
    </div>
  );
}
```

```tsx
// Icon button — mirror từ README gốc (bổ sung cạnh example.tsx)
// Vì sao aria-label + aria-hidden: nút chỉ icon không có text — SR cần tên; icon trang trí cần ẩn
export function CloseButton({ onClose }: { onClose: () => void }) {
  return (
    <button type="button" aria-label="Đóng menu" onClick={onClose}>
      {/* type="button" để không submit form nhầm khi nằm trong form */}
      <XIcon aria-hidden /> {/* icon trang trí — không cho SR đọc (đọc là nhiễu "graphic X") */}
    </button>
  );
}
```

```css
/* Tôn trọng người dùng muốn giảm chuyển động (mirror từ README gốc) */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

## Giải thích từng phần

### `useId()` — id ổn định không trùng

Counter tay (`let i = 0`) trùng khi 2 form cùng trang + SSR hydration lệch (server/client đếm khác). `useId` prefix theo cây, SSR an toàn. Label/input/errId cùng gốc nên không bao giờ trỏ nhầm.

### `aria-invalid` + `aria-describedby` — SR biết lỗi + đọc lỗi

Thiếu: SR đọc "Email, edit text" dù đang đỏ (user không biết sai). Đủ: "Email, invalid, [nội dung lỗi]" — biết sai + sai gì trong một lần focus.

### `role="alert"` — live region đọc ngay

Không có: lỗi hiện mà SR im (đang đọc chỗ khác). Có: SR ngắt để đọc lỗi (assertive) — hợp lỗi submit quan trọng. Kết quả tìm kiếm (không khẩn) dùng `aria-live="polite"` (đọc khi rảnh).

### `aria-hidden` trên icon — trang trí im lặng

SR bỏ qua (không đọc "graphic"). Icon mang nghĩa (cảnh báo) thì `role="img"` + `aria-label`, không hidden.

### Checklist nhanh mỗi component (giữ từ README gốc + cách kiểm):

```text
[ ] Semantic đúng (button/a/nav/main/h1-h6)? — nhìn thẻ, không div onClick
[ ] Tab tới + Enter/Space kích hoạt? — walkthrough không chuột
[ ] Input có label/aria-label? — eslint jsx-a11y báo nếu thiếu
[ ] Lỗi/tải có role="alert"/aria-live? — SR đọc được trạng thái
[ ] Ảnh alt đúng, icon trang trí hidden? — axe kiểm
[ ] Tương phản ≥ 4.5:1? — WebAIM checker + axe
[ ] Modal trap + Esc + trả focus? — Tab thử, DevTools focus ring
```

## Lỗi thường gặp / Chống chỉ định

### 1. `div`/`span` giả button → không focus/keyboard

Dùng `<button>`; chỉ `role="button"` + `tabIndex={0}` + key handler khi bất khả kháng (lib cũ). Giả mà thiếu một trong ba là gãy một nhóm user.

### 2. Input không label → SR đọc "edit text" câm

`<label>` hoặc `aria-label`. Placeholder không thay label (mất khi gõ + SR đọc yếu).

### 3. Lỗi chỉ màu → mù màu không biết

Text + icon + `role="alert"`. Đỏ + "Email sai định dạng" + icon ⚠ là đủ 3 kênh (màu, chữ, hình).

### 4. Modal không trap → Tab lạc ra ngoài

Headless (Radix) hoặc trap tay (giữ Tab trong, Esc đóng, trả focus). Test: mở modal, Tab 20 lần — focus không ra ngoài là đạt.

### 5. Animation bỏ qua reduced-motion → chóng mặt

Media query trên + `useReducedMotion` cho JS animation (Motion). Test emulate ở DevTools.

## Best practices / Mẹo

### Bàn phím trước; eslint lúc gõ; landmark + heading; headless cho phức tạp; tương phản + zoom

Tab/Enter làm được hết là cơ bản ổn (nhanh nhất, không tool). `jsx-a11y` bắt lúc code. `main` + một `h1` + không nhảy cấp. Combobox/menu/dialog dùng Radix/Aria (đừng tự viết APG). Tương phản + zoom 200% trước khi merge.

## Bài tập nhỏ

1. `div` clickable giả button → `<button type>` + tên accessible + keyboard (Enter/Space có sẵn sau chuyển).
2. Vùng kết quả search thêm `aria-live="polite"` — SR đọc khi rảnh, không ngắt.
3. axe DevTools chạy flow: 0 critical mới xong. Ghi lỗi còn lại + cách sửa (thiếu label? tương phản? heading nhảy?).
4. Emulate reduced-motion, Tab hết flow, zoom 200% — ghi 3 phát hiện.

## Reference

- [React — Accessibility](https://react.dev/learn/accessibility)
- [ARIA Authoring Practices (APG)](https://www.w3.org/WAI/ARIA/apg/)
- [axe DevTools](https://www.deque.com/axe/devtools/)
- [WebAIM — Contrast Checker](https://webaim.org/resources/contrastchecker/)
