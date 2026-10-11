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

---

## 7. Giữ element trong DOM vs `<AnimatePresence>`: hai đường exit khác gì?

**Hỏi:** Example giữ div ẩn bằng opacity, Motion lại `{open && <motion.div/>}` — chọn đường nào?

**Đáp:**
- Hai đường cho hai nhu cầu. **Giữ trong DOM** (example: `opacity 0 + pointerEvents none`) — transition chạy cả 2 chiều vào/ra bằng CSS thuần, không cần lib; giá là node ẩn vẫn trong cây (100 accordion giữ 100 node). Hợp cho toggle nhanh, số lượng ít, micro-interaction.
- **Gỡ khỏi DOM + AnimatePresence** — node tắt thì chạy `exit` xong mới remove, cây gọn, screen reader không thấy nội dung ẩn; giá là phải cài Motion. Hợp cho modal/drawer/list điều kiện, nội dung nặng hoặc cần a11y sạch.
- Sai thì sao: conditional `{open && <div class="fade">}` + CSS thuần mà mong có exit — DOM gỡ ngay trước khi transition kịp chạy nên tắt là "cụp" liền, không mượt. Fix: hoặc giữ node (opacity), hoặc bọc AnimatePresence — không có đường thứ ba.

```tsx
import { motion, AnimatePresence } from "motion/react"; // npm i motion

function ExitDemo({ open }: { open: boolean }) {
  return (
    // AnimatePresence hoãn xóa node đến khi exit chạy xong (CSS thuần không làm được)
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: 8 }} // trạng thái lúc mount
          animate={{ opacity: 1, y: 0 }} // trạng thái ổn định
          exit={{ opacity: 0, y: 8 }} // chạy trước khi unmount rồi mới remove
          transition={{ duration: 0.2 }}
        >
          Nội dung có exit mượt
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

---

## 8. Motion `layout` + `staggerChildren`: list reorder trượt và hiện nối đuôi thế nào?

**Hỏi:** Sắp xếp lại list (như DAY 20) mà item nhảy cục — Motion làm mượt kiểu gì?

**Đáp:**
- Cơ chế `layout`: Motion đo vị trí/kích thước item **trước và sau** khi list đổi thứ tự, rồi animate `transform` từ cũ sang mới — mắt thấy item "trượt" về chỗ mới thay vì nhảy. CSS transition không làm gọn được vì thứ tự DOM đổi là layout mới hoàn toàn, không có giá trị cũ để nội suy.
- `staggerChildren`: container khai `transition={{ staggerChildren: 0.05 }}` thì các con hiện **nối đuôi** (mỗi con trễ 0.05s) — hiệu ứng cao cấp cho menu/list mount. Khai ở variants cha, con chỉ cần variants `hidden/show`.
- Sai thì sao: bật `layout` cho list 500 item mà không đo perf — mỗi lần reorder đo 500 node, mobile giật. Fix: list lớn thì chỉ `layout` cho vùng nhìn thấy, hoặc tắt khi reduced-motion. Kết hợp DAY 20: sortable + `layout` là combo Kanban mượt chuẩn prod.

```tsx
import { motion } from "motion/react";

function SortablePreview({ items }: { items: string[] }) {
  return (
    <ul>
      {items.map((it) => (
        // layout: đổi thứ tự mảng là item trượt về vị trí mới, không nhảy cục
        // key ổn định (DAY 2/20) là bắt buộc để Motion biết item nào đi đâu
        <motion.li key={it} layout transition={{ duration: 0.2 }}>
          {it}
        </motion.li>
      ))}
    </ul>
  );
}
```

---

## 9. Lỗi thực chiến: `key` đổi mỗi render + transition chạy ngay lần mount đầu?

**Hỏi:** List có AnimatePresence mà exit/enter chạy loạn, trang vừa mở đã thấy fade lạ — vì sao?

**Đáp:**
- **`key` không ổn định**: `key={Math.random()}` hoặc `key={index}` cho list reorder thì mỗi render React tưởng toàn item mới — unmount hết cũ (chạy exit hàng loạt) + mount hết mới (chạy enter hàng loạt). Sửa đúng một `key` là hết loạn — nối trực tiếp DAY 2/20.
- **Transition chạy ngay mount đầu**: element mount với giá trị "cuối" (visible) nhưng CSS vẫn nội suy từ giá trị mặc định — trang mở đã thấy fade không mong muốn. Fix Motion: `initial={false}` (bỏ animation lần đầu, chỉ animate từ lần đổi sau); fix CSS: tách class mount (không transition) rồi thêm transition sau 1 frame.
- Cơ chế chung: animation là **hiệu của 2 render** (cũ→mới) — mount đầu không có "cũ" nên phải định rõ `initial`. Quên là hiệu ứng chạy sai thời điểm.

```tsx
import { motion } from "motion/react";

function NoMountFlash({ open }: { open: boolean }) {
  return (
    // initial={false}: lần mount đầu hiện ngay, chỉ animate từ lần toggle sau
    <motion.div initial={false} animate={{ opacity: open ? 1 : 0 }} transition={{ duration: 0.2 }}>
      Nội dung không flash lúc mở trang
    </motion.div>
  );
}
```

---

## 10. `prefers-reduced-motion` + `useReducedMotion`: code và kiểm thử thế nào?

**Hỏi:** User bật giảm chuyển động ở OS thì app phải làm gì cụ thể, test ở đâu?

**Đáp:**
- Quy tắc bất di bất dịch: **nội dung vẫn đúng đầy đủ, chỉ không animate** — ẩn/hiện thành hiện ngay, trượt thành nhảy ngay. Không được bỏ nội dung, không được giữ transition dài cho đối tượng này (rối loạn tiền đình, say chuyển động là lý do y tế thật).
- Hai tầng: CSS toàn cục `@media (prefers-reduced-motion: reduce)` tắt `transition/animation-duration` cho mọi element (lưới an toàn cho CSS transition như example); JS Motion dùng `useReducedMotion()` trả boolean để bỏ `layout/stagger` và rút `duration` về 0 cho đường Motion.
- Kiểm thử: DevTools → Rendering → emulate `prefers-reduced-motion: reduce`, toggle UI xem chuyển ngay không mượt; screen reader vẫn đọc đủ nội dung. Đây là checklist a11y bắt buộc trước khi merge animation, không phải nice-to-have.

```tsx
import { motion, useReducedMotion } from "motion/react";

function RespectfulBox({ open }: { open: boolean }) {
  const reduce = useReducedMotion(); // true khi user bật giảm chuyển động ở OS
  return (
    <motion.div
      initial={false}
      // Tôn trọng user: giảm chuyển động thì duration 0 (hiện ngay), đủ nội dung
      animate={{ opacity: open ? 1 : 0 }}
      transition={{ duration: reduce ? 0 : 0.2 }}
    >
      Nội dung vẫn đủ khi tắt animation
    </motion.div>
  );
}
```

```css
/* Lưới an toàn CSS toàn cục: tắt mọi transition khi user yêu cầu */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
}
```

---

## Reference

- `README.md` + `example.tsx` trong cùng thư mục (DAY 19)
- https://motion.dev/ (Motion, AnimatePresence, layout)
- https://developer.mozilla.org/en-US/docs/Web/CSS/prefers-reduced-motion
