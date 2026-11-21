# DAY 15: LIFECYCLE & EFFECTS

## Mục tiêu bài học
- Nắm `useEffect` thay cho bộ `ngOnInit/ngOnChanges/ngOnDestroy` của Angular, và `useLayoutEffect` cho việc đo DOM trước khi trình duyệt vẽ.
- Khắc cốt quy tắc 2026: effect chỉ dành cho **đồng bộ với hệ thống ngoài** (timer, socket, DOM, subscription) — không dùng để tính toán dữ liệu từ props/state.
- Hiểu dùng `useEffectEvent` (React 19.2+) thay cho việc `eslint-disable` dependencies, và vì sao StrictMode chạy effect 2 lần ở dev.

## Khái niệm cốt lõi (Core)

Mục này nói về tư duy effect mới của React: không còn vòng đời ngOnInit/ngOnDestroy mà chỉ có "effect nào chạy lại khi deps đổi" — đọc để biết khi nào được viết effect và khi nào là bẫy.

### 1. Effect = side effect sau render, chạy theo deps
`useEffect(fn, deps)` — React gọi `fn` **sau khi đã vẽ** (paint) khi `deps` đổi (so `Object.is` từng phần tử). Không có lifecycle methods rời; chỉ có "effect nào chạy lại khi gì đổi". Hỏi "viết effect khi nào" thì trả lời bằng deps. Ví von: effect là "việc nhà dọn sau khi khách đã vào xem nhà" — chủ nhà (React) lo vẽ xong xuôi rồi mới gọi bạn ra làm việc bên ngoài.

> 📄 **Code ví dụ:** [`examples/01-1-effect-side-effect-sau-render-chay-theo.tsx`](examples/01-1-effect-side-effect-sau-render-chay-theo.tsx)

Vì sao sau paint? Để effect nặng (fetch, đo DOM, subscribe) không chặn lần vẽ đầu — user thấy skeleton ngay. Cần đo trước paint để tránh nháy (tooltip) thì `useLayoutEffect` (mục 4).

> **Tóm gọn 1 câu:** Effect là việc làm sau khi màn hình đã vẽ xong — và nó chạy lại đúng lúc deps nói nó đổi.

### 2. Deps quyết định vòng đời — thiếu là stale, thừa là loop
`[]` = 1 lần (init); `[x]` = lại khi x đổi; không truyền = mọi render. Thiếu (dùng `userId` mà không liệt kê) là closure cũ (title mãi user 1 dù prop đã 2). Thừa (object/array/function mới mỗi render trong deps) là chạy lại mỗi render, thường thành loop (effect setState → render → object mới → effect lại). Ví von: deps như danh sách khách mời của một bữa tiệc — mời thiếu thì người quen không được mời (giá trị cũ), mời thừa người lạ mỗi phút là party hỗn loạn không dứt (loop).

> 📄 **Code ví dụ:** [`examples/02-2-deps-quyet-inh-vong-oi-thieu-la.tsx`](examples/02-2-deps-quyet-inh-vong-oi-thieu-la.tsx)

ESLint `react-hooks/exhaustive-deps` báo thiếu/thừa — nghe nó, không disable. Vướng "muốn đọc giá trị mới mà không chạy lại" thì `useEffectEvent` (mục 6), không phải disable.

> **Tóm gọn 1 câu:** Deps là "hợp đồng" bạn ký với effect: thiếu điều khoản là nó ôm giá trị cũ, thêm điều thừa là nó hành mỗi render.

### 3. Cleanup = ngOnDestroy + "gỡ cũ trước khi gắn mới"
`return () => {...}` chạy (a) trước lần effect kế tiếp (khi deps đổi) và (b) khi unmount. Mọi setup (interval, socket, listener, subscribe, AbortController) phải có cleanup đối xứng: tạo bao nhiêu, gỡ bấy nhiêu. Ví von: giống quy tắc "ai mượn thì trả" — mở đèn thì tắt, thuê phòng thì trả, đăng ký kênh thì hủy; quên trả là app "nợ" tài nguyên mãi.

> 📄 **Code ví dụ:** [`examples/03-3-cleanup-ngondestroy-go-cu-truoc-khi-gan.tsx`](examples/03-3-cleanup-ngondestroy-go-cu-truoc-khi-gan.tsx)

Vì sao "gỡ cũ trước mới"? Vì deps đổi (`roomId` 1→2) mà không gỡ socket cũ là 2 socket song song, message cũ vẫn về. Cleanup chạy trước effect mới nên cũ chết trước khi mới sinh — không chồng.

> **Tóm gọn 1 câu:** Mọi "mở" phải có "đóng" đối xứng — cleanup gỡ cái cũ trước khi cái mới lên, app không bao giờ chồng chéo.

### 4. `useLayoutEffect` — trước paint, cho đo DOM
`useEffect` sau paint (mặc định, không chặn vẽ). `useLayoutEffect` sau DOM dựng nhưng **trước paint** — đo (`getBoundingClientRect`) rồi `setState` vị trí (tooltip/popover) thì trình duyệt vẽ 1 lần đúng vị trí, không nháy từ sai sang đúng. Giá: chặn paint nên nặng là treo vẽ — chỉ dùng khi cần đo-đặt. Ví von: `useEffect` là soát bài sau khi nộp (đều vẽ rồi mới chỉnh), `useLayoutEffect` là soát trước khi nộp — hơi chậm nhưng người chấm không bao giờ thấy bản nháp sai.

> 📄 **Code ví dụ:** [`examples/04-4-uselayouteffect-truoc-paint-cho-o-dom.tsx`](examples/04-4-uselayouteffect-truoc-paint-cho-o-dom.tsx)

SSR: `useLayoutEffect` không chạy server (cảnh báo) — đo DOM chỉ client. React 19 khuyên `useSyncExternalStore` cho đo đạc SSR-safe khi có thể.

> **Tóm gọn 1 câu:** `useEffect` mặc định cho mọi việc; chỉ chuyển sang `useLayoutEffect` khi cần đo DOM mà không được phép nháy.

### 5. StrictMode dev chạy 2 lần — máy báo khói cleanup
Setup → cleanup → setup. Thiếu cleanup (2 timer, 2 socket, 2 listener) là dev lộ ngay (đếm 2 lần, message kép). Prod 1 lần. Đừng bỏ StrictMode cho "hết 2 lần" — sửa effect. Kiểm thử với StrictMode bật để lộ trước khi lên prod. Ví von: StrictMode là "kiểm tra sức khỏe định kỳ" — chạy 2 lần như bác sĩ yêu cầu chạy lại xét nghiệm: thấy mệt chút ở phòng khám còn hơn phát bệnh giữa đường (prod).

> **Tóm gọn 1 câu:** StrictMode cố tình chạy effect 2 lần ở dev để bắt cleanup thiếu — tắt nó là giấu bệnh, không phải chữa bệnh.

### 6. `useEffectEvent` (19.2+) — đọc mới nhất không thêm deps
Tách "logic không reactive" (handler cần giá trị mới nhất: message đang gõ, callback prop) khỏi deps. Trước đây phải `eslint-disable` (giấu stale) hoặc thêm deps gây chạy lại thừa. Giờ handler `useEffectEvent` luôn đọc mới nhất mà không nằm trong deps. Ví von: như ghi chú dán tủ lạnh — effect chỉ cần biết "có ghi chú" để mở tủ, còn nội dung ghi chú bao giờ cũng là mới nhất khi đọc.

> 📄 **Code ví dụ:** [`examples/05-6-useeffectevent-19-2-oc-moi-nhat-khong.tsx`](examples/05-6-useeffectevent-19-2-oc-moi-nhat-khong.tsx)

Quy tắc: `useEffectEvent` không nằm trong deps bao giờ (lint biết). Chỉ dùng trong effect/event của cùng component, không truyền xa như prop thường mà không suy nghĩ.

> **Tóm gọn 1 câu:** `useEffectEvent` là "mắt xích tách rời" — handler luôn đọc giá trị mới nhất mà không kéo effect chạy lại.

### 7. Effect đồng bộ, không phải "chạy khi click/prop đổi để setState"
Mục này là "vạch ranh giới" quan trọng nhất bài: việc gì thuộc event handler, việc gì tính ngay trong render, việc gì mới được phép là effect.

"Khi user click" là việc event handler (trong `onClick`, không phải effect). "Khi prop X đổi để tính Y" là derived trong render (`const y = f(x)`) hoặc `key` reset — không phải `useEffect(() => setY(f(x)), [x])` (thừa 1 vòng render + dễ loop). Effect chỉ khi có **hệ thống ngoài** cần giữ đồng bộ (timer/socket/DOM/subscription/fetch managed xem DAY 12). Ví von: event handler là trả lời câu hỏi của khách khi khách hỏi; derived là bảng giá treo sẵn tính từ giá gốc; còn effect là buổi tổng vệ sinh định kỳ — giữ nhà khớp với thế giới bên ngoài.

> 📄 **Code ví dụ:** [`examples/06-7-effect-ong-bo-khong-phai-chay-khi.tsx`](examples/06-7-effect-ong-bo-khong-phai-chay-khi.tsx)

> **Tóm gọn 1 câu:** Click → event handler; tính từ props/state → derived trong render; chỉ "đồng bộ với hệ thống ngoài" mới là việc của effect.

### Keyword chính
`useEffect` (sau paint) / `useLayoutEffect` (trước paint, đo DOM), deps (`[]`/`[x]`/không có), cleanup (đối xứng setup), StrictMode double (máy báo khói), `useEffectEvent` (đọc mới không deps), stale closure (thiếu deps), derived (render thay effect), external system (khi nào mới effect).

> **Tóm gọn 1 câu:** Nắm 8 từ này là thuộc hết bài: effect chạy sau paint, deps là hợp đồng, cleanup là đóng đối xứng, và hệ thống ngoài mới là lý do sống sót của effect.

## Luồng hoạt động (Flow)
Mục này theo dõi đồng hồ đếm giây trong example từng nhịp một — đọc để thấy effect/deps/cleanup phối hợp như thế nào theo thời gian thực.
1. Mount `App`: `useState(new Date())` (lazy init 1 lần), `first/last` input. Render đầu: `<p>Đồng hồ>`, `fullName` derived, 2 input. Chưa effect nào chạy.
2. Sau paint: Effect #1 (`[]`) chạy — `setInterval` 1s, trả cleanup. Effect #2 (`[userId, now]`) chạy — `document.title = "User 1 — ..."`. Effect #3 (`[]` + EffectEvent) chạy — `onConnected()` log tên hiện tại.
3. Mỗi giây: interval `setNow(new Date())` → re-render → `now` mới → `fullName` (không đổi vì first/last giữ) tính lại rẻ → Effect #2 deps `now` đổi → (không cleanup vì không có) chạy lại, title giờ mới. Effect #1 (`[]`) đứng yên.
4. Gõ tên: `setFirst` → re-render → `fullName` mới ngay (không effect, không chờ) → input hiện. Effect #3 không chạy lại (deps `[]`, `onConnected` ngoài deps) nhưng lần gọi sau (nếu có reconnect) vẫn đọc tên mới nhờ EffectEvent.
5. `userId` prop 1→2: Effect #2 chạy lại (deps đổi), title user 2. Effect #1 không chạy (deps `[]`) — timer giữ, không reset. Đây là ý nghĩa tách effect theo mối quan tâm (timer riêng, title riêng).
6. Unmount: cleanup Effect #1 `clearInterval` (không timer rò), Effect #2 không cleanup (gán đè, không cần gỡ). Không `setState` sau unmount.
7. Dev StrictMode: mount → setup → cleanup → setup cho cả 3 effect. Timer tạo/hủy/tạo (còn 1), title gán 2 lần (idempotent, không sao), log 2 lần (biết là dev, không phải bug).
8. Deps object mới mỗi render (nếu có) → so tham chiếu khác → effect chạy mỗi render → `setState` trong effect → loop. Fix: nguyên thủy/useMemo/Compiler + EffectEvent cho phần không reactive.

> **Tóm gọn 1 câu:** Mỗi giây đồng hồ là một vòng: tick → render → deps đổi → effect chạy lại; unmount thì cleanup gỡ sạch — vòng quay khép kín, không rò.

## Ví dụ chi tiết
Mục này cho code hoàn chỉnh khớp `example.tsx` — copy chạy rồi quay lại đọc giải thích bên dưới.
Khớp 1-1 với `example.tsx`:

> 📄 **Code ví dụ:** [`examples/07-vi-du-chi-tiet.tsx`](examples/07-vi-du-chi-tiet.tsx)

## Giải thích từng phần
Mục này soi từng dòng effect trong ví dụ — đọc khi bạn muốn hiểu "vì sao lại tách effect thế này".
- Dòng `useState(() => new Date())`: lazy init (truyền hàm) — `new Date()` chỉ chạy mount, không mỗi render. Vì sao? Vì `useState(new Date())` (không hàm) tạo Date mới mỗi render rồi bỏ (phí + gây nhầm khi ai đó dùng nó làm deps).
- Khối Effect #1 (`[]`): "khởi tạo hệ thống ngoài" (interval). `window.` để đúng type browser (`number` id). Functional `setNow(new Date())` không cần `now` trong deps. Cleanup `clearInterval` — unmount + StrictMode double đều sạch. Không cleanup là 2 timer dev, 1 timer rò prod sau unmount.
- Khối Effect #2 (`[userId, now]`): đồng bộ DOM ngoài (`document.title`) — hệ thống ngoài nên effect đúng chỗ (không phải trong render vì render phải pure). Không cleanup vì gán đè (idempotent). Thiếu `now` là giờ kẹt; thiếu `userId` là user kẹt; thêm object lạ là loop.
- Khối `useEffectEvent`: `onConnected` đọc `first/last` mới nhất mà không reactive. Vì sao không `useCallback([first, last])`? Vì callback deps đổi mỗi phím → effect `[roomId, onConnected]` reconnect mỗi phím (sai). EffectEvent giữ effect `[roomId]` sạch mà handler vẫn mới.
- Dòng `onConnected()` trong effect `[]`: demo — thật là `connect(roomId)` + `conn.on("connected", onConnected)` + cleanup `disconnect`. `onConnected` không trong deps (lint không đòi) — cho vào là sai quy tắc (dù không loop vì EffectEvent ổn định, nhưng sai ý).
- Dòng `const fullName = ...` trong render: derived — rẻ, đồng bộ ngay, không vòng render thừa. Effect version (`setFullName` trong effect) tốn 1 render (render → effect → set → render lại) + nháy (lần đầu sai, lần 2 mới đúng) + dễ loop nếu deps sai.
- Quy tắc **nhiều effect theo mối quan tâm**: timer + title + socket là 3 effect, không gộp 1. Vì sao? Vì deps khác nhau (timer `[]`, title `[userId, now]`, socket `[roomId]`) — gộp là deps hợp nhất chạy thừa (gõ tên cũng reset timer).
- Quy tắc **render pure**: `document.title`/fetch/`localStorage.setItem` trong render là sai (mỗi render làm 1 lần, StrictMode double làm 2 lần). Pure (cùng props/state → cùng JSX) + side effect ở effect/event. `fullName` trong render đúng vì thuần (không đụng ngoài).

## Bảng so sánh Angular ↔ React
Mục này đối chiếu từng lifecycle hook cũ của Angular với cách React làm — đọc như bảng chuyển đổi từ vựng khi đổi tư duy.

| Angular | React | Ghi chú |
|---|---|---|
| `ngOnInit` (1 lần sau init) | `useEffect(fn, [])` (sau paint) | Cùng 1 lần, React sau vẽ nên không chặn |
| `ngOnChanges` (khi input đổi) | `useEffect(fn, [prop])` | Chạy lại khi prop trong deps đổi |
| `ngOnDestroy` | `return () => cleanup` trong cùng effect | Setup/cleanup colocate, không file rời |
| `ngAfterViewInit` (đo DOM sau view) | `useLayoutEffect` (trước paint) | Đo rồi set để không nháy |
| `ngDoCheck` (check tay mỗi vòng) | Không tương đương — derived trong render | Không vòng check, tính khi render |
| Subscription `.unsubscribe()` trong destroy | cleanup `return () => unsub()` | Không quên vì colocate |
| `ChangeDetectorRef.detectChanges()` ép vẽ | `setState` (tự re-render) | Không ép, báo state là vẽ |
| `zone.js` điều phối async | React scheduler (không zone) | Không patch global |
| `ngAfterContentInit` | Không effect tương ứng — traversal trong render (DAY 9) | Content không lifecycle riêng |
| `NgZone.runOutsideAngular` (tránh check) | Không cần — effect + deps kiểm soát | Không zone để tránh |

> **Cách đọc bảng này:** mỗi dòng là một lifecycle hook (hoặc cơ chế) của Angular, cột giữa là cách React giải quyết việc đó, cột Ghi chú nêu khác biệt tinh tế — một số dòng React "không tương đương" vì việc đó đã thuộc render/event, đó chính là điểm tư duy cần chuyển.

## Lỗi thường gặp (Common pitfalls)
Mục này là "bản đồ bẫy" của effect — stale, loop, rò rỉ, che bug; sập vào thì thường không báo lỗi rõ nên phải biết trước.

### 1. Thiếu deps (stale closure) — effect giữ giá trị cũ
> 📄 **Code ví dụ:** [`examples/08-1-thieu-deps-stale-closure-effect-giu-gia.tsx`](examples/08-1-thieu-deps-stale-closure-effect-giu-gia.tsx)
> 📄 **Code ví dụ:** [`examples/09-1-thieu-deps-stale-closure-effect-giu-gia.tsx`](examples/09-1-thieu-deps-stale-closure-effect-giu-gia.tsx)

### 2. Thừa deps (object/function mới mỗi render) → loop
> 📄 **Code ví dụ:** [`examples/10-2-thua-deps-object-function-moi-moi-render.tsx`](examples/10-2-thua-deps-object-function-moi-moi-render.tsx)
> 📄 **Code ví dụ:** [`examples/11-2-thua-deps-object-function-moi-moi-render.tsx`](examples/11-2-thua-deps-object-function-moi-moi-render.tsx)

### 3. Effect đồng bộ prop → state (thừa vòng + loop)
> 📄 **Code ví dụ:** [`examples/12-3-effect-ong-bo-prop-state-thua-vong.tsx`](examples/12-3-effect-ong-bo-prop-state-thua-vong.tsx)
> 📄 **Code ví dụ:** [`examples/13-3-effect-ong-bo-prop-state-thua-vong.tsx`](examples/13-3-effect-ong-bo-prop-state-thua-vong.tsx)

### 4. Quên cleanup (timer/listener/socket/subscribe)
> 📄 **Code ví dụ:** [`examples/14-4-quen-cleanup-timer-listener-socket-subscribe.tsx`](examples/14-4-quen-cleanup-timer-listener-socket-subscribe.tsx)
> 📄 **Code ví dụ:** [`examples/15-4-quen-cleanup-timer-listener-socket-subscribe.tsx`](examples/15-4-quen-cleanup-timer-listener-socket-subscribe.tsx)

### 5. Bỏ StrictMode cho hết "2 lần" → che bug
Mô tả: log/effect 2 lần dev nên gỡ StrictMode. Sai vì bug (thiếu cleanup) vẫn đó, prod user gánh. Fix: giữ StrictMode, viết cleanup đối xứng; 2 lần dev miễn phí, prod 1 lần.

### 6. Side effect trong render thay vì effect/event
> 📄 **Code ví dụ:** [`examples/16-6-side-effect-trong-render-thay-vi-effect.tsx`](examples/16-6-side-effect-trong-render-thay-vi-effect.tsx)
> 📄 **Code ví dụ:** [`examples/17-6-side-effect-trong-render-thay-vi-effect.tsx`](examples/17-6-side-effect-trong-render-thay-vi-effect.tsx)

### 7. Gộp nhiều mối quan tâm 1 effect → chạy thừa
Mô tả: timer + title + socket trong 1 effect deps `[userId, now, roomId]` — gõ tên cũng reconnect socket + reset timer. Fix: mỗi effect 1 tài nguyên như example (3 effect riêng).

## Best practices / Mẹo
Mục này là "quy tắc an toàn lao động" khi làm việc với effect — đọc để viết ít effect mà đúng effect.
- **Hỏi trước khi viết:** "Có hệ thống ngoài nào cần đồng bộ không?" Không → render/event, không effect. Vì sao hỏi? Vì 80% effect thừa là tính derived/fetch managed — bỏ được.
- Deps đúng dù có Compiler (Compiler không chữa logic stale). Vì sao? Vì Compiler memo tham chiếu, không biết bạn *muốn* effect chạy khi nào — deps là ý đồ, phải viết đúng.
- `useEffectEvent` khi cần mới nhất (analytics/socket/theme) mà không thêm deps. Vì sao hơn disable? Vì disable giấu stale (sai ngầm), EffectEvent đọc mới thật (đúng).
- Đo DOM → `useLayoutEffect`; SSR nhớ nó không chạy server. Vì sao? Để không nháy (đo trước paint) mà không treo vẽ (chỉ đo nhẹ).
- Data fetching managed (TanStack DAY 12), không effect-fetch tay ở prod. Vì sao? Vì cache/retry/dedupe tự viết dễ sai từng cái.
- **Effect nhỏ độc lập** (mỗi 1 timer/socket/DOM) — dễ deps, dễ cleanup, dễ test. Vì sao? Vì effect to là deps hợp nhất chạy thừa.
- **Sự kiện hơn effect** cho "khi user làm X" — effect là đồng bộ (giữ khớp với ngoài), không phải bắt sự kiện (phản ứng click/gõ).

## Bài tập nhỏ
Làm tay để nhớ — mỗi bài là một thí nghiệm nhỏ với timer, listener hoặc nháy màn hình.

1. `useWindowSize` (`resize` + cleanup) — StrictMode không lỗi, unmount bỏ listener. Thiếu cleanup thì `getEventListeners(window)` tăng thế nào?
2. Effect #2 sang EffectEvent đọc `userId` mới giữ deps `[]` — so với bản `[userId]` (cả hai đúng, khi nào mỗi cách hợp? Gợi ý: title cần chạy lại khi userId đổi → `[userId]` tự nhiên hơn).
3. `useEventListener(target, type, handler)` bọc add/cleanup (handler qua EffectEvent để deps `[]`) — dùng cho `resize`/`online`.
4. Effect `setState` theo prop → derived trong render — đếm render 2 bản (effect thừa mấy lần?).
5. `useLayoutEffect` đo tooltip vs `useEffect` — quay slow-motion thấy nháy khác nhau thế nào?

> **Tóm gọn 1 câu:** Ghi nhớ cả bài trong 1 nhịp: hỏi "có hệ thống ngoài không" trước khi viết effect; có thì deps đủ, cleanup đối xứng, giữ StrictMode để máy báo khói.

## Reference
- https://react.dev/learn/lifecycle-of-reactive-effects
- https://react.dev/learn/synchronizing-with-effects
- https://react.dev/reference/react/useEffect
- https://react.dev/reference/react/useEffectEvent
