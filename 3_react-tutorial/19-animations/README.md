# DAY 19: ANIMATIONS

## Mục tiêu bài học
- Nắm 3 lựa chọn animation React 2026: CSS/Tailwind transitions, **Motion** (tên mới của Framer Motion), React Spring — và biết khi nào dùng cái nào.
- Hiểu vì sao animation trong React là **state-driven**: đổi state → đổi class/style → CSS lo phần mượt.
- Tôn trọng `prefers-reduced-motion` và biết dùng `<AnimatePresence>` cho enter/exit.

## Khái niệm cốt lõi (Core)

Mục này nói về tư duy animation trong React 2026: không có animation engine riêng — animation là hệ quả của state — cùng 3 lựa chọn công cụ và quy tắc a11y bắt buộc.

### 1. Không animation engine built-in — animation là hệ quả state
Angular `@angular/animations` (trigger/state/transition trong metadata). React không có — animation là **state đổi → style/class mới → trình duyệt nội suy transition**. Không JS frame tay cho micro-interaction. Ví von: React không thuê "vũ công riêng" cho UI — bạn chỉ đổi trạng thái sân khấu (state), còn trình duyệt là đạo diễn lo chuyển cảnh mượt.

> 📄 **Code ví dụ:** [`examples/01-1-khong-animation-engine-built-in-animation-la.tsx`](examples/01-1-khong-animation-engine-built-in-animation-la.tsx)

Vì sao state-driven tốt? Vì animation đồng bộ với data (đúng state là đúng UI, không "quên chạy animation"), test bằng set state (không mock timer frame), reduced-motion chỉ cần CSS (không sửa logic).

> **Tóm gọn 1 câu:** Animation React không phải "chạy diễn" — chỉ là state đổi, style đổi, trình duyệt tự nội suy.

### 2. CSS transition đủ 80% (hover/fade/slide/scale)
Chỉ cần class/style theo state + `transition` cố định. `transform` + `opacity` là 2 thuộc tính GPU rẻ (compositor, không reflow); `width`/`height`/`top`/`margin` reflow (đo lại layout, giật). Quy tắc: trượt/scale/fade thì `transform`/`opacity`, không `margin`/`top`. Ví von: animate `transform`/`opacity` như vẽ trên lớp kính mỏng đặt trên trang — rẻ và nhanh; animate `width`/`top` như xé dán lại cả trang giấy mỗi khung hình — tốn và giật.

> **Tóm gọn 1 câu:** 80% hiệu ứng chỉ cần CSS transition trên `transform` + `opacity` — hai thuộc tính "lớp kính" rẻ nhất của trình duyệt.

### 3. Motion (`motion` package, ex-Framer Motion 2024)
Mục này về "vũ công chuyên nghiệp" khi CSS hết bài: exit animation, layout reorder, gesture — đọc để biết lúc nào đáng cài lib.

`motion.div` + `initial`/`animate`/`exit` + `<AnimatePresence>` (hoãn unmount tới khi exit xong) + `layout` (đo cũ/mới, animate khi reorder) + gesture (`whileHover`/`whileTap`) + `useAnimate` imperative + `onAnimationComplete`. Dùng khi CSS không làm được: exit cho conditional unmount, layout reorder, shared-element, gesture phức tạp.

> 📄 **Code ví dụ:** [`examples/02-3-motion-motion-package-ex-framer-motion-2024.tsx`](examples/02-3-motion-motion-package-ex-framer-motion-2024.tsx)

Vì sao `AnimatePresence` quan trọng? Vì `{open && <div/>}` gỡ DOM ngay khi `open` false — CSS exit không kịp chạy (không còn node để nội suy). AnimatePresence giữ node "thây ma" chạy exit rồi mới gỡ thật. Ví von: như diễn viên đóng xong phân cảnh từ biệt vẫn đứng trên sân khấu thêm vài giây trước khi lui vào hậu trường — không có AnimatePresence là đạo diễn tắt đèn giữa phân cảnh.

> **Tóm gọn 1 câu:** Motion là vũ công chuyên nghiệp cho việc CSS không làm nổi — đặc biệt là "phân cảnh từ biệt" (exit) nhờ `AnimatePresence`.

### 4. `prefers-reduced-motion` — bắt buộc, không tùy
Mục này về quy tắc a11y không thương lượng: tôn trọng người dùng bật giảm chuyển động trong OS.

User chóng mặt/buồn nôn vì chuyển động phải được tôn trọng: CSS toàn cục tắt + `useReducedMotion()` của Motion để bỏ logic. Nội dung vẫn đúng đầy đủ, chỉ không mượt. Ví von: nội dung là món ăn, animation là món tráng miệng — khách kiêng đường vẫn phải ăn no, chỉ là bỏ tráng miệng thôi.

> 📄 **Code ví dụ:** [`examples/03-4-prefers-reduced-motion-bat-buoc-khong-tuy.css`](examples/03-4-prefers-reduced-motion-bat-buoc-khong-tuy.css)

> **Tóm gọn 1 câu:** `prefers-reduced-motion` là yêu cầu y tế của user — tắt mượt nhưng không được tắt nội dung.

### 5. React Spring — vật lý lò xo (ít dùng 2026)
`useSpring({ x })` nội suy theo lò xo (tension/friction) cho cảm giác tự nhiên (kéo thả, số nhảy). Ít phổ biến hơn Motion vì API nặng mà 80% chỉ cần transition. Ví von: Motion đi đường thẳng có nhịp đều, Spring đi như người bước chân bỗng — chân thực hơn nhưng ít khi cần.

> **Tóm gọn 1 câu:** Spring chỉ cần khi bạn thật sự muốn "vật lý lò xo" — đa số trường hợp Motion + CSS đã đủ.

### Keyword chính
state-driven (state → style → CSS), transition (khai cố định) + transform/opacity (GPU rẻ), Tailwind (`transition duration-200`), `motion.div` + `initial`/`animate`/`exit`, `AnimatePresence` (hoãn gỡ), `layout` (reorder), `whileHover`/`whileTap`, `prefers-reduced-motion`/`useReducedMotion`.

> **Tóm gọn 1 câu:** Nắm 8 từ này là đủ làm animation: state điều khiển, CSS lo phần rẻ, Motion lo phần khó, reduced-motion lo phần tử vi.

## Luồng hoạt động (Flow)
Mục này đi qua từng khung hình của một toggle fade/slide — đọc để thấy "không có gì chạy cả, chỉ có state đổi và trình duyệt nội suy".
1. `App` render `open = false`: div `opacity: 0`, `translateY(8px)`, `pointerEvents: none`. Cùng element DOM sẽ dùng cho cả ẩn/hiện (không unmount).
2. Bấm Toggle → `setOpen(true)` → re-render → style mới `opacity: 1`, `translateY(0)`, `pointerEvents: auto`. Cùng node DOM, chỉ giá trị đổi.
3. Trình duyệt thấy `transition: opacity 200ms, transform 200ms` (khai cố định từ đầu) → nội suy mượt cũ→mới trong 200ms. Không JS frame nào chạy — compositor GPU làm.
4. Bấm lại → style về ẩn → fade/slide ngược. Element **vẫn DOM** (opacity 0) nên 2 chiều đều mượt. `pointerEvents: none` để khối vô hình không chặn nút dưới (quên là bấm xuyên không được).
5. Bản Tailwind: `className` đổi (`opacity-0 translate-y-2` ↔ `opacity-100 translate-y-0`), `transition` utility cố định — cùng cơ chế, khác công cụ (class thay style object).
6. Bản scale: `scale(0.95)` ↔ `scale(1)` + opacity — vẫn 2 thuộc tính rẻ. Không `width`/`height` (reflow).
7. (Motion) Conditional `{open && <motion.div exit>}` trong `AnimatePresence`: `open` false → AnimatePresence giữ node, chạy `exit` 0.2s, xong mới gỡ. Không có là gỡ ngay, không exit.
8. `layout` (list DAY 20 reorder): Motion đo vị trí cũ/mới mỗi item, animate `transform` trượt về chỗ mới — CSS không làm gọn (phải FLIP tay).
9. `prefers-reduced-motion: reduce` → media query ép duration ~0 → nội dung hiện ngay đúng, không mượt. Test bằng DevTools Rendering → emulate.

> **Tóm gọn 1 câu:** Toggle một lần là cả chuỗi: state đổi → style mới → trình duyệt nội suy 200ms — không một dòng JS frame nào chạy giữa chừng.

## Ví dụ chi tiết
Mục này cho code hoàn chỉnh CSS + Tailwind + Motion — copy chạy thử rồi quay lại phần giải thích.
Khớp 1-1 với `example.tsx` (CSS + Tailwind + scale bài tập):

> 📄 **Code ví dụ:** [`examples/04-vi-du-chi-tiet.tsx`](examples/04-vi-du-chi-tiet.tsx)

Motion exit + Tailwind + reduced-motion (copy khi cần):

> 📄 **Code ví dụ:** [`examples/05-vi-du-chi-tiet.tsx`](examples/05-vi-du-chi-tiet.tsx)

> 📄 **Code ví dụ:** [`examples/06-vi-du-chi-tiet.tsx`](examples/06-vi-du-chi-tiet.tsx)

> 📄 **Code ví dụ:** [`examples/07-vi-du-chi-tiet.css`](examples/07-vi-du-chi-tiet.css)

## Giải thích từng phần
Mục này soi từng dòng style trong example — đọc để hiểu vì sao transition phải cố định, vì sao không animate margin.
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
Mục này đối chiếu hệ animation Angular với cách React làm — đọc như bảng chuyển đổi khái niệm vũ đạo từ metadata sang state-driven.

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

> **Cách đọc bảng này:** mỗi dòng là một tính năng animation của Angular đối chiếu với cách React đạt cùng hiệu quả; cột Ghi chú nêu khác biệt cơ chế — hàng quan trọng nhất là dòng về `:enter`/`:leave`, vì đó là chỗ React cần lib thay vì built-in.

## Lỗi thường gặp (Common pitfalls)
Mục này là "bản đồ bẫy" của animation — exit không kịp, reflow giật, nút vô hình chặn click; đa số lỗi chỉ lộ khi bấm thử, nên phải biết trước.

### 1. Conditional unmount + CSS transition → không exit
> 📄 **Code ví dụ:** [`examples/08-1-conditional-unmount-css-transition-khong-exit.tsx`](examples/08-1-conditional-unmount-css-transition-khong-exit.tsx)
> 📄 **Code ví dụ:** [`examples/09-1-conditional-unmount-css-transition-khong-exit.tsx`](examples/09-1-conditional-unmount-css-transition-khong-exit.tsx)

### 2. Animate `width`/`height`/`top`/`margin` → reflow giật
> 📄 **Code ví dụ:** [`examples/10-2-animate-width-height-top-margin-reflow-giat.tsx`](examples/10-2-animate-width-height-top-margin-reflow-giat.tsx)
> 📄 **Code ví dụ:** [`examples/11-2-animate-width-height-top-margin-reflow-giat.tsx`](examples/11-2-animate-width-height-top-margin-reflow-giat.tsx)

### 3. Quên `pointerEvents` → khối ẩn chặn click
Mô tả: `opacity: 0` nhưng vẫn bắt pointer — nút dưới không bấm được, không thấy gì. Fix: `pointerEvents: open ? "auto" : "none"` như example (hoặc `visibility` sau transition, hoặc gỡ hẳn bằng Motion).

### 4. Quên `prefers-reduced-motion` → khó chịu user nhạy cảm
> 📄 **Code ví dụ:** [`examples/12-4-quen-prefers-reduced-motion-kho-chiu-user.tsx`](examples/12-4-quen-prefers-reduced-motion-kho-chiu-user.tsx)
> 📄 **Code ví dụ:** [`examples/13-4-quen-prefers-reduced-motion-kho-chiu-user.tsx`](examples/13-4-quen-prefers-reduced-motion-kho-chiu-user.tsx)

### 5. `key` đổi mỗi render trong AnimatePresence → exit/enter loạn
Mô tả: `key={Math.random()}` mỗi render là mỗi lần là "mới" → exit cũ + enter mới liên tục. Fix: key ổn định (id, DAY 2) — chỉ đổi khi đối tượng đổi.

### 6. Transition chạy ngay mount (không muốn) → nháy lúc mở trang
Mô tả: element vốn visible mà có transition từ giá trị khác (ví dụ mount với `opacity: 0` rồi effect set 1) là nháy. Fix: mount với giá trị cuối luôn (không animate lần đầu), hoặc Motion `initial={false}` để tắt enter.

### 7. `useEffect` + `setState` để trigger animation → thừa vòng + nháy
Mô tả: mount rồi effect set `open(true)` để "chạy animation vào" — thêm render + lần đầu sai. Fix: animation là hệ quả state có sẵn (prop/user action), không effect ép. Cần enter thì Motion `initial`/`animate` (không cần effect).

## Best practices / Mẹo
Mục này là "thứ tự ưu tiên" khi làm animation — đọc để biết bắt đầu từ đâu và khi nào mới mời "vũ công chuyên nghiệp" vào.
- **Thứ tự:** CSS/Tailwind 80% (micro) → Motion (layout/exit/gesture) → Spring (vật lý đặc biệt). Vì sao? Vì CSS rẻ nhất (GPU, không JS), Motion khi CSS không làm được (gỡ/exit/reorder), Spring khi muốn lò xo.
- `transition` cố định, chỉ giá trị theo state. Vì sao? Để 2 chiều mượt, không nhánh có nhánh không.
- `transform` + `opacity` cho mọi micro (fade/slide/scale). Vì sao 2 này? Vì compositor-only, 60fps dễ nhất; `width`/`top` reflow khó 60fps.
- List reorder → Motion `layout` + `AnimatePresence`. Vì sao? Vì FLIP tay (đo cũ/mới, invert, play) dài; `layout` 1 prop xong. Đo perf khi list dài (100+ layout cùng animate tốn).
- **A11y bắt buộc:** media query toàn cục + `useReducedMotion()` cho logic. Vì sao bắt buộc? Vì animation là trang trí, nội dung phải đủ khi tắt — user bệnh không thương lượng.
- DevTools Performance đo khi animate list dài; giữ 60fps bằng transform/opacity. Vì sao đo? Vì mắt thấy "hơi giật" không biết do layout hay JS — profile chỉ đúng chỗ.

## Bài tập nhỏ
Làm tay để nhớ — mỗi bài là một thí nghiệm đo bằng mắt hoặc bằng DevTools Performance.

1. Nút "Scale + Fade" (`scale(0.95)`↔`1` + opacity, như example) — chuyển sang Tailwind (`transition duration-200 ease-out`, `scale-95`/`scale-100`). So gọn inline vs class?
2. `motion` + conditional `exit` trong `AnimatePresence` — DevTools Elements xem node "thây ma" tồn tại 0.2s sau khi `open` false rồi mới gỡ. Không có thì gỡ ngay thế nào?
3. Media query reduced-motion toàn cục + DevTools Rendering emulate — bật/tắt quan sát transition còn không, nội dung đủ không?
4. Motion `layout` cho list sortable (DAY 20) — kéo đổi chỗ, item trượt (không nhảy). Không `layout` thì nhảy thế nào?
5. Accordion `grid-template-rows: 0fr→1fr` + opacity (không `height`) — đóng/mở mượt mà không reflow `height`. Vì sao `height: auto` không transition được?

> **Tóm gọn 1 câu:** Ghi nhớ cả bài trong 1 nhịp: state-driven, chỉ animate `transform`/`opacity`, exit cần AnimatePresence, reduced-motion là bắt buộc.

## Reference
- https://motion.dev/
- https://react.dev/learn/adding-interactivity
- https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion
- https://react.dev/learn/preserving-and-resetting-state
