# Q42: Button custom bấm chuột được mà bấm Tab không tới — em xử lý sao cho người dùng bàn phím dùng được?

## Câu hỏi

> Em làm một button/dropdown/modal custom — chuột bấm ngon, nhưng bấm Tab không tới được, Enter/Space không kích hoạt, screen reader đọc không hiểu. Em sửa sao để người dùng chỉ dùng bàn phím và screen reader vẫn xài được như người dùng chuột?

## Trả lời ngắn (elevator pitch, 30 giây)

Mục này là "bản nói 30 giây" — nêu được nguyên tắc "semantic HTML trước, ARIA sau" là đã ăn điểm tư duy; phần chi tiết bên dưới để đỡ khi bị hỏi từng nhóm việc.

- **Nguyên tắc: semantic HTML trước, ARIA sau** — dùng đúng thẻ (`<button>`, `<a>`, `<label>`, `<dialog>`) thì bàn phím + screen reader ăn sẵn, khỏi gồng. Chỉ khi thẻ native không đủ mới thêm ARIA.
- **3 việc phải đúng**: (1) **Bàn phím tới được + bấm được** — phần tử tương tác phải focus được bằng Tab, kích hoạt bằng Enter/Space, thoát bằng Escape, thấy được focus (`:focus-visible`). (2) **Screen reader hiểu được** — có tên (label), có trạng thái (`aria-expanded`, `aria-checked`, `aria-invalid`), có live region cho nội dung đổi sau render (`aria-live`). (3) **Focus không lạc** — mở modal/dropdown thì đưa focus vào, đóng thì trả focus về chỗ cũ, Tab không lọt ra ngoài.
- **Điểm ăn điểm**: "div onClick không phải button" — `div` + `onClick` thiếu hết: không Tab, không Enter, không tên. Sửa đúng là đổi sang `<button>`, không phải đắp `tabIndex` + `onKeyDown` lên `div`.

## Trả lời chi tiết

Mục này chia việc accessibility thành 4 nhóm theo thứ tự ưu tiên (đúng thẻ → bàn phím → screen reader → focus), rồi chốt bằng checklist tự kiểm — đọc để biến "biết khái niệm a11y" thành "làm được ngay trên component của mình".

### 1. Dùng đúng thẻ — 80% accessibility tự xong

| Sai (thường gặp) | Đúng | Vì sao |
|---|---|---|
| `<div onClick={open}>Mở</div>` | `<button onClick={open}>Mở</button>` | `button` có sẵn: Tab tới được, Enter/Space kích hoạt, screen reader đọc "button, Mở" |
| `<div onClick={go}>Xem thêm</div>` (chuyển trang) | `<a href="/more">Xem thêm</a>` | Link thật mới có context menu, mở tab mới, screen reader hiểu là điều hướng |
| `<span>Họ tên</span><input />` | `<label htmlFor="name">Họ tên</label><input id="name" />` | Label liên kết thì click chữ cũng focus input, screen reader đọc tên ô khi focus |
| `<input placeholder="Email" />` thay label | Label thật + `placeholder` chỉ là gợi ý | Placeholder biến mất khi gõ, screen reader nhiều khi bỏ qua, tương phản mờ |

> **Cách đọc bảng này:** mỗi dòng là một lỗi viết JSX thường gặp; cột "Đúng" cho ra thay thế gọn nhất (thường chỉ là đổi thẻ), cột "Vì sao" nêu mất mát cụ thể khi giữ thẻ sai — đọc cả bảng như một bảng "tra phạt": thấy đoạn code nào giống cột Sai là biết phải sửa thành gì.

### 2. Bàn phím: Tab tới được, bấm được, thấy được

- **Thứ tự Tab theo DOM** — đừng dùng `tabIndex` dương (`tabIndex={1}`, `{2}`…) để "nhảy cóc", nó phá thứ tự tự nhiên. Chỉ dùng `tabIndex={0}` (cho phần tử custom cần focus) và `tabIndex={-1}` (focus bằng code, không vào vòng Tab).
- **Phím chuẩn của từng pattern**: button = Enter/Space, link = Enter, dropdown/modal = Escape để đóng, listbox/menu = mũi tên lên xuống. Tự làm dropdown mà chỉ bấm chuột được là trượt.
- **Nhìn thấy focus** — đừng `outline: none` rồi bỏ trống. Thay bằng style rõ: `:focus-visible { outline: 2px solid ...; outline-offset: 2px; }`.

> 📄 **Code ví dụ:** [`examples/01-2-ban-phim-tab-toi-uoc-bam-uoc.tsx`](examples/01-2-ban-phim-tab-toi-uoc-bam-uoc.tsx)

### 3. Screen reader: tên, trạng thái, thay đổi động

- **Mọi control phải có tên**: icon-button chỉ có SVG thì thêm `aria-label`: `<button aria-label="Đóng">✕</button>`. Input lỗi thì nối message bằng `aria-describedby` + `aria-invalid`.
- **Trạng thái phải đọc được**: dropdown mở/đóng → `aria-expanded`, tab đang chọn → `aria-selected`, checkbox custom → `role="checkbox" aria-checked`.
- **Nội dung đổi sau render cần live region**: danh sách search, toast, lỗi form submit — bọc `aria-live="polite"` để SR tự đọc khi đổi, khỏi cần focus ép.

> 📄 **Code ví dụ:** [`examples/02-3-screen-reader-ten-trang-thai-thay-oi.tsx`](examples/02-3-screen-reader-ten-trang-thai-thay-oi.tsx)

### 4. Quản lý focus: modal là bài kinh điển

Mở modal mà focus vẫn nằm ở trang sau, Tab lọt ra ngoài, đóng xong focus mất hút — cả 3 đều trượt phỏng vấn. Hãy hình dung modal là một căn phòng riêng: mở cửa thì dẫn khách vào phòng (đưa focus vào), khách muốn ra thì mở cửa cho (Escape), và đi xong phải tiễn về đúng chỗ cũ (trả focus) — chứ không để khách đứng lơ lửng giữa sảnh.

> 📄 **Code ví dụ:** [`examples/03-4-quan-ly-focus-modal-la-bai-kinh.tsx`](examples/03-4-quan-ly-focus-modal-la-bai-kinh.tsx)

Thực chiến thì dùng `<dialog>` native hoặc thư viện (Radix) đã lo focus-trap sẵn — tự viết trap bằng tay dễ sót.

### 5. Check nhanh trước khi kêu "xong"

1. **Rút chuột ra**: Tab đi hết flow chính được không? Có thấy focus không? Escape đóng được modal/dropdown không?
2. **Chạy axe** (eslint-plugin-jsx-a11y + @axe-core/react, hoặc tab Lighthouse) — bắt label thiếu, contrast fail, ARIA sai.
3. **Tương phản + cỡ chữ**: text nhỏ/placeholder xám mờ rất dễ fail WCAG contrast — đừng chỉ check bằng mắt trên màn hình xịn.

> **Tóm gọn 1 câu:** Accessibility bắt đầu từ việc "xài đúng thẻ nhà làm" (button, label, dialog) — bàn phím đi được, máy đọc hiểu được, focus không lạc; ARIA chỉ là gia cố thêm, không phải móc cứu `div`.

## Bẫy khi phỏng vấn

Mục này là "bản đồ mìn": 5 câu trả lời nghe hợp lý nhưng sai — a11y là chủ đề dễ "đắp vá cho qua" mà thật ra bị soi rất kỹ.

1. **"`div` + `onClick` + `tabIndex={0}` là xong accessibility"** → **sai**: vẫn thiếu kích hoạt Enter/Space, thiếu role/tên, thiếu trạng thái. Đáp án đúng là **đổi sang thẻ native** (`button`/`a`), không đắp ARIA lên `div`.
2. **`tabIndex` dương để "ưu tiên"** (`tabIndex={1}` cho nút chính) → **sai**: phá thứ tự Tab tự nhiên, bảo trì ác mộng. Chỉ dùng `0` / `-1`.
3. **`outline: none` cho "đẹp"** → **sai** nếu không thay thế: người dùng bàn phím mù luôn vị trí. Phải có `:focus-visible` thay thế.
4. **Dùng `placeholder` thay `<label>`** → **sai**: placeholder mất khi gõ, SR hay bỏ qua, contrast thường fail. Label thật là bắt buộc.
5. **`aria-hidden` đè lên phần tử focus được** → **sai nặng**: SR bị giấu mà Tab vẫn tới → "focus ma". Hoặc giấu là giấu cả cụm (kèm `inert`), hoặc đừng giấu.

> **Tóm gọn 1 câu:** Bẫy lớn nhất là đắp ARIA lên thẻ sai thay vì đổi thẻ — vá `tabIndex` + `onKeyDown` lên `div` là làm nghề hậu kỳ, còn dùng `<button>` là sửa tận gốc.

## Gợi ý câu chốt

Mục này gói cả bài thành một đoạn trả lời mẫu — đọc để tập nói trọn một hơi rồi diễn đạt lại bằng giọng của mình.

> "Accessibility = **thẻ đúng trước, ARIA sau**: button/link/label/dialog native cho miễn phí bàn phím + semantics. Việc của em là (1) **Tab tới + bấm được + thấy focus** (không tabIndex dương, không outline:none chùa), (2) **SR hiểu** (tên qua label/aria-label, trạng thái qua aria-*, nội dung động qua aria-live), (3) **focus không lạc** (modal mở đưa vào, đóng trả về, Escape đóng được). Check bằng **keyboard-only + axe**. Câu thần chú: div onClick không phải button."

## Reference

- [MDN: ARIA basics](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA)
- [WAI-ARIA Authoring Practices (APG)](https://www.w3.org/WAI/ARIA/apg/) — pattern chuẩn cho dropdown, dialog, listbox
- [axe DevTools / eslint-plugin-jsx-a11y](https://github.com/jsx-eslint/eslint-plugin-jsx-a11y) — bắt lỗi tự động
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/) — check tương phản

## Câu hỏi liên quan

- **Hỏi tiếp (liên tục)**: [Q11 — focus vào input trong con thế nào?](../11-parent-calls-child-method/README.md) · [Q34 — giữ ref cho N ô input?](../34-ref-callback-n-items/README.md)
- **Đào sâu (xuyên nhóm)**: [Q17 — label nối với input ra sao?](../17-controlled-form/README.md) · [Q39 — vùng loading/skeleton có cần báo cho SR?](../39-loading-skeleton-suspense/README.md)
