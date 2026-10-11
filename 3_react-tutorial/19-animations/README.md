# DAY 19: ANIMATIONS

## Mục tiêu bài học
- Nắm 3 lựa chọn animation React 2026: CSS/Tailwind transitions, **Motion** (tên mới của Framer Motion), React Spring — và biết khi nào dùng cái nào.
- Hiểu vì sao animation trong React là **state-driven**: đổi state → đổi class/style → CSS lo phần mượt.
- Tôn trọng `prefers-reduced-motion` và biết dùng `<AnimatePresence>` cho enter/exit.

## Khái niệm cốt lõi (Core)
- **Angular `@angular/animations` định nghĩa trigger/state/transition trong metadata component.** React không có hệ thống animation built-in — animation là kết quả của **state đổi** cộng với CSS (hoặc thư viện JS).
- **State-driven animation:** khi React re-render với style/class mới, trình duyệt nội suy transition. Ví dụ: `open ? "translateY(0)" : "translateY(8px)"` + `transition: transform 200ms`.
- **CSS transition đủ cho 80% micro-interaction** (hover, fade, slide, scale). Chỉ cần thêm class hoặc style theo state.
- **Motion (`motion` package)** — tiền thân Framer Motion đổi tên 2024. Cung cấp `motion.div`, `initial/animate/exit`, `<AnimatePresence>` (bắt sự kiện unmount để chạy exit), layout animation `layout`, gesture `whileHover`/`whileTap`.
- **`<AnimatePresence>` rất quan trọng:** React gỡ DOM ngay khi element biến khỏi cây; AnimatePresence "hoãn" việc xóa đến khi exit animation xong.
- **`prefers-reduced-motion`:** luôn tôn trọng user cài đặt giảm chuyển động — CSS media query hoặc `useReducedMotion()` của Motion.
- **React Spring** cho vật lý (spring) tự nhiên; ít phổ biến hơn Motion trong 2026.
- **Keyword chính:** state-driven, transition, transform, `AnimatePresence`, `motion.div`, `initial/animate/exit`, `layout`, `prefers-reduced-motion`, `whileHover`.

## Luồng hoạt động (Flow)
1. `App` render với `open = false`: khối `div` có `opacity: 0`, `transform: translateY(8px)`, `pointerEvents: none`.
2. User bấm "Toggle" → `setOpen(o => !o)` → state đổi → re-render.
3. Render mới: `opacity: 1`, `transform: translateY(0)`, `pointerEvents: auto` (cùng element DOM, chỉ style đổi).
4. Trình duyệt thấy `transition: opacity 200ms, transform 200ms` → nội suy mượt từ giá trị cũ sang mới. Không có JS animation frame nào chạy.
5. Bấm lần nữa → style quay về giá trị ẩn → fade/slide ngược. Element **vẫn trong DOM** (chỉ ẩn bằng opacity) nên transition chạy cả 2 chiều.
6. (Motion + AnimatePresence) Nếu conditional render `{open && <motion.div exit={...}/>}`: AnimatePresence giữ element đủ lâu để chạy `exit` rồi mới remove khỏi DOM.
7. Đổi state `open` kích hoạt transition; nếu `prefers-reduced-motion: reduce`, media query vô hiệu hóa transition → nội dung vẫn đúng, chỉ là không animate.
8. Với `motion.div layout`, khi list đổi thứ tự, Motion đo vị trí cũ/mới rồi animate `transform` — không có CSS transition nào làm gọn được việc này.

## Ví dụ chi tiết
```tsx
// example.tsx — DAY 19: CSS transition (không cần lib)
import { useState } from "react";

export default function App() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen((o) => !o)}>Toggle</button>
      <div
        style={{
          marginTop: 12,
          padding: 12,
          border: "1px solid #ccc",
          // Style đổi theo state -> CSS transition nội suy mượt
          opacity: open ? 1 : 0,
          transform: open ? "translateY(0)" : "translateY(8px)",
          transition: "opacity 200ms, transform 200ms",
          // Khi ẩn (opacity 0) chặn click vào nội dung
          pointerEvents: open ? "auto" : "none",
        }}
      >
        Nội dung fade/slide
      </div>
    </>
  );
}
```

```tsx
// Motion (Framer Motion mới) — `npm i motion`
import { motion, AnimatePresence } from "motion/react";

<AnimatePresence>
  {open && (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}     // chạy trước khi unmount
      transition={{ duration: 0.2 }}
    >
      Nội dung
    </motion.div>
  )}
</AnimatePresence>
```

Cùng hiệu ứng bằng Tailwind + tôn trọng reduced-motion:

```tsx
<div
  className={open ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"}
  style={{ transition: "opacity 200ms, transform 200ms" }}
>
  Nội dung fade/slide
</div>
```

```css
/* Vô hiệu hóa chuyển động khi user yêu cầu */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
}
```

## Giải thích từng phần
- `opacity: open ? 1 : 0`: animation chạy vì **giá trị thay đổi giữa 2 render** — đây là cốt lõi state-driven.
- `transform` thay vì `margin/top`: `transform` được GPU tăng tốc → mượt hơn, không gây layout reflow (perf).
- `transition: "opacity 200ms, transform 200ms"`: khai báo "nội suy thuộc tính nào, bao lâu". Có thể thay bằng Tailwind `transition-opacity duration-200`.
- `pointerEvents: open ? "auto" : "none"`: khối ẩn vẫn nằm trong DOM (để transition hoạt động) → chặn tương tác. Đây là chi tiết dễ quên.
- Khác biệt với Motion: CSS transition không cần thư viện, nhưng **không animate được lúc unmount** (vì DOM bị gỡ ngay). Đó là lý do cần AnimatePresence khi muốn exit animation cho element conditional.
- `motion.div layout`: animate khi vị trí/kích thước thay đổi (list reorder, expand) — không thể làm gọn bằng CSS.
- **Transition chỉ chạy khi giá trị đổi giữa 2 render** — element mount lần đầu với giá trị "cuối" sẽ không animate (cần `initial`/class khởi tạo).
- **`will-change`/GPU layer:** với animation phức tạp, cân nhắc `will-change: transform` — nhưng đừng lạm dụng gây tốn bộ nhớ.
- **Đừng animate `display`/`visibility` trực tiếp** — chúng không nội suy; dùng `opacity` + `transform`, hoặc `grid-template-rows` cho accordion.

## Bảng so sánh Angular ↔ React
| Angular | React | Ghi chú |
|---|---|---|
| `trigger/state/transition` | Motion `initial/animate/exit` | Angular metadata ↔ props Motion |
| `:enter` / `:leave` | `<AnimatePresence>` + `exit` | React cần lib để hoãn unmount |
| `animate("200ms")` | CSS `transition: 200ms` / `transition={{duration:0.2}}` | Cả hai đều ease mặc định |
| `[@trigger]="state"` | `style`/`class` theo state | React state-driven |
| `query()`/`stagger()` | Motion `transition.staggerChildren` | Motion API khai báo |
| `@angular/animations` built-in | CSS + Motion (chọn lib) | React không có built-in |
| `AnimationBuilder` imperative | Motion `useAnimate()` / controls | Cùng imperative khi cần |
| `AnimationCallback`/`done` | Motion `onAnimationComplete` | Callback sau animation |
| `@.disabled` (tắt animation) | `useReducedMotion()` / media query | Tôn trọng cài đặt user |

## Lỗi thường gặp (Common pitfalls)
- **Animate element bị conditional unmount bằng CSS transition** → không thấy exit vì DOM gỡ ngay. → Fix: giữ element trong DOM (opacity/visibility) hoặc dùng `<AnimatePresence>`.
- **Animate `width`/`height`/`top`/`margin`** → reflow, giật. → Fix: dùng `transform` (translate/scale) + `opacity`.
- **Quên `prefers-reduced-motion`** → người dùng nhạy cảm chuyển động khó chịu. → Fix: media query/CSS `@media (prefers-reduced-motion: reduce)` hoặc `useReducedMotion()`.
- **`key` thay đổi mỗi render trong list có AnimatePresence** → exit/enter chạy loạn. → Fix: key ổn định (DAY 2).
- **Transition kích hoạt ngay lần mount đầu** (không mong muốn) khi element vốn dĩ visible. → Fix: dùng `initial={false}` trong Motion hoặc tách class.
- **`pointerEvents` không reset** → khối "ẩn" vẫn chặn click. → Fix: set theo state như ví dụ.
- **Lạm dụng animation JS cho việc CSS làm được** → bundle + CPU thừa. → Fix: micro-interaction dùng CSS; layout/gesture mới dùng Motion.
- **Animate element khi vừa mount** → không thấy hiệu ứng vì không có giá trị cũ. → Fix: dùng `initial` (Motion) hoặc thêm class sau 1 frame.
- **Dùng `useEffect` + `setState` để trigger animation** → thêm vòng render, dễ nháy. → Fix: animation là hệ quả tự nhiên của state/CSS.

## Best practices / Mẹo
- **Thứ tự chọn:** CSS/Tailwind transition cho 80%; Motion cho layout/shared-element/AnimatePresence/gesture; React Spring khi muốn cảm giác vật lý đặc biệt.
- Đặt `transition` ở **style/class cố định**, chỉ đổi giá trị (opacity/transform) theo state — tránh khai transition trong nhánh điều kiện làm mất mượt.
- Dùng `transform` + `opacity`: hai thuộc tính "rẻ" nhất cho GPU.
- Với list sắp xếp, Motion `layout` + `<AnimatePresence>` cho cảm giác cao cấp — nhưng cân nhắc khi list lớn (đo perf).
- **Accessibility là bắt buộc:** thêm CSS reduced-motion toàn cục; Motion có sẵn `useReducedMotion()`.
- **Giữ `transition` ở class/style tĩnh**, chỉ đổi `opacity`/`transform` theo state — tránh khai transition trong nhánh điều kiện.
- **Đo perf bằng DevTools Performance** khi animate list dài; ưu tiên `transform`/`opacity`.
- **Luôn có nhánh reduced-motion** trong design system, không chỉ vài component.

## Bài tập nhỏ
1. Thêm vào `App` nút "Scale + Fade": đổi `transform: open ? "scale(1)" : "scale(0.95)"` kèm `opacity`; dùng Tailwind (`transition duration-200 ease-out`) thay style inline.
2. Cài `motion`, chuyển khối nội dung sang conditional `{open && <motion.div ... exit={...}/>}` trong `<AnimatePresence>` — quan sát exit animation chạy rồi mới biến mất khỏi DOM (kiểm tra bằng DevTools Elements).
3. Thay style inline bằng Tailwind (`transition duration-200 ease-out`) và so sánh độ gọn.
4. Thêm media query `prefers-reduced-motion` toàn cục và kiểm tra bật/tắt trong DevTools Rendering.
5. Dùng Motion `layout` cho list sortable (DAY 20) và quan sát item trượt về vị trí mới.

## Reference
- https://motion.dev/
- https://react.dev/learn/adding-interactivity (state-driven UI)
- https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion
- https://react.dev/learn/preserving-and-resetting-state