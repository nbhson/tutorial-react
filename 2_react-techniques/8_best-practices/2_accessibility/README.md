# Accessibility (a11y)

> Nguồn: https://react.dev/learn/accessibility — https://www.w3.org/WAI/ARIA/apg/

## Mục tiêu
- Dùng semantic HTML đúng: nút/nav/main/heading thay cho `div onClick`.
- Quản lý focus, label, thông báo lỗi cho screen reader.
- Kiểm tra bằng công cụ (eslint jsx-a11y, axe, keyboard walkthrough) và tôn trọng `prefers-reduced-motion`.

## Tổng quan
- a11y là yêu cầu sản phẩm (người dùng điều hướng bằng bàn phím/screen reader), không phải "nice to have".
- Gốc rễ: React render HTML thật — nếu dùng đúng thẻ semantic, phần lớn accessibility miễn phí.
- Áp dụng từ lúc viết component; retro-fit đắt hơn nhiều.
- Đối chiếu Angular `8_best-practices/a11y`: cùng chuẩn WAI-ARIA, khác cách bind trong JSX.

## Khái niệm cốt lõi
- **Semantic HTML trước, ARIA sau**: `<button>` có sẵn focus/keyboard/role; `div onClick` không. Quy tắc đầu tiên của ARIA là "đừng dùng ARIA nếu HTML đã làm được".
- **Accessible name**: button/link cần tên đọc được — text bên trong, hoặc `aria-label`. Icon-only button bắt buộc có `aria-label`.
- **Label liên kết**: mọi input có `<label htmlFor>` hoặc `aria-label`; dùng `useId()` để ghép id (đặc biệt khi render nhiều bản).
- **Trạng thái động**: `aria-invalid` + `aria-describedby` cho lỗi; `aria-busy`, `aria-expanded` cho menu/accordion; `role="alert"` cho thông báo quan trọng (screen reader đọc ngay).
- **Focus management**: modal trap focus + `Esc` đóng + trả focus về nút mở; route change đưa focus về đầu trang/tiêu đề.
- **`prefers-reduced-motion`**: tôn trọng khi tắt animation.
- **Công cụ**: `eslint-plugin-jsx-a11y` (tĩnh), axe DevTools (runtime), keyboard walkthrough (thủ công).

## Luồng hoạt động / Cách áp dụng
1. Viết UI bằng thẻ semantic; thêm ARIA chỉ khi cần.
2. Gắn label + mô tả lỗi cho mọi input.
3. Kiểm tra bằng bàn phím: Tab, Shift+Tab, Enter, Space, Esc có hoạt động?
4. Chạy axe DevTools + eslint jsx-a11y trên các flow chính.
5. Với modal/menu phức tạp, dùng Radix/`@ariakit`/React Aria thay vì tự viết.
6. Kiểm tra `prefers-reduced-motion` và độ tương phản màu (>= 4.5:1 cho text thường).

## Ví dụ chi tiết
```tsx
import { useId } from 'react';

// Form field accessible: label liên kết id, lỗi báo qua role="alert"
export function EmailField({ error }: { error?: string }) {
  const id = useId();                 // id duy nhất — tránh trùng khi render nhiều field
  const errId = `${id}-err`;          // id cho vùng lỗi để aria-describedby trỏ tới
  return (
    <div>
      <label htmlFor={id}>Email</label>
      <input
        id={id}
        type="email"
        autoComplete="email"          // giúp autofill + trình đọc màn hình
        aria-invalid={!!error}        // báo trạng thái lỗi cho AT
        aria-describedby={error ? errId : undefined} // liên kết input với thông báo lỗi
      />
      {error && (
        <p id={errId} role="alert" style={{ color: 'red' }}>
          {error}
        </p>
      )}
    </div>
  );
}
```

```tsx
// Icon button: tên accessible qua aria-label, icon ẩn với AT
export function CloseButton({ onClose }: { onClose: () => void }) {
  return (
    <button type="button" aria-label="Đóng menu" onClick={onClose}>
      <XIcon aria-hidden /> {/* icon trang trí — không cho screen reader đọc */}
    </button>
  );
}
```

```css
/* Tôn trọng người dùng muốn giảm chuyển động */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

## Giải thích từng phần
- `useId()`: tạo id ổn định, không trùng — đúng cách ghép `label`/`input` trong React.
- `aria-invalid` + `aria-describedby`: screen reader biết input đang lỗi và đọc luôn thông báo.
- `role="alert"`: vùng "live region" — thông báo được đọc ngay khi xuất hiện.
- `aria-hidden` trên icon: icon trang trí không làm nhiễu nội dung đọc.
- `prefers-reduced-motion`: giảm/tắt animation cho người nhạy cảm chuyển động.

### Checklist a11y nhanh cho mỗi component
```text
[ ] Dùng thẻ semantic đúng (button/a/nav/main/h1-h6)?
[ ] Điều hướng được bằng Tab, kích hoạt bằng Enter/Space?
[ ] Mọi input có label (hoặc aria-label)?
[ ] Trạng thái lỗi/đang tải có thông báo cho screen reader (role="alert"/aria-live)?
[ ] Ảnh có alt phù hợp; icon trang trí có aria-hidden?
[ ] Tương phản màu đạt >= 4.5:1 cho text thường?
[ ] Modal/menu trap focus + Esc đóng + trả focus?
```

## Lỗi thường gặp / Chống chỉ định
- **`div`/`span` giả button**: không focus/keyboard → dùng `<button>`, chỉ `role="button"`+`tabIndex` khi bất khả kháng.
- **Input không label**: screen reader chỉ đọc "edit text" → thêm `<label>` hoặc `aria-label`.
- **Chỉ báo lỗi bằng màu**: người mù màu không nhận ra → dùng cả text/icon + `role="alert"`.
- **Modal không trap focus**: Tab lạc ra ngoài → dùng thư viện headless hoặc trap thủ công + trả focus.
- **Animation mạnh bỏ qua `prefers-reduced-motion`**: gây khó chịu → thêm media query.

## Best practices / Mẹo
- Test bằng bàn phím là nhanh nhất — nếu Tab/Enter làm được mọi việc, cơ bản đã ổn.
- `eslint-plugin-jsx-a11y` bắt lỗi phổ biến ngay khi code.
- Đặt `main`, một `h1`/trang, thứ bậc heading không nhảy cấp.
- Dùng component headless (Radix, React Aria, ariakit) cho combobox/menu/dialog phức tạp.
- Kiểm tra tương phản màu; kiểm tra ở zoom 200%.

## Bài tập nhỏ
Chuyển một `div` clickable giả button thành `<button>` đúng chuẩn (có `type`, accessible name, phản hồi bàn phím). Thêm `aria-live="polite"` cho vùng kết quả tìm kiếm và chạy axe DevTools để xác nhận không còn cảnh báo.

## Reference
- [React — Accessibility](https://react.dev/learn/accessibility)
- [ARIA Authoring Practices (APG)](https://www.w3.org/WAI/ARIA/apg/)
- [axe DevTools](https://www.deque.com/axe/devtools/)
- [WebAIM — Contrast Checker](https://webaim.org/resources/contrastchecker/)