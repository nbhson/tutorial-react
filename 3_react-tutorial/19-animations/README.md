# DAY 19: ANIMATIONS

## Mục tiêu bài học
- Nắm 3 lựa chọn animation React 2026: CSS/Tailwind transitions, **Motion** (tên mới của Framer Motion), React Spring — và biết khi nào dùng cái nào.
- Hiểu vì sao animation trong React là **state-driven**: đổi state → đổi class/style → CSS lo phần mượt.
- Tôn trọng `prefers-reduced-motion` và biết dùng `<AnimatePresence>` cho enter/exit.

## Khái niệm cốt lõi (Core)

### 1. Không animation engine built-in — animation là hệ quả state
Angular `@angular/animations` (trigger/state/transition trong metadata). React không có — animation là **state đổi → style/class mới → trình duyệt nội suy transition**. Không JS frame tay cho micro-interaction.

```tsx
// example.tsx: open false->true là style đổi, transition nội suy — không requestAnimationFrame tay
const [open, setOpen] = useState(false);
<div style={{
  opacity: open ? 1 : 0, // 0->1 giữa 2 render
  transform: open ? "translateY(0)" : "translateY(8px)",
  transition: "opacity 200ms, transform 200ms", // khai cố định: nội suy gì, bao lâu
  pointerEvents: open ? "auto" : "none",
}}>Nội dung fade/slide</div>
```

Vì sao state-driven tốt? Vì animation đồng bộ với data (đúng state là đúng UI, không "quên chạy animation"), test bằng set state (không mock timer frame), reduced-motion chỉ cần CSS (không sửa logic).

### 2. CSS transition đủ 80% (hover/fade/slide/scale)
Chỉ cần class/style theo state + `transition` cố định. `transform` + `opacity` là 2 thuộc tính GPU rẻ (compositor, không reflow); `width`/`height`/`top`/`margin` reflow (đo lại layout, giật). Quy tắc: trượt/scale/fade thì `transform`/`opacity`, không `margin`/`top`.

### 3. Motion (`motion` package, ex-Framer Motion 2024)
`motion.div` + `initial`/`animate`/`exit` + `<AnimatePresence>` (hoãn unmount tới khi exit xong) + `layout` (đo cũ/mới, animate khi reorder) + gesture (`whileHover`/`whileTap`) + `useAnimate` imperative + `onAnimationComplete`. Dùng khi CSS không làm được: exit cho conditional unmount, layout reorder, shared-element, gesture phức tạp.

```tsx
// Motion (npm i motion) — exit chạy trước khi gỡ DOM (CSS không làm được vì DOM gỡ ngay):
import { motion, AnimatePresence } from "motion/react";

<AnimatePresence>
  {open && (
    <motion.div
      initial={{ opacity: 0, y: 8 }} // mount từ đâu
      animate={{ opacity: 1, y: 0 }} // tới đâu
      exit={{ opacity: 0, y: 8 }} // rời đi đâu — AnimatePresence giữ tới khi xong mới gỡ
      transition={{ duration: 0.2 }}
    >Nội dung</motion.div>
  )}
</AnimatePresence>
```

Vì sao `AnimatePresence` quan trọng? Vì `{open && <div/>}` gỡ DOM ngay khi `open` false — CSS exit không kịp chạy (không còn node để nội suy). AnimatePresence giữ node "thây ma" chạy exit rồi mới gỡ thật.

### 4. `prefers-reduced-motion` — bắt buộc, không tùy
User chóng mặt/buồn nôn vì chuyển động phải được tôn trọng: CSS toàn cục tắt + `useReducedMotion()` của Motion để bỏ logic. Nội dung vẫn đúng đầy đủ, chỉ không mượt.

```css
/* Toàn cục: user reduce là mọi transition/animation gần như tức thì */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
}
```

### 5. React Spring — vật lý lò xo (ít dùng 2026)
`useSpring({ x })` nội suy theo lò xo (tension/friction) cho cảm giác tự nhiên (kéo thả, số nhảy). Ít phổ biến hơn Motion vì API nặng mà 80% chỉ cần transition.

### Keyword chính
state-driven (state → style → CSS), transition (khai cố định) + transform/opacity (GPU rẻ), Tailwind (`transition duration-200`), `motion.div` + `initial`/`animate`/`exit`, `AnimatePresence` (hoãn gỡ), `layout` (reorder), `whileHover`/`whileTap`, `prefers-reduced-motion`/`useReducedMotion`.

## Luồng hoạt động (Flow)
1. `App` render `open = false`: div `opacity: 0`, `translateY(8px)`, `pointerEvents: none`. Cùng element DOM sẽ dùng cho cả ẩn/hiện (không unmount).
2. Bấm Toggle → `setOpen(true)` → re-render → style mới `opacity: 1`, `translateY(0)`, `pointerEvents: auto`. Cùng node DOM, chỉ giá trị đổi.
3. Trình duyệt thấy `transition: opacity 200ms, transform 200ms` (khai cố định từ đầu) → nội suy mượt cũ→mới trong 200ms. Không JS frame nào chạy — compositor GPU làm.
4. Bấm lại → style về ẩn → fade/slide ngược. Element **vẫn DOM** (opacity 0) nên 2 chiều đều mượt. `pointerEvents: none` để khối vô hình không chặn nút dưới (quên là bấm xuyên không được).
5. Bản Tailwind: `className` đổi (`opacity-0 translate-y-2` ↔ `opacity-100 translate-y-0`), `transition` utility cố định — cùng cơ chế, khác công cụ (class thay style object).
6. Bản scale: `scale(0.95)` ↔ `scale(1)` + opacity — vẫn 2 thuộc tính rẻ. Không `width`/`height` (reflow).
7. (Motion) Conditional `{open && <motion.div exit>}` trong `AnimatePresence`: `open` false → AnimatePresence giữ node, chạy `exit` 0.2s, xong mới gỡ. Không có là gỡ ngay, không exit.
8. `layout` (list DAY 20 reorder): Motion đo vị trí cũ/mới mỗi item, animate `transform` trượt về chỗ mới — CSS không làm gọn (phải FLIP tay).
9. `prefers-reduced-motion: reduce` → media query ép duration ~0 → nội dung hiện ngay đúng, không mượt. Test bằng DevTools Rendering → emulate.

## Ví dụ chi tiết
Khớp 1-1 với `example.tsx` (CSS + Tailwind + scale bài tập):

```tsx
// example.tsx — DAY 19: CSS transition + Tailwind + reduced-motion + Motion ý tưởng
// Mục đích: animation = state đổi -> style/class đổi -> CSS nội suy. Motion chỉ khi cần exit/layout.
import { useState } from "react"; // (1) State open là nguồn duy nhất — đổi là transition chạy, không JS frame tay

export default function App() {
  const [open, setOpen] = useState(false); // (2) false = ẩn (opacity 0 + trượt 8px + chặn click)
  const [scale, setScale] = useState(false); // (3) Demo scale + fade bài tập — transform + opacity đều GPU rẻ

  return (
    <>
      <button onClick={() => setOpen((o) => !o)}>Toggle fade/slide</button>{" "}
      <button onClick={() => setScale((s) => !s)}>Toggle scale/fade</button>
      {/* (4) Khối fade/slide: GIÁ TRỊ đổi theo state, transition KHAI CỐ ĐỊNH (không trong nhánh). */}
      {/* Vì sao transition cố định? Vì khai trong nhánh là lần có lần không — mất mượt. */}
      <div
        style={{
          marginTop: 12,
          padding: 12,
          border: "1px solid #ccc",
          // (5) opacity + transform là 2 thuộc tính GPU rẻ nhất (không reflow như width/margin/top).
          opacity: open ? 1 : 0, // đổi giữa 2 render là trình duyệt nội suy 200ms
          transform: open ? "translateY(0)" : "translateY(8px)", // trượt nhẹ, không dùng margin/top
          transition: "opacity 200ms, transform 200ms", // khai "nội suy gì, bao lâu" — cố định ngoài điều kiện
          // (6) Ẩn nhưng vẫn DOM (để transition 2 chiều) -> chặn click khi ẩn. Quên là khối vô hình chặn nút dưới.
          pointerEvents: open ? "auto" : "none",
        }}
      >
        Nội dung fade/slide
      </div>
      {/* (7) Tailwind tương đương: class đổi theo state, transition utility cố định */}
      <div
        className={open ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"}
        style={{ transition: "opacity 200ms, transform 200ms", marginTop: 12, padding: 12, border: "1px solid #ccc" }}
      >
        Bản Tailwind — cùng cơ chế, khác công cụ
      </div>
      {/* (8) Scale + fade bài tập: scale(0.95)<->1 kèm opacity — vẫn transform + opacity rẻ */}
      <div style={{ marginTop: 12, padding: 12, border: "1px solid #ccc", opacity: scale ? 1 : 0, transform: scale ? "scale(1)" : "scale(0.95)", transition: "opacity 200ms, transform 200ms", pointerEvents: scale ? "auto" : "none" }}>
        Scale + fade
      </div>
      {/* (9) reduced-motion: CSS toàn cục (xem README) tắt transition khi user yêu cầu — nội dung vẫn đúng, chỉ không mượt. */}
      {/* Motion khi cần exit/layout (không chạy ở đây, xem README): AnimatePresence + exit + layout. */}
    </>
  );
}
```

Motion exit + Tailwind + reduced-motion (copy khi cần):

```tsx
// Motion (npm i motion) — exit cho conditional unmount:
import { motion, AnimatePresence } from "motion/react";

<AnimatePresence>
  {open && (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} transition={{ duration: 0.2 }}>
      Nội dung
    </motion.div>
  )}
</AnimatePresence>
```

```tsx
// Tailwind cùng hiệu ứng fade/slide:
<div className={open ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"} style={{ transition: "opacity 200ms, transform 200ms" }}>
  Nội dung fade/slide
</div>
```

```css
/* Tắt chuyển động khi user yêu cầu — nội dung vẫn đúng */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
}
```

## Giải thích từng phần
- Dòng `useState(false)`: nguồn duy nhất — animation là hệ quả, không `animate()` tay. Vì sao functional `(o) => !o`? Để bấm nhanh 2 lần không đọc snapshot cũ (stale) — luôn đảo từ mới nhất.
- Dòng `opacity: open ? 1 : 0`: giá trị đổi giữa render là điều kiện để nội suy. Mount lần đầu với giá trị cuối (open true sẵn) là không animate (không có cũ để đi từ) — cần `initial` (Motion) hoặc thêm class sau frame.
- Dòng `transform: translateY(...)`: GPU compositor, không layout. Vì sao không `marginTop: open ? 0 : 8`? Vì margin đổi là reflow (đo lại vị trí mọi anh em) — 50 item là giật. `translateY` chỉ vẽ lại lớp đó.
- Dòng `transition: "opacity 200ms, transform 200ms"`: khai **cố định ngoài điều kiện**. Vì sao ngoài? Vì trong nhánh (`open ? "transition: ..." : "none"`) là chiều mở có, chiều đóng không (hoặc ngược) — một chiều mượt một chiều nhảy. Cố định là 2 chiều mượt.
- Dòng `pointerEvents: open ? "auto" : "none"`: khối ẩn vẫn DOM (để 2 chiều) nên phải chặn tương tác. Quên là vùng vô hình đè nút dưới — bấm không ăn mà không thấy gì. `visibility`/`display` không nội suy nên không thay (muốn gỡ hẳn thì Motion exit).
- Dòng Tailwind `opacity-0 translate-y-2 pointer-events-none`: cùng 3 ý (mờ + trượt + chặn) bằng class. `translate-y-2` = 0.5rem (8px) — khớp `translateY(8px)` inline. `transition` vẫn style/utility cố định.
- Dòng scale `scale(0.95)` ↔ `scale(1)`: vẫn `transform` rẻ. Kết hợp opacity cho "mờ + nhỏ dần" cao cấp hơn fade thuần. Không `width`/`height` (reflow).
- Quy tắc **không animate `display`/`visibility`**: chúng nhị phân (có/không), không nội suy. Muốn accordion mở/đóng mượt thì `grid-template-rows: 0fr→1fr` + opacity, hoặc Motion `height: "auto"` (đo rồi animate).
- Quy tắc **`will-change`**: `will-change: transform` gợi GPU tạo lớp riêng cho animation phức tạp — nhưng lạm dụng (100 item đều will-change) là tốn VRAM. Chỉ khi đo thấy giật mà transform/opacity vẫn chưa đủ.

## Bảng so sánh Angular ↔ React
| Angular | React | Ghi chú |
|---|---|---|
| `trigger/state/transition` metadata | Motion `initial`/`animate`/`exit` props | Khai báo trong component, không metadata |
| `:enter`/`:leave` (vào/ra) | `<AnimatePresence>` + `exit` | React cần lib hoãn gỡ để exit kịp |
| `animate("200ms ease")` | CSS `transition: 200ms` / Motion `transition={{ duration: 0.2 }}` | Cùng thời gian + easing |
| `[@trigger]="state"` binding | `style`/`className` theo state | State-driven, không trigger name |
| `query()`/`stagger()` (so le) | Motion `transition.staggerChildren` / `delayChildren` | Khai báo stagger cho nhóm |
| `@angular/animations` built-in | CSS + Motion (chọn lib, không built-in) | React tự chọn theo nhu cầu |
| `AnimationBuilder` imperative | Motion `useAnimate()` / controls (`animate()`) | Cùng imperative khi cần điều khiển tay |
| `(@done)` callback | Motion `onAnimationComplete` | Sau animation (chuỗi bước, log) |
| `@.disabled` tắt animation | `useReducedMotion()` / media query | Tôn trọng user, không phải flag dev |

## Lỗi thường gặp (Common pitfalls)

### 1. Conditional unmount + CSS transition → không exit
```tsx
// ❌ SAI: open false là gỡ ngay — exit không kịp chạy, biến mất đột ngột
{open && <div style={{ transition: "opacity 200ms", opacity: 1 }}>Hi</div>}
```
```tsx
// ✅ ĐÚNG: giữ DOM (opacity) cho CSS 2 chiều, hoặc AnimatePresence cho exit gỡ hẳn
{<div style={{ opacity: open ? 1 : 0, transition: "opacity 200ms" }}>Hi</div>}
// Hoặc Motion:
<AnimatePresence>{open && <motion.div exit={{ opacity: 0 }}>Hi</motion.div>}</AnimatePresence>
```

### 2. Animate `width`/`height`/`top`/`margin` → reflow giật
```tsx
// ❌ SAI: mỗi frame đo lại layout — 50 item là drop frame
<div style={{ width: open ? 300 : 0, transition: "width 200ms" }} />
```
```tsx
// ✅ ĐÚNG: transform/opacity (compositor, không layout)
<div style={{ transform: open ? "scaleX(1)" : "scaleX(0)", opacity: open ? 1 : 0, transition: "transform 200ms, opacity 200ms" }} />
```

### 3. Quên `pointerEvents` → khối ẩn chặn click
Mô tả: `opacity: 0` nhưng vẫn bắt pointer — nút dưới không bấm được, không thấy gì. Fix: `pointerEvents: open ? "auto" : "none"` như example (hoặc `visibility` sau transition, hoặc gỡ hẳn bằng Motion).

### 4. Quên `prefers-reduced-motion` → khó chịu user nhạy cảm
```tsx
// ❌ SAI: transition mọi lúc, không lối thoát
<div style={{ transition: "transform 500ms" }} />
```
```tsx
// ✅ ĐÚNG: media query toàn cục + useReducedMotion() cho logic (xem mẫu trên)
// CSS: @media (prefers-reduced-motion: reduce) { * { transition-duration: 0.01ms !important; } }
// Motion: const reduce = useReducedMotion(); <motion.div animate={reduce ? { opacity: 1 } : { opacity: 1, y: 0 }} />
```

### 5. `key` đổi mỗi render trong AnimatePresence → exit/enter loạn
Mô tả: `key={Math.random()}` mỗi render là mỗi lần là "mới" → exit cũ + enter mới liên tục. Fix: key ổn định (id, DAY 2) — chỉ đổi khi đối tượng đổi.

### 6. Transition chạy ngay mount (không muốn) → nháy lúc mở trang
Mô tả: element vốn visible mà có transition từ giá trị khác (ví dụ mount với `opacity: 0` rồi effect set 1) là nháy. Fix: mount với giá trị cuối luôn (không animate lần đầu), hoặc Motion `initial={false}` để tắt enter.

### 7. `useEffect` + `setState` để trigger animation → thừa vòng + nháy
Mô tả: mount rồi effect set `open(true)` để "chạy animation vào" — thêm render + lần đầu sai. Fix: animation là hệ quả state có sẵn (prop/user action), không effect ép. Cần enter thì Motion `initial`/`animate` (không cần effect).

## Best practices / Mẹo
- **Thứ tự:** CSS/Tailwind 80% (micro) → Motion (layout/exit/gesture) → Spring (vật lý đặc biệt). Vì sao? Vì CSS rẻ nhất (GPU, không JS), Motion khi CSS không làm được (gỡ/exit/reorder), Spring khi muốn lò xo.
- `transition` cố định, chỉ giá trị theo state. Vì sao? Để 2 chiều mượt, không nhánh có nhánh không.
- `transform` + `opacity` cho mọi micro (fade/slide/scale). Vì sao 2 này? Vì compositor-only, 60fps dễ nhất; `width`/`top` reflow khó 60fps.
- List reorder → Motion `layout` + `AnimatePresence`. Vì sao? Vì FLIP tay (đo cũ/mới, invert, play) dài; `layout` 1 prop xong. Đo perf khi list dài (100+ layout cùng animate tốn).
- **A11y bắt buộc:** media query toàn cục + `useReducedMotion()` cho logic. Vì sao bắt buộc? Vì animation là trang trí, nội dung phải đủ khi tắt — user bệnh không thương lượng.
- DevTools Performance đo khi animate list dài; giữ 60fps bằng transform/opacity. Vì sao đo? Vì mắt thấy "hơi giật" không biết do layout hay JS — profile chỉ đúng chỗ.

## Bài tập nhỏ
1. Nút "Scale + Fade" (`scale(0.95)`↔`1` + opacity, như example) — chuyển sang Tailwind (`transition duration-200 ease-out`, `scale-95`/`scale-100`). So gọn inline vs class?
2. `motion` + conditional `exit` trong `AnimatePresence` — DevTools Elements xem node "thây ma" tồn tại 0.2s sau khi `open` false rồi mới gỡ. Không có thì gỡ ngay thế nào?
3. Media query reduced-motion toàn cục + DevTools Rendering emulate — bật/tắt quan sát transition còn không, nội dung đủ không?
4. Motion `layout` cho list sortable (DAY 20) — kéo đổi chỗ, item trượt (không nhảy). Không `layout` thì nhảy thế nào?
5. Accordion `grid-template-rows: 0fr→1fr` + opacity (không `height`) — đóng/mở mượt mà không reflow `height`. Vì sao `height: auto` không transition được?

## Reference
- https://motion.dev/
- https://react.dev/learn/adding-interactivity
- https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion
- https://react.dev/learn/preserving-and-resetting-state
