# DAY 4: REF (BIẾN THAM CHIẾU TEMPLATE)

## Mục tiêu bài học
- Hiểu `useRef` tương đương `#template` + `@ViewChild` của Angular: giữ tham chiếu DOM hoặc giá trị mutable mà **không gây re-render**.
- Phân biệt rạch ròi khi nào dùng state (gây render) vs ref (không gây render) — lựa chọn sai là nguồn bug và hiệu năng kém.
- Cập nhật kiến thức React 19: `ref` giờ là prop bình thường, **không cần `forwardRef`** nữa.

## Khái niệm cốt lõi (Core)
- **`useRef(initial)` trả về object `{ current }` ổn định** — cùng một object qua mọi lần render. Đổi `ref.current` **không kích hoạt re-render**; trái lại `useState` luôn re-render khi set.
- **3 công dụng chính của ref:**
  1. Truy cập DOM node: `ref.current?.focus()`, đo kích thước, scroll, quản lý video/audio.
  2. Giữ giá trị mutable giữa các render: timer id, id interval, "render count", giá trị quan sát.
  3. Chứa dữ liệu "thấy-lấy-ngay" trong callback cần giá trị mới nhất (tránh stale closure).
- **Ref là escape hatch**: nếu bạn thao tác DOM bằng tay, bạn đang đi vòng quanh React. Dùng khi React chưa có API trừu tượng hóa tốt hơn (focus, autoplay, đo đạc).
- **React 19 — ref thành prop thường:** `<MyInput ref={...}>` không còn cảnh báo; component tự nhận `ref` qua destructuring. `forwardRef` chỉ còn cho code cũ/đồng bộ thư viện.
- **Thời điểm đọc ref:** `ref.current` chỉ chắc chắn có giá trị **sau khi component mount** (DOM đã dựng). Trong render đầu tiên thường là `null`.
- **Ref không phải state:** ref không tham gia "data flow" của React — đổi nó không tạo UI mới. Đừng dùng ref để lưu dữ liệu cần hiển thị.
- **`useImperativeHandle`:** khi component con cần "lộ" một số API cho cha qua ref (tương đương gọi method public). Dùng khiêm tốn.
- **Ref và SSR:** ref chỉ có sau khi client mount — code SSR không được dựa vào `ref.current` lúc render.
- **Không cần `forwardRef` từ React 19:** truyền `ref` như prop thường; `forwardRef` để tương thích thư viện cũ.
- **Keyword chính:** `useRef`, `ref`, `current`, `@ViewChild`, `forwardRef` (cũ), `useImperativeHandle`, `cleanup`, `interval`, `focus`, `escape hatch`.

## Luồng hoạt động (Flow)
1. Component `App` mount: `useRef<HTMLInputElement>(null)` → tạo `inputRef.current = null`; `idRef.current = undefined`; `useState(0)` cho `tick`.
2. Render lần đầu: JSX sinh input + nút Focus; `ref={inputRef}` gắn callback.
3. Sau khi React dựng DOM, React gán `inputRef.current = <input DOM node>`.
4. `useEffect([], )` chạy sau khi DOM đã vẽ (commit): tạo `setInterval` mỗi giây, lưu id vào `idRef.current`, trả cleanup `clearInterval`.
5. Mỗi giây: interval gọi `setTick(t => t+1)` → re-render → `<p>Tick: {tick}</p>` cập nhật. `idRef` **không đổi**, không gây render.
6. Vì `inputRef` là object ổn định, giữa các render nó vẫn trỏ cùng input.
7. User bấm "Focus": `inputRef.current?.focus()` — `?.` an toàn nếu ref null.
8. Component unmount: React gọi cleanup `clearInterval(idRef.current)` và set `inputRef.current = null`.
9. Dev StrictMode: effect chạy setup → cleanup → setup; timer được tạo/hủy/tạo lại, cuối cùng còn 1 timer.
10. Nếu bạn dùng `useState` thay `idRef` cho interval id → mỗi lần tạo timer lại re-render, dễ loop.

## Ví dụ chi tiết
```tsx
// example.tsx — DAY 4: useRef focus + giữ timer id
import { useEffect, useRef, useState } from "react";

export default function App() {
  // ref DOM: ban đầu null, sau mount trỏ vào input
  const inputRef = useRef<HTMLInputElement>(null);
  const [tick, setTick] = useState(0);
  // ref lưu id interval — vì interval ID không cần render
  const idRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    // mount: lưu id interval vào ref (không gây render mỗi giây)
    idRef.current = window.setInterval(() => setTick((t) => t + 1), 1000);
    // cleanup = ngOnDestroy: dừng timer khi unmount
    return () => clearInterval(idRef.current);
  }, []);

  return (
    <>
      <p>Tick: {tick}</p>
      {/* ref={...} là "template reference" của React */}
      <input ref={inputRef} placeholder="Nhập tên..." />
      <button onClick={() => inputRef.current?.focus()}>Focus</button>
    </>
  );
}
```

React 19: `ref` là prop bình thường, không cần `forwardRef`:

```tsx
function MyInput({ ref, ...rest }: { ref?: React.Ref<HTMLInputElement> } & React.InputHTMLAttributes<HTMLInputElement>) {
  return <input ref={ref} {...rest} />;
}
// Dùng: <MyInput ref={inputRef} placeholder="..." />
```

Callback ref — chạy logic khi node gắn/gỡ (linh hoạt hơn `useRef`):

```tsx
function Measure() {
  const [h, setH] = useState(0);
  // callback ref nhận node (hoặc null khi unmount)
  const ref = (node: HTMLDivElement | null) => {
    if (node) setH(node.getBoundingClientRect().height);
  };
  return <div ref={ref}>Cao {h}px</div>;
}
```

## Giải thích từng phần
- `useRef<HTMLInputElement>(null)`: generic cho biết ref giữ kiểu gì; truyền `null` làm initial vì render đầu chưa có DOM.
- `ref={inputRef}`: khi mount, React gán `inputRef.current` = element; khi unmount, gán lại `null`.
- `idRef.current = window.setInterval(...)`: vì `idRef` ổn định qua render, các lần render sau vẫn đọc được id — biến thường sẽ mất sau mỗi render.
- `return () => clearInterval(idRef.current)`: mọi effect nên có cleanup đối xứng (setup hủy). Deps `[]` → setup 1 lần, cleanup khi unmount.
- `?.focus()`: optional chaining — nếu ref chưa gắn (`null`), không crash.
- **Vì sao `tick` là state còn `idRef` là ref?** — `tick` phải hiển thị ra UI nên cần re-render; id interval không hiển thị nên chỉ cần lưu.
- `React.Ref<HTMLInputElement>`: kiểu ref của React 19 cho element input; dùng trong props thay `forwardRef`.
- `{...rest}`: spread phần props còn lại xuống input — component "mở đuôi" tùy biến.
- **Callback ref:** `ref={(node) => { ... }}` cho phép chạy logic khi node gắn/gỡ — linh hoạt hơn `useRef`.
- **Ref lưu giá trị trước đó:** `const prev = useRef(value)` cập nhật trong effect để so sánh — pattern phổ biến.
- **Không đọc ref trong render** để lấy dữ liệu UI — render phải pure; đọc ref trong effect/event.
- **Đo DOM:** kết hợp ref + `ResizeObserver`/`getBoundingClientRect` trong effect/layout effect (DAY 15).

## Bảng so sánh Angular ↔ React
| Angular | React | Ghi chú |
|---|---|---|
| `#box` trong template | `useRef<HTMLDivElement>(null)` + `<div ref={boxRef}>` | Khai báo ở JS/TS |
| `@ViewChild("box")` | `boxRef.current` (chỉ sau mount) | Đọc trong effect/event |
| `ElementRef.nativeElement` | `ref.current` (luôn kiểm tra null) | DOM node thật |
| `@ViewChildren` (danh sách) | callback ref giữ `Set`/`Map` node | React không có query danh sách sẵn |
| `ngAfterViewInit` đọc DOM | `useEffect` / `useLayoutEffect` | Xem DAY 15 |
| `ViewChild` với component | prop `ref` + `useImperativeHandle` | `forwardRef` không còn bắt buộc từ React 19 |
| `Renderer2` thao tác DOM | DOM API trực tiếp qua ref | React không bọc renderer |
| `local variable` trong component | `useRef` giữ giá trị qua render | Không re-render |
| `@ViewChild` với ElementRef | `useRef<HTMLElement>` + `ref` | Cùng mục đích |

## Lỗi thường gặp (Common pitfalls)
- **Đọc `ref.current` ngay trong render** → lúc đó là `null` (DOM chưa dựng) hoặc giá trị cũ → sai. → Fix: đọc trong `useEffect`, sự kiện.
- **Dùng ref thay vì state khi muốn hiển thị dữ liệu** → UI không cập nhật dù dữ liệu đổi. → Fix: cần render thì dùng state.
- **Quên cleanup interval/subscription** → rò rỉ bộ nhớ; StrictMode dev báo rõ. → Fix: luôn `return () => ...`.
- **Nhầm tưởng đổi `ref.current` sẽ render lại** → không. → Fix: phân loại state vs ref ngay từ đầu.
- **Dùng `forwardRef` theo thói quen React cũ** → code thừa; React 19 khuyên bỏ. → Fix: nhận `ref` trực tiếp như prop.
- **Bấm Focus trước khi input mount** → `inputRef.current.focus()` crash. → Fix: optional chaining `?.` hoặc kiểm tra null.
- **Tạo ref mảng bằng cách gọi `useRef([])` rồi push trong render** → tích lũy sai. → Fix: dùng callback ref gán theo index, hoặc `Map`.
- **Đặt initial value nặng trong `useRef(new Expensive())`** → chạy mỗi render (khác `useState` lazy). → Fix: `useRef(null)` rồi khởi tạo trong effect nếu cần.
- **Dùng ref cho "state ẩn" phức tạp** → khó debug. → Fix: state + reducer/store cho logic phức tạp.
- **Gắn `ref` cho function component mong nhận DOM** → con phải tự forward/gắn ref cho DOM (React 19 nhận prop `ref`). → Fix: con nhận `ref` và gắn vào element thật.
- **StrictMode tạo 2 interval trong dev do thiếu cleanup** → nền tảng lộ bug. → Fix: viết cleanup đúng, không "tắt" StrictMode.

## Best practices / Mẹo
- **Công thức chọn:** cần hiển thị/mất khi đổi → `useState`; cần thao tác DOM hoặc giữ giá trị nội bộ → `useRef`.
- Trong callback event/effect cần **giá trị mới nhất** của state — lưu bản vào ref (`latestRef.current = value` mỗi render), hoặc dùng `useEffectEvent` (React 19.2+) cho effect.
- `useImperativeHandle` giờ viết gọn hơn vì `ref` là prop — nhưng ưu tiên props + callbacks.
- Đo kích thước/phần tử: ref + `ResizeObserver` trong effect; React 19.3 kết hợp `useEffectEvent` để đọc không stale.
- Callback ref dùng khi cần "notify" node thay đổi (ví dụ đo khi node vào viewport).
- Gắn ref cho component chứa DOM (không phải function component thuần) — function component không tự nhận ref cho DOM.
- Với form đơn giản, uncontrolled + ref có thể nhanh hơn controlled — nhưng controlled thắng về nhất quán (DAY 11).
- Gộp nhiều ref DOM khi cần đo nhiều phần tử: dùng một `Map`/object callback ref thay vì nhiều `useRef`.
- Tránh đọc/ghi `ref.current` trong render để giữ render thuần (pure); mọi tác dụng phụ để event/effect.
- Dùng `useRef` cho "abort controller" giữ request trước để hủy request cũ khi input đổi (search box).

## Bài tập nhỏ
1. Thêm nút "Stop" gọi `clearInterval(idRef.current)` và nút "Start" tạo interval mới — kiểm tra id mới vẫn quản lý qua ref.
2. Tạo `MyInput` nhận `ref` trực tiếp (không `forwardRef`) và focus nó từ nút cha — xác nhận React 19 behavior.
3. Đo chiều cao một `div` bằng ref + `getBoundingClientRect()` trong `useLayoutEffect`, in ra và cập nhật khi resize.
4. Giữ `prevTick` bằng ref: hiển thị "trước: X, nay: Y" — không gây thêm render.
5. Dùng callback ref đếm số input đang mount và hiển thị count bằng state.
6. Dùng ref giữ `AbortController` cho ô search: mỗi lần gõ hủy request cũ trước khi gọi request mới.

## Reference
- https://react.dev/learn/referencing-values-with-refs
- https://react.dev/learn/manipulating-the-dom-with-refs
- https://react.dev/reference/react/useRef
- https://react.dev/reference/react/useImperativeHandle