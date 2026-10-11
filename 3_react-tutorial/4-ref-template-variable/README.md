# DAY 4: REF (BIẾN THAM CHIẾU TEMPLATE)

## Mục tiêu bài học
- Hiểu `useRef` tương đương `#template` + `@ViewChild` của Angular: giữ tham chiếu DOM hoặc giá trị mutable mà **không gây re-render**.
- Phân biệt rạch ròi khi nào dùng state (gây render) vs ref (không gây render) — lựa chọn sai là nguồn bug và hiệu năng kém.
- Cập nhật kiến thức React 19: `ref` giờ là prop bình thường, **không cần `forwardRef`** nữa.

## Khái niệm cốt lõi (Core)

### 1. `useRef` trả object `{ current }` ổn định qua mọi render
`const r = useRef(0)` tạo một object duy nhất lúc mount, mọi render sau dùng lại object đó. Đổi `r.current = 5` **không kích hoạt re-render**. Trái lại `setState` luôn re-render.

```tsx
// Minh họa trong example.tsx: 2 loại "bộ nhớ" khác nhau
const [tick, setTick] = useState(0); // đổi -> vẽ lại <p>Tick: ...</p>
const idRef = useRef<number | undefined>(undefined); // đổi -> KHÔNG vẽ lại
// Vì sao id interval là ref? Vì id chỉ để cleanup, không hiển thị. Dùng state sẽ
// re-render mỗi lần tạo timer — thừa và dễ loop (render -> tạo timer -> render...).
```

Vì sao object ổn định quan trọng? Vì biến thường (`let id`) mất sau mỗi render (hàm chạy lại, biến tạo mới). Ref giữ qua render nên interval tạo ở effect mount vẫn đọc được ở cleanup unmount. Nếu dùng sai (ref để lưu dữ liệu cần hiển thị như tên user), UI không cập nhật dù `ref.current` đổi — vì React không biết để vẽ lại.

### 2. Ba công dụng chính của ref
**a) Truy cập DOM node:** `ref.current?.focus()`, `scrollIntoView()`, đo `getBoundingClientRect()`, điều khiển video/audio. Đây là "escape hatch" — đi vòng quanh React khi React chưa có API trừu tượng.

```tsx
// example.tsx: focus khi bấm nút
const inputRef = useRef<HTMLInputElement>(null); // generic chỉ rõ giữ node gì
<input ref={inputRef} placeholder="Nhập tên..." />
<button onClick={() => inputRef.current?.focus()}>Focus</button>
// ?. vì render đầu ref là null (DOM chưa dựng), bấm sớm không crash
```

**b) Giữ giá trị mutable giữa các render:** timer id, interval id, render count, AbortController, giá trị "trước đó" để so sánh.

```tsx
// example.tsx: giữ id interval để cleanup
idRef.current = window.setInterval(() => setTick((t) => t + 1), 1000);
return () => clearInterval(idRef.current); // cleanup đối xứng setup
```

**c) Giữ giá trị "mới nhất" cho callback tránh stale closure:** lưu bản mới nhất vào ref mỗi render, effect/event đọc ref thay vì closure cũ (hoặc dùng `useEffectEvent` React 19.2+ ở DAY 15).

```tsx
// Pattern giữ giá trị trước đó để so sánh:
const prevRef = useRef(value);
useEffect(() => { prevRef.current = value; }); // cập nhật sau mỗi render
// Render: prevRef.current là giá trị render trước, value là hiện tại
```

Nếu làm sai (dùng state cho timer id, dùng ref cho tên hiển thị), bạn vừa tốn render thừa vừa mất cập nhật UI — hai hướng sai đối xứng.

### 3. Ref là escape hatch — dùng khiêm tốn
Thao tác DOM bằng tay (`focus`, `scroll`, `play`) là đi vòng quanh React. Dùng khi React chưa có API tốt hơn. Đừng dùng ref để set text/style thay state — đó là jQuery trong React.

```tsx
// ✅ ĐÚNG: focus, đo kích thước, scroll — React không có declarative API tốt hơn
inputRef.current?.focus();
const h = node.getBoundingClientRect().height;

// ❌ SAI: dùng ref để đổi text hiển thị thay state — UI lệch, khó test
labelRef.current!.textContent = name; // nên <p>{name}</p> với state
```

### 4. React 19 — ref thành prop thường
Trước đây `<MyInput ref={...}>` với function component báo warning, phải bọc `forwardRef`. Từ React 19, `ref` là prop bình thường: component tự nhận qua destructuring, không cần `forwardRef`. `forwardRef` chỉ còn cho code cũ/thư viện chưa nâng.

```tsx
// example.tsx minh họa chuẩn mới:
function MyInput({ ref, ...rest }: { ref?: React.Ref<HTMLInputElement> } & React.InputHTMLAttributes<HTMLInputElement>) {
  return <input ref={ref} {...rest} />; // gắn ref xuống DOM thật
}
// Dùng: <MyInput ref={inputRef} placeholder="..." />
// {...rest} là "mở đuôi": placeholder, disabled, className... truyền gì cũng xuống input
```

Vì sao `{...rest}` quan trọng? Vì component wrapper tốt phải "trong suốt": người dùng truyền attribute nào cũng tới được DOM, không phải sửa wrapper mỗi lần cần thêm prop.

### 5. Thời điểm đọc ref — chỉ chắc sau mount
`ref.current` render đầu là `null` (DOM chưa dựng). React gán node thật sau khi commit DOM. Đọc trong render sẽ null/sai; đọc trong `useEffect`/event mới đúng.

```tsx
// ❌ SAI: đọc ngay trong render — luôn null lần đầu
function App() {
  const r = useRef<HTMLDivElement>(null);
  const h = r.current?.clientHeight; // null — DOM chưa có
  return <div ref={r}>Hi</div>;
}

// ✅ ĐÚNG: đọc trong effect (sau khi DOM dựng) hoặc event
useEffect(() => { console.log(r.current?.clientHeight); }, []);
<button onClick={() => r.current?.focus()}>Focus</button>
```

### 6. `useImperativeHandle` — lộ API có kiểm soát
Khi component con muốn "lộ" vài method cho cha qua ref (tương đương gọi method public của Angular component). Dùng khiêm tốn, ưu tiên props/callback.

```tsx
// Con chỉ lộ focus + clear, không lộ toàn bộ DOM:
import { useImperativeHandle, useRef } from "react";
function Search({ ref }: { ref?: React.Ref<{ focus: () => void }> }) {
  const inner = useRef<HTMLInputElement>(null);
  useImperativeHandle(ref, () => ({ focus: () => inner.current?.focus() }), []);
  return <input ref={inner} />;
}
```

### 7. Callback ref — linh hoạt hơn `useRef` khi cần logic lúc gắn/gỡ
`ref={(node) => {...}}` nhận node khi mount, `null` khi unmount. Dùng để đo, quan sát, đăng ký.

```tsx
// example.tsx: đo chiều cao khi div xuất hiện
const [h, setH] = useState(0);
<div ref={(node) => { if (node) setH(node.getBoundingClientRect().height); }}>
  Cao {h}px
</div>
// Vì sao callback mà không useRef + effect? Vì callback chạy đúng lúc node gắn/gỡ,
// không cần effect theo dõi thêm. Với nhiều node, dùng Map + callback ref.
```

### Keyword chính
`useRef`, `ref`, `current`, `@ViewChild` ↔ ref, `forwardRef` (cũ), `useImperativeHandle`, `cleanup`, `interval`, `focus`, `escape hatch`, `callback ref`.

## Luồng hoạt động (Flow)
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

```tsx
// example.tsx — DAY 4: useRef focus + giữ timer id + ref là prop (React 19)
// Mục đích: phân biệt state (gây render) vs ref (không render) + minh họa
// React 19 ref là prop thường, callback ref đo DOM.
import { useEffect, useRef, useState } from "react"; // (1) useRef giữ tham chiếu, useEffect cho timer, useState cho tick hiển thị

// (2) React 19: MyInput nhận ref như prop thường — KHÔNG cần forwardRef nữa.
// ...rest spread phần còn lại xuống <input> để "mở đuôi" tùy biến.
function MyInput({ ref, ...rest }: { ref?: React.Ref<HTMLInputElement> } & React.InputHTMLAttributes<HTMLInputElement>) {
  return <input ref={ref} {...rest} />;
}

export default function App() {
  // (3) ref DOM: ban đầu null (chưa có DOM), sau mount trỏ vào <input>. Đổi .current KHÔNG render.
  const inputRef = useRef<HTMLInputElement>(null);
  // (4) tick PHẢI là state vì cần hiển thị ra UI — mỗi giây setTick -> re-render <p>.
  const [tick, setTick] = useState(0);
  // (5) id interval CHỈ là ref vì không hiển thị — lưu để cleanup, không gây render thừa.
  // Vì sao không dùng biến thường? Vì biến mất sau mỗi render, ref giữ qua mọi render.
  const idRef = useRef<number | undefined>(undefined);
  // (6) Đo chiều cao demo callback ref: ref là hàm nhận node (hoặc null khi unmount).
  const [h, setH] = useState(0);

  useEffect(() => {
    // (7) Mount: tạo interval mỗi giây, lưu id vào ref (không gây render).
    idRef.current = window.setInterval(() => setTick((t) => t + 1), 1000);
    // (8) Cleanup = ngOnDestroy: dừng timer khi unmount. StrictMode dev gọi cleanup này rồi setup lại.
    return () => clearInterval(idRef.current);
  }, []); // deps [] = chạy 1 lần sau mount

  return (
    <>
      <p>Tick: {tick}</p>
      {/* (9) ref={...} là "template reference" của React — sau mount inputRef.current = node DOM */}
      <input ref={inputRef} placeholder="Nhập tên..." />
      {/* (10) MyInput nhận ref như prop thường (React 19) */}
      <MyInput ref={inputRef} placeholder="Input qua prop ref (dùng chung ref demo)" />
      {/* (11) ?. an toàn nếu ref null (bấm trước khi mount) — không crash */}
      <button onClick={() => inputRef.current?.focus()}>Focus</button>
      {/* (12) Callback ref: mỗi lần div mount/unmount, hàm chạy với node/null để đo */}
      <div ref={(node) => { if (node) setH(node.getBoundingClientRect().height); }}>
        Cao {h}px — khối đo bằng callback ref
      </div>
    </>
  );
}
```

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

## Lỗi thường gặp (Common pitfalls)

### 1. Đọc `ref.current` ngay trong render
```tsx
// ❌ SAI: lúc render DOM chưa dựng (hoặc giá trị cũ) — luôn null lần đầu
function App() {
  const r = useRef<HTMLDivElement>(null);
  const h = r.current?.clientHeight; // null
  return <div ref={r}>Hi</div>;
}
```
```tsx
// ✅ ĐÚNG: đọc trong effect/event — sau khi DOM có
function App() {
  const r = useRef<HTMLDivElement>(null);
  useEffect(() => { console.log(r.current?.clientHeight); }, []);
  return <div ref={r}>Hi</div>;
}
```

### 2. Dùng ref thay state cho dữ liệu cần hiển thị
```tsx
// ❌ SAI: đổi ref không vẽ lại — UI đứng im dù dữ liệu đổi
const nameRef = useRef("Son");
<button onClick={() => { nameRef.current = "Linh"; }}>Đổi</button>
<p>{nameRef.current}</p> // vẫn "Son"
```
```tsx
// ✅ ĐÚNG: cần hiển thị thì state
const [name, setName] = useState("Son");
<button onClick={() => setName("Linh")}>Đổi</button>
<p>{name}</p>
```

### 3. Quên cleanup interval/subscription
```tsx
// ❌ SAI: timer chạy mãi sau unmount — rò rỉ + setState trên unmounted
useEffect(() => { setInterval(() => setTick((t) => t + 1), 1000); }, []);
```
```tsx
// ✅ ĐÚNG: luôn return cleanup đối xứng
useEffect(() => {
  const id = window.setInterval(() => setTick((t) => t + 1), 1000);
  return () => clearInterval(id);
}, []);
```

### 4. Nhầm đổi `ref.current` sẽ render lại
Mô tả: `ref.current = x` xong chờ UI đổi — không bao giờ đổi. Fix: phân loại ngay từ đầu — hiển thị thì state, nội bộ thì ref.

### 5. Dùng `forwardRef` theo thói quen cũ
```tsx
// ❌ SAI (thừa ở React 19): bọc forwardRef dài dòng
import { forwardRef } from "react";
const Old = forwardRef<HTMLInputElement>((p, ref) => <input ref={ref} {...p} />);
```
```tsx
// ✅ ĐÚNG: nhận ref như prop thường
function New({ ref, ...rest }: { ref?: React.Ref<HTMLInputElement> } & React.InputHTMLAttributes<HTMLInputElement>) {
  return <input ref={ref} {...rest} />;
}
```

### 6. Bấm Focus trước khi mount → crash nếu không `?.`
```tsx
// ❌ SAI: ref null lúc đầu — crash Cannot read properties of null
<button onClick={() => inputRef.current.focus()}>Focus</button>
```
```tsx
// ✅ ĐÚNG: optional chaining hoặc check null
<button onClick={() => inputRef.current?.focus()}>Focus</button>
```

### 7. Tạo ref mảng bằng `push` trong render
```tsx
// ❌ SAI: mỗi render push thêm — mảng phình, index lệch
const refs = useRef<HTMLElement[]>([]);
<div ref={(el) => { if (el) refs.current.push(el); }} />
```
```tsx
// ✅ ĐÚNG: callback ref gán theo index/key, hoặc Map
const map = useRef(new Map<string, HTMLElement>());
<div ref={(el) => { if (el) map.current.set(id, el); else map.current.delete(id); }} />
```

### 8. Gắn `ref` cho function component không forward/gắn xuống DOM
Mô tả: `<MyComp ref={r}>` nhưng `MyComp` không nhận `ref` prop và không gắn vào element thật → `r.current` null mãi.
```tsx
// ❌ SAI: con bỏ qua ref
function MyComp() { return <input />; }
```
```tsx
// ✅ ĐÚNG (React 19): con nhận ref và gắn vào DOM
function MyComp({ ref }: { ref?: React.Ref<HTMLInputElement> }) { return <input ref={ref} />; }
```

## Best practices / Mẹo
- **Công thức chọn:** cần hiển thị khi đổi → `useState`; cần thao tác DOM hoặc giữ giá trị nội bộ (timer id, controller) → `useRef`. Vì sao? Vì chọn sai là vừa sai UI vừa tốn render.
- Trong callback cần **giá trị mới nhất**, lưu bản vào ref mỗi render (`latestRef.current = value`) hoặc dùng `useEffectEvent` (React 19.2+) cho effect. Vì sao? Để tránh stale closure mà không thêm deps thừa.
- Đo kích thước: ref + `ResizeObserver`/`getBoundingClientRect` trong effect/layout effect (DAY 15). Vì sao layout effect? Để đo trước paint, tránh nháy.
- Callback ref khi cần "notify" node thay đổi (đo khi vào viewport, đếm mount). Vì sao? Vì `useRef` object không báo khi node đổi, callback thì có.
- Với form đơn giản, uncontrolled + ref có thể nhanh hơn controlled — nhưng controlled thắng về nhất quán/validate (DAY 11). Đo rồi chọn, đừng mặc định.
- Tránh đọc/ghi `ref.current` trong render để giữ render pure; mọi tác dụng phụ để event/effect. Vì sao? Vì render double ở StrictMode sẽ lộ ngay nếu bạn dựa vào ref trong render.
- Dùng ref giữ `AbortController` cho ô search: mỗi lần gõ hủy request cũ trước khi gọi mới — tránh race condition (kết quả cũ về sau ghi đè mới).

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
