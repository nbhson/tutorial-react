# DAY 4: REF (BIẾN THAM CHIẾU TEMPLATE)

## Mục tiêu bài học
- Hiểu `useRef` tương đương `#template` + `@ViewChild` của Angular: giữ tham chiếu DOM hoặc giá trị mutable mà **không gây re-render**.
- Phân biệt rạch ròi khi nào dùng state (gây render) vs ref (không gây render) — lựa chọn sai là nguồn bug và hiệu năng kém.
- Cập nhật kiến thức React 19: `ref` giờ là prop bình thường, **không cần `forwardRef`** nữa.

## Khái niệm cốt lõi (Core)

### 1. `useRef` trả object `{ current }` ổn định qua mọi render
`const r = useRef(0)` tạo một object duy nhất lúc mount, mọi render sau dùng lại object đó. Đổi `r.current = 5` **không kích hoạt re-render**. Trái lại `setState` luôn re-render.

> 📄 **Code ví dụ:** [`examples/01-1-useref-tra-object-current-on-inh-qua.tsx`](examples/01-1-useref-tra-object-current-on-inh-qua.tsx)

Vì sao object ổn định quan trọng? Vì biến thường (`let id`) mất sau mỗi render (hàm chạy lại, biến tạo mới). Ref giữ qua render nên interval tạo ở effect mount vẫn đọc được ở cleanup unmount. Nếu dùng sai (ref để lưu dữ liệu cần hiển thị như tên user), UI không cập nhật dù `ref.current` đổi — vì React không biết để vẽ lại.

> **Tóm gọn 1 câu:** `useRef` là chiếc hộp `{ current }` sống xuyên suốt các render: đổi bên trong không ai hay (không re-render) — và đó vừa là sức mạnh vừa là bẫy.

### 2. Ba công dụng chính của ref
**a) Truy cập DOM node:** `ref.current?.focus()`, `scrollIntoView()`, đo `getBoundingClientRect()`, điều khiển video/audio. Đây là "escape hatch" — đi vòng quanh React khi React chưa có API trừu tượng.

> 📄 **Code ví dụ:** [`examples/02-2-ba-cong-dung-chinh-cua-ref.tsx`](examples/02-2-ba-cong-dung-chinh-cua-ref.tsx)

**b) Giữ giá trị mutable giữa các render:** timer id, interval id, render count, AbortController, giá trị "trước đó" để so sánh.

> 📄 **Code ví dụ:** [`examples/03-2-ba-cong-dung-chinh-cua-ref.tsx`](examples/03-2-ba-cong-dung-chinh-cua-ref.tsx)

**c) Giữ giá trị "mới nhất" cho callback tránh stale closure:** lưu bản mới nhất vào ref mỗi render, effect/event đọc ref thay vì closure cũ (hoặc dùng `useEffectEvent` React 19.2+ ở DAY 15).

> 📄 **Code ví dụ:** [`examples/04-2-ba-cong-dung-chinh-cua-ref.tsx`](examples/04-2-ba-cong-dung-chinh-cua-ref.tsx)

Nếu làm sai (dùng state cho timer id, dùng ref cho tên hiển thị), bạn vừa tốn render thừa vừa mất cập nhật UI — hai hướng sai đối xứng.

> **Tóm gọn 1 câu:** Ref có 3 việc: chạm DOM, giữ giá trị nội bộ, giữ giá trị mới nhất cho callback — cần hiển thị lên màn hình thì trở về nhà `useState`.

### 3. Ref là escape hatch — dùng khiêm tốn
Thao tác DOM bằng tay (`focus`, `scroll`, `play`) là đi vòng quanh React. Dùng khi React chưa có API tốt hơn. Đừng dùng ref để set text/style thay state — đó là jQuery trong React.

> 📄 **Code ví dụ:** [`examples/05-3-ref-la-escape-hatch-dung-khiem-ton.tsx`](examples/05-3-ref-la-escape-hatch-dung-khiem-ton.tsx)

> **Tóm gọn 1 câu:** Ref là cửa thoát hiểm: chỉ mở khi lối chính (state → render) không tới được — dùng cả ngày là chuyện của đám cháy, không phải việc hàng ngày.

### 4. React 19 — ref thành prop thường
Trước đây `<MyInput ref={...}>` với function component báo warning, phải bọc `forwardRef`. Từ React 19, `ref` là prop bình thường: component tự nhận qua destructuring, không cần `forwardRef`. `forwardRef` chỉ còn cho code cũ/thư viện chưa nâng.

> 📄 **Code ví dụ:** [`examples/06-4-react-19-ref-thanh-prop-thuong.tsx`](examples/06-4-react-19-ref-thanh-prop-thuong.tsx)

Vì sao `{...rest}` quan trọng? Vì component wrapper tốt phải "trong suốt": người dùng truyền attribute nào cũng tới được DOM, không phải sửa wrapper mỗi lần cần thêm prop.

> **Tóm gọn 1 câu:** React 19 cho `ref` quyền công dân prop thường — code mới không cần bọc `forwardRef` nữa.

### 5. Thời điểm đọc ref — chỉ chắc sau mount
`ref.current` render đầu là `null` (DOM chưa dựng). React gán node thật sau khi commit DOM. Đọc trong render sẽ null/sai; đọc trong `useEffect`/event mới đúng.

> 📄 **Code ví dụ:** [`examples/07-5-thoi-iem-oc-ref-chi-chac-sau.tsx`](examples/07-5-thoi-iem-oc-ref-chi-chac-sau.tsx)

> **Tóm gọn 1 câu:** `ref.current` là chìa khóa phát sau giờ G (commit DOM): trước đó coi như chưa phát (`null`) — đọc trong effect/event, chặn bằng `?.`.

### 6. `useImperativeHandle` — lộ API có kiểm soát
Khi component con muốn "lộ" vài method cho cha qua ref (tương đương gọi method public của Angular component). Dùng khiêm tốn, ưu tiên props/callback.

> 📄 **Code ví dụ:** [`examples/08-6-useimperativehandle-lo-api-co-kiem-soat.tsx`](examples/08-6-useimperativehandle-lo-api-co-kiem-soat.tsx)

> **Tóm gọn 1 câu:** `useImperativeHandle` là quầy dịch vụ của con: chỉ mở vài ô window (focus, reset) chứ không mở cả nhà cho cha tự do dạo.

### 7. Callback ref — linh hoạt hơn `useRef` khi cần logic lúc gắn/gỡ
`ref={(node) => {...}}` nhận node khi mount, `null` khi unmount. Dùng để đo, quan sát, đăng ký.

> 📄 **Code ví dụ:** [`examples/09-7-callback-ref-linh-hoat-hon-useref-khi.tsx`](examples/09-7-callback-ref-linh-hoat-hon-useref-khi.tsx)

> **Tóm gọn 1 câu:** Callback ref là "người nhắc việc": có node thì gọi báo, mất node cũng gọi báo — dùng khi cần hành động lúc gắn/gỡ chứ không chỉ giữ tham chiếu.

### Keyword chính
`useRef`, `ref`, `current`, `@ViewChild` ↔ ref, `forwardRef` (cũ), `useImperativeHandle`, `cleanup`, `interval`, `focus`, `escape hatch`, `callback ref`.

## Luồng hoạt động (Flow)
Mục này đi qua 11 bước theo vòng đời thật của ví dụ: mount → gán ref → tạo timer → bấm Focus → unmount — đọc theo thứ tự để thấy ref "thay đổi lòng dạ" ở từng thời điểm.
1. Component `App` mount: `useRef<HTMLInputElement>(null)` tạo `inputRef.current = null`; `idRef.current = undefined`; `useState(0)` cho `tick`; `useState(0)` cho `h`.
2. Render lần đầu: JSX sinh `<p>`, 2 input (`ref={inputRef}` gắn cả hai demo), nút Focus, div đo. Lúc này `inputRef.current` vẫn `null`.
3. Sau khi React dựng DOM (commit), React gán `inputRef.current = <input DOM node>` (node cuối cùng gắn ref thắng khi 2 element dùng chung ref — demo cố ý để thấy hành vi).
4. `useEffect([], )` chạy sau paint: tạo `setInterval` mỗi giây, lưu id vào `idRef.current`, trả cleanup `clearInterval`. Vì sao sau paint? Để không chặn vẽ lần đầu.
5. Mỗi giây: interval gọi `setTick(t => t+1)` (functional update) → re-render → `<p>Tick: {tick}</p>` cập nhật. `idRef` **không đổi tham chiếu**, không gây render — chỉ `tick` gây render.
6. Vì `inputRef` là object ổn định, giữa các render nó vẫn trỏ cùng input (trừ demo 2 input chung ref).
7. User bấm "Focus": `inputRef.current?.focus()` — `?.` an toàn nếu ref null. Trình duyệt focus ô input, bàn phím sẵn sàng gõ.
8. Callback ref của div đo chạy lúc mount với node thật → `setH(height)` → re-render hiển thị "Cao Xpx". Khi div unmount, callback chạy với `null` (ở đây bỏ qua).
9. Component unmount: React gọi cleanup `clearInterval(idRef.current)` và set `inputRef.current = null`. Không còn timer rò rỉ.
10. Dev StrictMode: effect chạy setup → cleanup → setup; timer được tạo/hủy/tạo lại, cuối cùng còn đúng 1 timer. Nếu thiếu cleanup, dev sẽ còn 2 timer chạy song song — tín hiệu lộ bug.
11. Nếu bạn dùng `useState` thay `idRef` cho interval id → mỗi lần tạo timer lại re-render → render lại tạo timer mới → loop. Đó là lý do phân loại state/ref ngay từ đầu.

## Ví dụ chi tiết
Khớp 1-1 với `example.tsx` cùng thư mục:

> 📄 **Code ví dụ:** [`examples/10-vi-du-chi-tiet.tsx`](examples/10-vi-du-chi-tiet.tsx)

## Giải thích từng phần
- Dòng `import { useEffect, useRef, useState }`: ba hook cho ba việc khác nhau — `useRef` giữ tham chiếu/DOM, `useEffect` quản timer (hệ thống ngoài), `useState` giữ giá trị hiển thị. Tách đúng vai trò là đã hiểu một nửa bài.
- Khối `function MyInput({ ref, ...rest })`: chuẩn React 19. `ref?: React.Ref<HTMLInputElement>` là type ref cho input; `& React.InputHTMLAttributes<HTMLInputElement>` gộp mọi attribute input (placeholder, disabled...). `{...rest}` spread xuống `<input>` nên `<MyInput placeholder disabled>` đều tới được DOM.
- Dòng `useRef<HTMLInputElement>(null)`: generic khai giữ node gì để `ref.current?.focus()` được type-check. Initial `null` vì render đầu chưa có DOM. Không truyền `new Expensive()` làm initial vì nó chạy mỗi render (khác `useState` lazy) — cần thì `useRef(null)` rồi khởi tạo trong effect.
- Dòng `useState(0)` cho `tick`: vì `tick` hiển thị trong `<p>`. Mỗi `setTick` báo React vẽ lại. Dùng functional `(t) => t + 1` để luôn cộng từ giá trị mới nhất dù interval closure cũ.
- Dòng `useRef<number | undefined>(undefined)` cho `idRef`: vì id không hiển thị. Biến thường mất sau render, state gây render thừa — ref là đáp án duy nhất đúng.
- Dòng `idRef.current = window.setInterval(...)`: `window.` để TS phân biệt với Node `setInterval` (trả `Timeout` object). Lưu vào ref nên các render sau vẫn đọc được id để clear.
- Dòng `return () => clearInterval(idRef.current)`: cleanup đối xứng setup. Deps `[]` nghĩa setup 1 lần, cleanup khi unmount. StrictMode dev setup→cleanup→setup nên timer cuối còn đúng 1 cái. Quên cleanup là rò rỉ + `setState` sau unmount.
- Dòng `<input ref={inputRef}>`: khi mount React gán node, unmount gán `null`. Hai input dùng chung ref trong demo: node sau thắng — cố ý để bạn thấy không nên chia sẻ ref cho 2 node (prod mỗi input một ref).
- Dòng `onClick={() => inputRef.current?.focus()}`: đọc ref trong event (đúng thời điểm, DOM đã có). `?.` vì có khoảnh khắc ref null (trước mount). Gọi `focus()` trực tiếp khi null sẽ crash.
- Dòng callback ref `ref={(node) => {...}}`: chạy với node khi mount, `null` khi unmount. Ở đây đo `getBoundingClientRect().height` rồi `setH` để hiển thị. Với danh sách nhiều node, dùng `Map` + callback ref thay vì mảng `useRef([])` push trong render (push trong render tích lũy sai).
- Quy tắc không đọc ref trong render để lấy dữ liệu UI: render phải pure (cùng props/state → cùng output). Đọc ref trong render làm output phụ thuộc DOM ngoài — khó đoán, StrictMode double-render lộ sai. Mọi tác dụng phụ để event/effect.

## Bảng so sánh Angular ↔ React
Mục này dịch từng khái niệm ref của Angular sang React — đọc cột Ghi chú để thấy React "bỏ bớt decorator" nhưng phải tự kỷ luật hơn (kiểm null, tự gom danh sách).
| Angular | React | Ghi chú |
|---|---|---|
| `#box` trong template | `useRef<HTMLDivElement>(null)` + `<div ref={boxRef}>` | Khai báo ở JS/TS thay vì template |
| `@ViewChild("box")` | `boxRef.current` (chỉ sau mount, đọc trong effect/event) | Cùng ý trỏ vào view child |
| `ElementRef.nativeElement` | `ref.current` (luôn kiểm tra null, dùng `?.`) | DOM node thật, không bọc thêm |
| `@ViewChildren` (danh sách) | callback ref giữ `Set`/`Map` node | React không có query danh sách sẵn, tự gom |
| `ngAfterViewInit` đọc DOM | `useEffect` / `useLayoutEffect` (DAY 15) | Sau khi DOM dựng mới đo được |
| `ViewChild` với component | prop `ref` + `useImperativeHandle` | `forwardRef` không còn bắt buộc từ React 19 |
| `Renderer2` thao tác DOM | DOM API trực tiếp qua ref (`focus`, `scrollIntoView`) | React không bọc renderer lớp nữa |
| Biến local giữ qua lifecycle | `useRef` giữ giá trị qua render | Không re-render, khác state |
| `@ViewChild` static true/false | ref luôn "static false" (sau mount) | Không có đọc sớm trước mount |

> **Cách đọc bảng này:** mỗi dòng là một cặp cũ ↔ mới; quan trọng nhất là 3 dòng đầu (`#box` → `useRef`, `@ViewChild` → `ref.current`, `ElementRef` → `ref.current`) — đọc xong 3 dòng đó là làm việc được, các dòng còn lại là trường hợp đặc biệt.

## Lỗi thường gặp (Common pitfalls)

Mục này gom 8 cái bẫy của ref — đa số xoay quanh hai rễ: "đọc/ghi ref sai thời điểm" và "nhầm ref với state".

### 1. Đọc `ref.current` ngay trong render
> 📄 **Code ví dụ:** [`examples/11-1-oc-ref-current-ngay-trong-render.tsx`](examples/11-1-oc-ref-current-ngay-trong-render.tsx)
> 📄 **Code ví dụ:** [`examples/12-1-oc-ref-current-ngay-trong-render.tsx`](examples/12-1-oc-ref-current-ngay-trong-render.tsx)

### 2. Dùng ref thay state cho dữ liệu cần hiển thị
> 📄 **Code ví dụ:** [`examples/13-2-dung-ref-thay-state-cho-du-lieu.tsx`](examples/13-2-dung-ref-thay-state-cho-du-lieu.tsx)
> 📄 **Code ví dụ:** [`examples/14-2-dung-ref-thay-state-cho-du-lieu.tsx`](examples/14-2-dung-ref-thay-state-cho-du-lieu.tsx)

### 3. Quên cleanup interval/subscription
> 📄 **Code ví dụ:** [`examples/15-3-quen-cleanup-interval-subscription.tsx`](examples/15-3-quen-cleanup-interval-subscription.tsx)
> 📄 **Code ví dụ:** [`examples/16-3-quen-cleanup-interval-subscription.tsx`](examples/16-3-quen-cleanup-interval-subscription.tsx)

### 4. Nhầm đổi `ref.current` sẽ render lại
Mô tả: `ref.current = x` xong chờ UI đổi — không bao giờ đổi. Fix: phân loại ngay từ đầu — hiển thị thì state, nội bộ thì ref.

### 5. Dùng `forwardRef` theo thói quen cũ
> 📄 **Code ví dụ:** [`examples/17-5-dung-forwardref-theo-thoi-quen-cu.tsx`](examples/17-5-dung-forwardref-theo-thoi-quen-cu.tsx)
> 📄 **Code ví dụ:** [`examples/18-5-dung-forwardref-theo-thoi-quen-cu.tsx`](examples/18-5-dung-forwardref-theo-thoi-quen-cu.tsx)

### 6. Bấm Focus trước khi mount → crash nếu không `?.`
> 📄 **Code ví dụ:** [`examples/19-6-bam-focus-truoc-khi-mount-crash-neu.tsx`](examples/19-6-bam-focus-truoc-khi-mount-crash-neu.tsx)
> 📄 **Code ví dụ:** [`examples/20-6-bam-focus-truoc-khi-mount-crash-neu.tsx`](examples/20-6-bam-focus-truoc-khi-mount-crash-neu.tsx)

### 7. Tạo ref mảng bằng `push` trong render
> 📄 **Code ví dụ:** [`examples/21-7-tao-ref-mang-bang-push-trong-render.tsx`](examples/21-7-tao-ref-mang-bang-push-trong-render.tsx)
> 📄 **Code ví dụ:** [`examples/22-7-tao-ref-mang-bang-push-trong-render.tsx`](examples/22-7-tao-ref-mang-bang-push-trong-render.tsx)

### 8. Gắn `ref` cho function component không forward/gắn xuống DOM
Mô tả: `<MyComp ref={r}>` nhưng `MyComp` không nhận `ref` prop và không gắn vào element thật → `r.current` null mãi.
> 📄 **Code ví dụ:** [`examples/23-8-gan-ref-cho-function-component-khong-forward.tsx`](examples/23-8-gan-ref-cho-function-component-khong-forward.tsx)
> 📄 **Code ví dụ:** [`examples/24-8-gan-ref-cho-function-component-khong-forward.tsx`](examples/24-8-gan-ref-cho-function-component-khong-forward.tsx)

## Best practices / Mẹo
- **Công thức chọn:** cần hiển thị khi đổi → `useState`; cần thao tác DOM hoặc giữ giá trị nội bộ (timer id, controller) → `useRef`. Vì sao? Vì chọn sai là vừa sai UI vừa tốn render.
- Trong callback cần **giá trị mới nhất**, lưu bản vào ref mỗi render (`latestRef.current = value`) hoặc dùng `useEffectEvent` (React 19.2+) cho effect. Vì sao? Để tránh stale closure mà không thêm deps thừa.
- Đo kích thước: ref + `ResizeObserver`/`getBoundingClientRect` trong effect/layout effect (DAY 15). Vì sao layout effect? Để đo trước paint, tránh nháy.
- Callback ref khi cần "notify" node thay đổi (đo khi vào viewport, đếm mount). Vì sao? Vì `useRef` object không báo khi node đổi, callback thì có.
- Với form đơn giản, uncontrolled + ref có thể nhanh hơn controlled — nhưng controlled thắng về nhất quán/validate (DAY 11). Đo rồi chọn, đừng mặc định.
- Tránh đọc/ghi `ref.current` trong render để giữ render pure; mọi tác dụng phụ để event/effect. Vì sao? Vì render double ở StrictMode sẽ lộ ngay nếu bạn dựa vào ref trong render.
- Dùng ref giữ `AbortController` cho ô search: mỗi lần gõ hủy request cũ trước khi gọi mới — tránh race condition (kết quả cũ về sau ghi đè mới).

> **Tóm gọn 1 câu:** Công thức vàng: hiển thị thì `useState`, nội bộ/`DOM` thì `useRef` — nhầm hai bên là vừa UI đơ vừa render thừa.

## Bài tập nhỏ
1. Thêm nút "Stop" gọi `clearInterval(idRef.current)` và nút "Start" tạo interval mới — kiểm tra id mới vẫn quản lý qua ref, không thêm render thừa.
2. Tạo `MyInput` nhận `ref` trực tiếp (không `forwardRef`) và focus nó từ nút cha — xác nhận React 19 behavior (ref là prop).
3. Đo chiều cao một `div` bằng callback ref + `getBoundingClientRect()` trong `useLayoutEffect`, cập nhật khi resize (thêm `resize` listener + cleanup).
4. Giữ `prevTick` bằng ref: hiển thị "trước: X, nay: Y" — chứng minh ref đổi không gây thêm render.
5. Dùng ref giữ `AbortController` cho ô search: mỗi lần gõ hủy request cũ trước khi gọi request mới — quan sát không còn race.

## Reference
- https://react.dev/learn/referencing-values-with-refs
- https://react.dev/learn/manipulating-the-dom-with-refs
- https://react.dev/reference/react/useRef
- https://react.dev/reference/react/useImperativeHandle
