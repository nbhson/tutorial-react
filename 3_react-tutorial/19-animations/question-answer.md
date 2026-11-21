# DAY 19 — Hỏi & Đáp: Animations

> File hỏi–đáp chi tiết cho `3_react-tutorial/19-animations`.
> Đọc kèm: `README.md` (lý thuyết) + `example.tsx` (CSS transition chạy được, không cần lib).

---

## 1. Animation trong React khác `@angular/animations` ở đâu?

**Hỏi:** Angular khai trigger/state/transition trong metadata, React khai ở đâu?

**Đáp:**
- **Không khai ở đâu cả** — React không có hệ animation built-in. Animation là **hệ quả của state đổi**:
  re-render với class/style mới → trình duyệt nội suy transition.
- Trong example: `setOpen` đổi state → `opacity`/`transform` đổi giá trị → CSS `transition: 200ms`
  nội suy mượt. Không có JS animation frame nào chạy — toàn bộ "mượt" là của trình duyệt.
- Ví von: React không thuê vũ công riêng — bạn đổi trạng thái sân khấu, trình duyệt tự lo chuyển cảnh.

> **Tóm gọn 1 câu:** React không có animation engine — animation chỉ là state đổi rồi trình duyệt nội suy transition.

---

## 2. State-driven animation nghĩa là gì? Vì sao `pointerEvents` cũng theo state?

**Hỏi:** Ẩn bằng `opacity: 0` là đủ, sao còn `pointerEvents: none`?

**Đáp:**
- State-driven = **mọi khía cạnh hiển thị đều suy từ state**. `opacity: 0` chỉ làm trong suốt —
  element **vẫn trong DOM**, vẫn nhận click! Nên phải kèm `pointerEvents: "none"` để nút ẩn không chặn click,
  hiện thì `"auto"`. Quên là có "ma bấm được" trên màn hình.
- Muốn gỡ hẳn khỏi DOM khi ẩn (thay vì giữ) → conditional render + `<AnimatePresence>` (câu 4).

---

## 3. CSS transition đủ cho những gì? Khi nào cần Motion?

**Hỏi:** Chỉ CSS có làm được mọi hiệu ứng không?

**Đáp:**
- **CSS đủ cho ~80% micro-interaction**: hover, fade, slide, scale — như example, vài dòng style theo state là xong.
- Cần **Motion** (tên mới của Framer Motion, 2024) khi: enter/**exit** khi unmount, **layout animation**
  (list đổi thứ tự tự trượt), gesture (`whileHover`/`whileTap`), chuỗi/stagger phức tạp.
- **React Spring** cho chuyển động vật lý (spring) tự nhiên — ít phổ biến hơn Motion năm 2026.

---

## 4. `<AnimatePresence>` giải quyết gì? Vì sao React cần nó?

**Hỏi:** `{open && <div/>}` tắt là mất luôn, animate exit kiểu gì?

**Đáp:**
- React **gỡ DOM ngay** khi element biến khỏi cây — không có pha "đang exit". Viết transition exit
  thuần là vô ích vì node đã mất trước khi kịp chạy.
- `<AnimatePresence>` **hoãn việc xóa** đến khi animation `exit` chạy xong: `{open && <motion.div exit={...}/>}`
  tắt → chạy exit → xong mới remove. Đây là mảnh quan trọng nhất khi chuyển từ CSS sang Motion.
- Ví von: AnimatePresence cho diễn viên đóng xong phân cảnh từ biệt được vài giây trước khi lui hậu trường —
  không có nó là đạo diễn tắt đèn giữa chừng.

> **Tóm gọn 1 câu:** React gỡ DOM ngay lập tức — AnimatePresence hoãn việc gỡ cho exit chạy xong mới "lui sân khấu" thật.

---

## 5. `prefers-reduced-motion` là gì? Vì sao bắt buộc tôn trọng?

**Hỏi:** User tắt hiệu ứng trong OS thì app mình sao?

**Đáp:**
- Một số user (rối loạn tiền đình, say chuyển động) bật **giảm chuyển động** ở OS. App phải tôn trọng:
  CSS media query tắt transition, hoặc `useReducedMotion()` của Motion để bỏ animate.
- Quy tắc: **nội dung vẫn đúng đầy đủ, chỉ không animate** — ẩn/hiện chuyển thành hiện ngay, không phải mất nội dung.

---

## 6. Vì sao animate `transform`/`opacity` mà không phải `width`/`top`?

**Hỏi:** Trượt menu bằng `left: 0 → 200px` cũng mượt mà, sao README cấm?

**Đáp:**
- Khác ở **pipeline trình duyệt**: `transform`/`opacity` chạy ở tầng **composite** (GPU ghép lớp, không tính lại layout) — 60fps nhẹ. `width`/`height`/`top`/`margin` chạm tầng **layout**: mỗi frame trình duyệt đo lại kích thước + vị trí + vẽ lại cả vùng, list dài là giật, mobile nóng máy.
- Cơ chế example đúng: `translateY(8px → 0)` + `opacity` — cùng hiệu ứng trượt mà rẻ. Muốn "mở rộng" accordion thì dùng `transform: scaleY` hoặc trick `grid-template-rows: 0fr → 1fr` (nội suy được), không animate `height` trực tiếp.
- Đo thật: mở DevTools Performance, record lúc animate — animate `left` thấy vệt layout/reflow tím dài, `transform` chỉ compositing xanh ngắn. Đây là bằng chứng chứ không phải lý thuyết suông.

| Thuộc tính | Tầng trình duyệt | Giá |
|---|---|---|
| `transform` / `opacity` | Composite (GPU) | Rẻ, 60fps |
| `width` / `height` / `top` / `margin` | Layout + paint lại | Đắt, giật khi list dài |

> **Cách đọc bảng này:** mỗi dòng là một nhóm thuộc tính animate được — cột giữa cho biết nó chạm tầng nào của trình duyệt, cột Giá trả lời "có đáng không". Quy tắc rút ra: ưu tiên dòng đầu, né dòng hai.

---

## 7. Giữ element trong DOM vs `<AnimatePresence>`: hai đường exit khác gì?

**Hỏi:** Example giữ div ẩn bằng opacity, Motion lại `{open && <motion.div/>}` — chọn đường nào?

**Đáp:**
- Hai đường cho hai nhu cầu. **Giữ trong DOM** (example: `opacity 0 + pointerEvents none`) — transition chạy cả 2 chiều vào/ra bằng CSS thuần, không cần lib; giá là node ẩn vẫn trong cây (100 accordion giữ 100 node). Hợp cho toggle nhanh, số lượng ít, micro-interaction.
- **Gỡ khỏi DOM + AnimatePresence** — node tắt thì chạy `exit` xong mới remove, cây gọn, screen reader không thấy nội dung ẩn; giá là phải cài Motion. Hợp cho modal/drawer/list điều kiện, nội dung nặng hoặc cần a11y sạch.
- Sai thì sao: conditional `{open && <div class="fade">}` + CSS thuần mà mong có exit — DOM gỡ ngay trước khi transition kịp chạy nên tắt là "cụp" liền, không mượt. Fix: hoặc giữ node (opacity), hoặc bọc AnimatePresence — không có đường thứ ba.

> 📄 **Code ví dụ:** [`examples/01-7-giu-element-trong-dom-vs-animatepresence-hai.tsx`](examples/01-7-giu-element-trong-dom-vs-animatepresence-hai.tsx)

---

## 8. Motion `layout` + `staggerChildren`: list reorder trượt và hiện nối đuôi thế nào?

**Hỏi:** Sắp xếp lại list (như DAY 20) mà item nhảy cục — Motion làm mượt kiểu gì?

**Đáp:**
- Cơ chế `layout`: Motion đo vị trí/kích thước item **trước và sau** khi list đổi thứ tự, rồi animate `transform` từ cũ sang mới — mắt thấy item "trượt" về chỗ mới thay vì nhảy. CSS transition không làm gọn được vì thứ tự DOM đổi là layout mới hoàn toàn, không có giá trị cũ để nội suy.
- `staggerChildren`: container khai `transition={{ staggerChildren: 0.05 }}` thì các con hiện **nối đuôi** (mỗi con trễ 0.05s) — hiệu ứng cao cấp cho menu/list mount. Khai ở variants cha, con chỉ cần variants `hidden/show`.
- Sai thì sao: bật `layout` cho list 500 item mà không đo perf — mỗi lần reorder đo 500 node, mobile giật. Fix: list lớn thì chỉ `layout` cho vùng nhìn thấy, hoặc tắt khi reduced-motion. Kết hợp DAY 20: sortable + `layout` là combo Kanban mượt chuẩn prod.

> 📄 **Code ví dụ:** [`examples/02-8-motion-layout-staggerchildren-list-reorder-truot-va.tsx`](examples/02-8-motion-layout-staggerchildren-list-reorder-truot-va.tsx)

---

## 9. Lỗi thực chiến: `key` đổi mỗi render + transition chạy ngay lần mount đầu?

**Hỏi:** List có AnimatePresence mà exit/enter chạy loạn, trang vừa mở đã thấy fade lạ — vì sao?

**Đáp:**
- **`key` không ổn định**: `key={Math.random()}` hoặc `key={index}` cho list reorder thì mỗi render React tưởng toàn item mới — unmount hết cũ (chạy exit hàng loạt) + mount hết mới (chạy enter hàng loạt). Sửa đúng một `key` là hết loạn — nối trực tiếp DAY 2/20.
- **Transition chạy ngay mount đầu**: element mount với giá trị "cuối" (visible) nhưng CSS vẫn nội suy từ giá trị mặc định — trang mở đã thấy fade không mong muốn. Fix Motion: `initial={false}` (bỏ animation lần đầu, chỉ animate từ lần đổi sau); fix CSS: tách class mount (không transition) rồi thêm transition sau 1 frame.
- Cơ chế chung: animation là **hiệu của 2 render** (cũ→mới) — mount đầu không có "cũ" nên phải định rõ `initial`. Quên là hiệu ứng chạy sai thời điểm.

> 📄 **Code ví dụ:** [`examples/03-9-loi-thuc-chien-key-oi-moi-render.tsx`](examples/03-9-loi-thuc-chien-key-oi-moi-render.tsx)

---

## 10. `prefers-reduced-motion` + `useReducedMotion`: code và kiểm thử thế nào?

**Hỏi:** User bật giảm chuyển động ở OS thì app phải làm gì cụ thể, test ở đâu?

**Đáp:**
- Quy tắc bất di bất dịch: **nội dung vẫn đúng đầy đủ, chỉ không animate** — ẩn/hiện thành hiện ngay, trượt thành nhảy ngay. Không được bỏ nội dung, không được giữ transition dài cho đối tượng này (rối loạn tiền đình, say chuyển động là lý do y tế thật).
- Hai tầng: CSS toàn cục `@media (prefers-reduced-motion: reduce)` tắt `transition/animation-duration` cho mọi element (lưới an toàn cho CSS transition như example); JS Motion dùng `useReducedMotion()` trả boolean để bỏ `layout/stagger` và rút `duration` về 0 cho đường Motion.
- Kiểm thử: DevTools → Rendering → emulate `prefers-reduced-motion: reduce`, toggle UI xem chuyển ngay không mượt; screen reader vẫn đọc đủ nội dung. Đây là checklist a11y bắt buộc trước khi merge animation, không phải nice-to-have.

> 📄 **Code ví dụ:** [`examples/04-10-prefers-reduced-motion-usereducedmotion-code-va-kiem.tsx`](examples/04-10-prefers-reduced-motion-usereducedmotion-code-va-kiem.tsx)

> 📄 **Code ví dụ:** [`examples/05-10-prefers-reduced-motion-usereducedmotion-code-va-kiem.css`](examples/05-10-prefers-reduced-motion-usereducedmotion-code-va-kiem.css)

---

## Reference

- `README.md` + `example.tsx` trong cùng thư mục (DAY 19)
- https://motion.dev/ (Motion, AnimatePresence, layout)
- https://developer.mozilla.org/en-US/docs/Web/CSS/prefers-reduced-motion
