# DAY 3: PROPS & TƯƠNG TÁC COMPONENT

## Mục tiêu bài học
- Nắm `props` là kênh dữ liệu một chiều cha → con, read-only (tương đương `@Input`), và callback qua props cho con → cha (tương đương `@Output` + `EventEmitter`).
- Thành thạo pattern **lifting state up**: đưa state lên cha chung khi nhiều component cần chia sẻ dữ liệu.
- TypeScript type cho props chính là "API contract" — viết tốt để IDE gợi ý và bắt lỗi sớm.

## Khái niệm cốt lõi (Core)

### 1. Props là argument của function component
Component nhận props qua destructuring `({ name, age }: Props)`. Vì là function argument nên **read-only** theo nguyên tắc — không được gán `props.name = ...`. Muốn đổi, cha phải truyền giá trị mới (cha đổi state rồi render lại).

```tsx
// Greeting trong example.tsx: props string + default value
type GreetingProps = { name: string; greeting?: string };

function Greeting({ name, greeting = "Xin chào" }: GreetingProps) {
  // greeting có default khi cha không truyền — thay defaultProps đã bỏ
  // Vì sao default ở destructuring? Vì defaultProps không còn cho function component.
  return <p>{greeting}, {name}!</p>;
}

// Dùng: <Greeting name="Linh" greeting="Chào buổi sáng" /> hoặc <Greeting name={name} />
```

Vì sao read-only? Vì mỗi render cha tạo object props mới, con chỉ đọc snapshot đó. Gán `props.name = "x"` chỉ sửa object cục bộ, render sau cha truyền lại giá trị cũ → UI "nhảy về", bug khó hiểu. Quy tắc: con muốn đổi → báo cha qua callback (mục 3), cha đổi state, props mới chảy xuống.

### 2. Unidirectional data flow (một chiều)
Dữ liệu chảy xuống qua props, sự kiện chảy lên qua callback. Không có `[()]` banana-in-a-box của Angular; hai chiều được mô hình hóa thành "cha cho giá trị + con báo sự kiện".

```tsx
// Hai chiều "giả" từ 2 một chiều — TextInput trong example.tsx:
type TextInputProps = { value: string; onValueChange: (next: string) => void };

function TextInput({ value, onValueChange }: TextInputProps) {
  // Con không giữ state — value do cha cho, gõ thì báo cha bằng payload sạch
  return <input value={value} onChange={(e) => onValueChange(e.target.value)} />;
}
// Cha: <TextInput value={name} onValueChange={setName} />
// Gõ "x" -> onValueChange("Sonx") -> setName -> name mới -> value mới chảy xuống
```

Vì sao một chiều tốt? Vì không bao giờ có hai nguồn sự thật. Muốn biết `TextInput` hiện gì, nhìn `name` ở cha là đủ. Angular `[(ngModel)]` tiện nhưng che luồng; React bắt bạn viết rõ cả hai hướng nên dễ debug khi lệch.

### 3. Callback = prop hàm (thay EventEmitter)
Con không biết cha xử lý ra sao — con chỉ gọi `onAdd(1)`. Đây chính là tinh thần `EventEmitter`: contract là *tên sự kiện + payload*. Khác ở chỗ không cần class emitter, chỉ là hàm TS thuần.

```tsx
// CounterButton trong example.tsx: event prop với payload number
type CounterButtonProps = { step?: number; onAdd: (step: number) => void };

function CounterButton({ step = 1, onAdd }: CounterButtonProps) {
  // Bọc arrow để truyền payload khi click — khác onClick={onAdd(step)} gọi ngay lúc render
  return <button onClick={() => onAdd(step)}>+{step}</button>;
}
// Cha: <CounterButton step={5} onAdd={(step) => setCount((c) => c + step)} />
```

```tsx
// Switch trong example.tsx: event prop với payload boolean đảo
type SwitchProps = { isOn: boolean; onToggle: (next: boolean) => void };
function Switch({ isOn, onToggle }: SwitchProps) {
  return <button onClick={() => onToggle(!isOn)}>{isOn ? "Tắt đi" : "Bật lên"}</button>;
}
// Cha: <Switch isOn={isOn} onToggle={setIsOn} /> — setIsOn nhận boolean mới trực tiếp
```

Vì sao payload nên là dữ liệu con biết (`step`, `next`, `text mới`) mà không phải event thô (`React.MouseEvent`)? Vì cha không quan tâm click ở tọa độ nào, cha chỉ cần "cộng mấy" / "bật hay tắt" / "text mới là gì". Payload sạch giúp type đơn giản (`(step: number) => void` dễ dùng hơn `(e: MouseEvent) => void`), dễ test (gọi `onAdd(1)` trong test, không cần mock event).

### 4. Lifting state up
Khi 2 component cần cùng một dữ liệu thay đổi theo thời gian, đưa `useState` lên component cha chung nhất, rồi truyền xuống qua props + callback. State là "single source of truth" duy nhất.

```tsx
// App trong example.tsx giữ 3 state chung cho 6 con:
const [count, setCount] = useState(0); // chia sẻ cho <p>, <Badge>, 2x <CounterButton>
const [isOn, setIsOn] = useState(false); // chia sẻ cho <ToggleLabel>, <Switch>
const [name, setName] = useState("Son"); // chia sẻ cho <Greeting>, <TextInput>

// Vì sao state phải ở cha? Nếu Plus và Minus mỗi bên giữ state riêng,
// chúng không đồng bộ, không ai đọc được tổng. Đưa lên cha thì cả hai đọc chung.
```

Dấu hiệu cần lifting: hai anh em cần đọc/chỉnh cùng giá trị; hoặc cha cần đọc giá trị con đang giữ để hiển thị/validate. Đưa lên **cha chung gần nhất** (không phải lúc nào cũng root) để tránh re-render thừa cả app. Khi cây sâu 4-5 tầng mà chỉ cần truyền 1 giá trị, đừng lifting quá cao — đó là lúc dùng Context (DAY 7) hoặc store (DAY 8).

### 5. Props mặc định qua destructuring
`age = 0`, `greeting = "Xin chào"`, `step = 1`, `max = 99` — default ngay khi destructure. Không dùng `defaultProps` (đã bỏ ở function component, chỉ còn cho legacy).

```tsx
// Badge trong example.tsx: number props + default max
type BadgeProps = { count: number; max?: number };
function Badge({ count, max = 99 }: BadgeProps) {
  return <span>[Thông báo: {count > max ? `${max}+` : count}]</span>;
}
// <Badge count={count} /> -> max = 99; <Badge count={150} max={99} /> -> "99+"
```

Vì sao `?` (optional) đi kèm default? Vì `max?: number` nghĩa là cha có thể không truyền; default đảm bảo trong hàm `max` luôn là number, không cần `max!` hay check `undefined` mỗi lần dùng.

### 6. Props boolean điều khiển hành vi/giao diện
`isOn: boolean` trong `ToggleLabel` quyết định cả text lẫn class. Boolean là kiểu props đơn giản nhất nhưng dễ lạm dụng (10 cờ boolean → 2^10 trạng thái khó kiểm).

```tsx
// ToggleLabel trong example.tsx:
type ToggleLabelProps = { isOn: boolean; label?: string };
function ToggleLabel({ isOn, label = "Đèn" }: ToggleLabelProps) {
  return <p className={isOn ? "on" : "off"}>{label}: {isOn ? "BẬT" : "TẮT"}</p>;
}
```

Vì sao boolean tốt cho demo mà cần cẩn thận ở prod? Vì 2-3 cờ còn đọc được; 5+ cờ nên gộp thành union (`status: "on" | "off" | "loading"`) để loại trừ trạng thái vô lý (vừa `isLoading` vừa `isError` cùng true).

### 7. Props có thể là bất kỳ giá trị TS
String, number, boolean, object, mảng, hàm, JSX (`ReactNode`), thậm chí component khác. Không giới hạn như attribute HTML.

```tsx
// String: <Greeting name="Linh" />
// Number: <Badge count={150} max={99} />
// Boolean: <ToggleLabel isOn={isOn} />
// Function: <CounterButton onAdd={(s) => setCount((c) => c + s)} />
// JSX: <Card header={<h2>Hi</h2>}> (chi tiết DAY 5)
```

Quy tắc thực tế: props càng nguyên thủy (string/number/boolean/callback) càng tốt cho `memo` (so sánh nhanh) và test. Truyền cả object service lớn qua props làm so sánh khó, test phải mock cả object — nên truyền field cần thiết + callback.

### 8. Props là snapshot mỗi render
Mỗi render nhận một bộ props mới (bất biến). Đừng dùng props để lưu state nội bộ; muốn "phản ứng" prop đổi thì render lại với prop mới là đủ. Trường hợp đặc biệt (muốn reset state khi prop đổi ngữ nghĩa) dùng `key` (DAY 2): `<Profile key={userId} userId={userId} />` — đổi key ép unmount/mount sạch.

### Keyword chính
`props`, `destructuring`, `default value`, `lifting state up`, `callback`, `@Input` ↔ `props`, `@Output` ↔ `onXxx`. Thêm `payload`, `snapshot`, `single source of truth` khi đọc code thật.

## Luồng hoạt động (Flow)
1. `App` render lần đầu: `useState(0)` tạo `count = 0`; `useState(false)` tạo `isOn`; `useState("Son")` tạo `name`.
2. `App` trả JSX gồm `<Greeting name={name}/>`, `<Badge count={count}/>`, `<ToggleLabel isOn={isOn}/>`, `<CounterButton onAdd={...}/>`, `<Switch isOn onToggle/>`, `<TextInput value onValueChange/>`. Mỗi con nhận snapshot props của render này.
3. Props `onAdd` (arrow `(step) => setCount((c) => c + step)`) được truyền xuống `CounterButton`; con render nút `+1`/`+5`.
4. User bấm `+5` → `onClick` fire → gọi `onAdd(5)` (chính là callback cha truyền xuống với closure giữ `setCount`).
5. Callback chạy trong scope của `App`: `setCount((c) => c + 5)` với functional update → React đảm bảo `c` là giá trị mới nhất, an toàn khi bấm nhanh nhiều lần.
6. React lên lịch re-render `App` với `count` mới → `<p>Count: {count}</p>` cập nhật; `<Badge count={count}/>` nhận prop mới; `CounterButton` nhận callback **mới** (arrow tạo lại mỗi render).
7. `CounterButton` re-render (trừ khi `memo` chặn — nhưng callback mới làm memo miss; React Compiler 1.0 tự xử lý việc này nên bạn không cần `useCallback` vội).
8. Gõ vào `TextInput` → `onValueChange("Sonx")` → `setName("Sonx")` → `Greeting name={name}` và `TextInput value={name}` cùng cập nhật — hai con chia sẻ một state cha.
9. Bấm `Switch` → `onToggle(!isOn)` → `setIsOn(true)` → `ToggleLabel` và `Switch` cùng đổi — minh họa lifting cho boolean.
10. Không bao giờ con tự đổi `count`/`isOn`/`name` — con chỉ "đề nghị" qua callback; cha quyết định có đổi không (cha có thể chặn, ví dụ `max` không cho vượt).
11. Nếu cha truyền callback ổn định (Compiler/`useCallback`), con `memo` không re-render thừa. Không có Compiler mà callback inline mỗi render thì con re-render mỗi lần cha render — vẫn đúng, chỉ tốn hơn.
12. Khi state ở cha đổi nhưng con không liên quan nằm cùng subtree, React vẫn re-render con — cân nhắc tách component nhỏ/Context/store khi cây lớn.

## Ví dụ chi tiết
Code dưới đây khớp 1-1 với `example.tsx` cùng thư mục (4 loại props: string/number/boolean/event):

```tsx
// example.tsx — DAY 3: props string / number / boolean / event (callback)
// Chạy với Vite + React 19. Mỗi khối là 1 loại props, có chú thích tiếng Việt.
import { useState } from "react";

// ── 1. Props STRING: truyền chuỗi xuống con (read-only, có default) ──────────
type GreetingProps = { name: string; greeting?: string };

function Greeting({ name, greeting = "Xin chào" }: GreetingProps) {
  // greeting có default "Xin chào" khi cha không truyền (thay defaultProps đã bỏ)
  return (
    <p>
      {greeting}, {name}!
    </p>
  );
}

// ── 2. Props NUMBER: truyền số xuống con (hiển thị + tính toán) ───────────────
type BadgeProps = { count: number; max?: number };

function Badge({ count, max = 99 }: BadgeProps) {
  // max default 99: count vượt max thì hiện "99+"
  return <span>[Thông báo: {count > max ? `${max}+` : count}]</span>;
}

// ── 3. Props BOOLEAN: cờ bật/tắt hành vi hoặc giao diện con ───────────────────
type ToggleLabelProps = { isOn: boolean; label?: string };

function ToggleLabel({ isOn, label = "Đèn" }: ToggleLabelProps) {
  // boolean điều khiển nhánh render + className
  return (
    <p className={isOn ? "on" : "off"}>
      {label}: {isOn ? "BẬT" : "TẮT"}
    </p>
  );
}

// ── 4. Props EVENT (callback): con báo sự kiện lên cha qua hàm ────────────────
// Con KHÔNG biết cha xử lý ra sao — chỉ gọi đúng contract (tên + payload).
type CounterButtonProps = { step?: number; onAdd: (step: number) => void };

function CounterButton({ step = 1, onAdd }: CounterButtonProps) {
  // Bọc arrow để truyền payload khi click (khác onClick={onAdd(1)} gọi ngay lúc render)
  return <button onClick={() => onAdd(step)}>+{step}</button>;
}

type SwitchProps = { isOn: boolean; onToggle: (next: boolean) => void };

function Switch({ isOn, onToggle }: SwitchProps) {
  // Event prop boolean: con báo giá trị đảo ngược, cha quyết định đổi state
  return <button onClick={() => onToggle(!isOn)}>{isOn ? "Tắt đi" : "Bật lên"}</button>;
}

type TextInputProps = {
  value: string;
  onValueChange: (next: string) => void; // event prop string (controlled input)
};

function TextInput({ value, onValueChange }: TextInputProps) {
  // Payload là dữ liệu con biết (text mới), không phải event thô
  return <input value={value} onChange={(e) => onValueChange(e.target.value)} />;
}

// ── App: cha giữ state (lifting state up), truyền 4 loại props xuống ──────────
export default function App() {
  const [count, setCount] = useState(0); // number state, chia sẻ cho Badge + CounterButton
  const [isOn, setIsOn] = useState(false); // boolean state, chia sẻ cho ToggleLabel + Switch
  const [name, setName] = useState("Son"); // string state, chia sẻ cho Greeting + TextInput

  return (
    <>
      {/* STRING */}
      <Greeting name={name} />
      <Greeting name="Linh" greeting="Chào buổi sáng" />

      {/* NUMBER */}
      <p>Count: {count}</p>
      <Badge count={count} />
      <Badge count={150} max={99} />

      {/* BOOLEAN */}
      <ToggleLabel isOn={isOn} />

      {/* EVENT: number payload — functional update tránh stale closure */}
      <CounterButton onAdd={(step) => setCount((c) => c + step)} />
      <CounterButton step={5} onAdd={(step) => setCount((c) => c + step)} />

      {/* EVENT: boolean payload */}
      <Switch isOn={isOn} onToggle={setIsOn} />

      {/* EVENT: string payload (controlled) */}
      <TextInput value={name} onValueChange={setName} />
    </>
  );
}
```

## Giải thích từng phần
- Dòng `type GreetingProps = { name: string; greeting?: string }`: contract của `Greeting`. `name` bắt buộc (không `?`) nên TS chặn `<Greeting />` thiếu name lúc compile. `greeting?` optional vì có default. Đặt type riêng (không inline) để export/reuse trong test.
- Dòng `function Greeting({ name, greeting = "Xin chào" }: GreetingProps)`: destructuring + default. Vì sao default ở đây thay `defaultProps`? Vì `defaultProps` đã bỏ cho function component; destructuring default là chuẩn 2026, TS hiểu `greeting` luôn là string sau default.
- Dòng `<Greeting name={name} />` vs `<Greeting name="Linh" greeting="Chào buổi sáng" />`: minh họa hai cách truyền string — qua biến state (động, đổi theo input) và literal (tĩnh). Cả hai đều read-only từ góc nhìn con.
- Dòng `type BadgeProps = { count: number; max?: number }`: number props. Vì sao `max` optional? Vì 90% nơi dùng chỉ cần default 99, chỉ nơi đặc biệt truyền `max` khác.
- Dòng `{count > max ? `${max}+` : count}`: logic hiển thị "99+" gọn trong JSX. Vì sao ternary ở đây hợp lý? Vì hai nhánh đều là text ngắn, không cần tách hàm.
- Dòng `type ToggleLabelProps = { isOn: boolean; label?: string }`: boolean props. `isOn` không default vì cha luôn biết bật/tắt; `label` default "Đèn" để dùng nhanh.
- Dòng `className={isOn ? "on" : "off"}`: boolean điều khiển style. Vì sao không `class`? Vì JSX dùng DOM property name. Pattern này là nền tảng cho variant ở DAY 17.
- Dòng `type CounterButtonProps = { step?: number; onAdd: (step: number) => void }`: event contract. `onAdd` nhận `number`, trả `void` — con không quan tâm cha làm gì với số đó (cộng, trừ, log). Tên `on*` theo quy ước (giống `onClick`) để ai đọc cũng biết đây là sự kiện.
- Dòng `<button onClick={() => onAdd(step)}>`: bọc arrow để truyền payload. Vì sao không `onClick={onAdd(step)}`? Vì đó là *gọi ngay* lúc render, truyền `undefined` vào onClick. Bọc arrow tạo hàm mới, click mới gọi.
- Dòng `function Switch({ isOn, onToggle }: SwitchProps)`: event boolean. Con tính `!isOn` (giá trị đảo) rồi báo cha. Cha chỉ `setIsOn(next)` — quyết định cuối ở cha, con chỉ đề nghị.
- Dòng `<Switch isOn={isOn} onToggle={setIsOn} />`: truyền `setIsOn` trực tiếp vì chữ ký khớp (`(next: boolean) => void`). Vì sao gọn được? Vì payload con báo (`boolean`) đúng kiểu state cha cần. Không cần arrow trung gian `(v) => setIsOn(v)`.
- Dòng `type TextInputProps = { value: string; onValueChange: (next: string) => void }`: controlled contract. Tên `onValueChange` (không phải `onChange`) để phân biệt với DOM `onChange` — đây là quy ước "value + onValueChange" cho mọi controlled component tự viết (sẽ gặp lại ở Select/Form DAY 11).
- Dòng `<input value={value} onChange={(e) => onValueChange(e.target.value)} />`: con chuyển event thô (`ChangeEvent`) thành payload sạch (`string`) trước khi báo cha. Vì sao? Để cha không phải biết DOM, dễ test, type đơn giản.
- Dòng `<TextInput value={name} onValueChange={setName} />`: `setName` khớp chữ ký `(next: string) => void` nên truyền trực tiếp. Gõ phím → `setName` → `name` mới → cả `Greeting` và `TextInput` cùng cập nhật — minh họa lifting cho string.
- Dòng `const [count, setCount] = useState(0)`: state ở cha vì `Badge` (đọc) và `CounterButton` (ghi) cùng cần. Vì sao không để state trong `CounterButton`? Vì `Badge` ở nhánh khác không đọc được, và hai `CounterButton` (+1 và +5) sẽ lệch nhau.
- Dòng `onAdd={(step) => setCount((c) => c + step)}`: **functional update**. Vì sao `(c) => c + step` mà không `count + step`? Vì `count` là snapshot của render tạo callback; bấm nhanh 2 lần trước khi re-render xong thì cả hai callback cùng đọc `count` cũ → mất 1 lần cộng. Functional update nhờ React đảm bảo `c` mới nhất.
- Quy tắc callback ổn định: arrow inline mỗi render tạo hàm mới → con `memo` sẽ miss. Trước Compiler phải `useCallback`; với Compiler 1.0 React tự memo nên cứ viết inline cho dễ đọc (chi tiết DAY 10).

## Bảng so sánh Angular ↔ React
| Angular | React | Ghi chú |
|---|---|---|
| `@Input() name: string` | `function C({ name }: Props)` với `name: string` | Cả hai read-only từ góc nhìn con; React không có decorator |
| `@Input() count: number` | `{ count }: { count: number }` | Number truyền qua `{}` thay vì attribute string |
| `@Input() isOn: boolean` | `{ isOn }: { isOn: boolean }` | Boolean không cần `="true"`, truyền `{true}`/`{isOn}` |
| `@Output() add = new EventEmitter<number>()` | prop callback `onAdd: (v: number) => void` | React không cần class emitter, chỉ cần hàm |
| `(add)="fn($event)"` | `<C onAdd={(v) => fn(v)} />` | `$event` ↔ tham số arrow function |
| `@Input({ required: true })` | `name: string` (không dấu `?`) | TS bắt buộc lúc compile, không cần decorator |
| `@Input({ transform: fn })` | tính biến đổi trong render hoặc adapter trước khi truyền | Không có transform API, tự map ở cha |
| `ngOnChanges(changes)` | `useEffect(..., [prop])` hoặc `key` reset | Thường chỉ cần render lại với prop mới, không cần effect |
| Two-way `[(value)]` | `value={x} onValueChange={setX}` | Tự đặt quy ước tên; string/number/boolean đều theo mẫu này |
| `@ContentChild` đọc DOM con | props + children (DAY 5, 9) | Semantics khác: React truyền tường minh |
| `@ViewChild` gọi method con | `ref` + `useImperativeHandle` (DAY 4) | Escape hatch, dùng ít, ưu tiên callback |
| `EventEmitter` async stream | callback + (tuỳ chọn) store | Không phải RxJS stream, chỉ là gọi hàm đồng bộ |

## Lỗi thường gặp (Common pitfalls)

### 1. Gán lại props
Mô tả: `props.name = "x"` trong con — vi phạm một chiều, render sau cha ghi đè, UI nhảy.

```tsx
// ❌ SAI: sửa props trong con
function Greeting(props: { name: string }) {
  props.name = "Hacked"; // TS có thể không chặn nếu không Readonly, nhưng runtime sai
  return <p>{props.name}</p>;
}
```
```tsx
// ✅ ĐÚNG: con báo cha, cha truyền giá trị mới
function Greeting({ name }: { name: string }) {
  return <p>{name}</p>;
}
// Cha: const [name, setName] = useState("Son"); <Greeting name={name} />
// Muốn đổi: setName("Linh") ở cha (qua callback từ con nếu cần)
```

### 2. `onClick={onAdd(1)}` gọi ngay lúc render
```tsx
// ❌ SAI: alert/báo cha chạy khi mở trang, nút bấm liệt
<button onClick={onAdd(1)}>+1</button>
```
```tsx
// ✅ ĐÚNG: bọc arrow — click mới gọi với payload
<button onClick={() => onAdd(1)}>+1</button>
// Không payload: <button onClick={onAdd}> cũng đúng (truyền tham chiếu)
```

### 3. Quên functional update khi nhiều update liên tiếp
```tsx
// ❌ SAI: bấm 1 lần gọi 2 set nhưng chỉ tăng 1 (cùng đọc count cũ)
const handleDouble = () => { setCount(count + 1); setCount(count + 1); };
```
```tsx
// ✅ ĐÚNG: mỗi set đọc giá trị mới nhất
const handleDouble = () => { setCount((c) => c + 1); setCount((c) => c + 1); };
```

### 4. Lifting state sai tầng
Mô tả: để state ở con khi anh em cần chung (lệch nhau), hoặc đưa lên root quá sớm (re-render cả app khi chỉ 2 lá cần).
```tsx
// ❌ SAI: mỗi nút giữ riêng — tổng không ai biết
function Plus() { const [n, setN] = useState(0); return <button onClick={() => setN(n+1)}>{n}</button>; }
function Minus() { const [n, setN] = useState(0); return <button onClick={() => setN(n-1)}>{n}</button>; }
```
```tsx
// ✅ ĐÚNG: đưa lên cha chung gần nhất, truyền xuống cả hai
function App() {
  const [count, setCount] = useState(0);
  return (<><p>{count}</p><button onClick={() => setCount((c) => c+1)}>+1</button><button onClick={() => setCount((c) => c-1)}>-1</button></>);
}
```

### 5. Không khai type cho props
```tsx
// ❌ SAI: mất check, IDE không gợi ý, truyền sai kiểu không biết
function Badge(props: any) { return <span>{props.count}</span>; }
```
```tsx
// ✅ ĐÚNG: type rõ ràng, export để reuse
type BadgeProps = { count: number; max?: number };
function Badge({ count, max = 99 }: BadgeProps) { return <span>{count > max ? `${max}+` : count}</span>; }
```

### 6. Truyền object/array literal xuống con không `memo`
Mô tả: `style={{...}}` tạo object mới mỗi render → con re-render liên tục dù nội dung giống.
```tsx
// ❌ SAI (khi chưa có Compiler và con memo): con memo miss mỗi render
<MemoChild style={{ color: "red" }} />
```
```tsx
// ✅ ĐÚNG: với Compiler 1.0 cứ viết tự nhiên, Compiler tự memo; nếu chưa có Compiler mới cần useMemo
// Có Compiler: <MemoChild style={{ color: "red" }} /> — ổn, Compiler lo
// Chưa có: const style = useMemo(() => ({ color: "red" }), []); <MemoChild style={style} />
```

### 7. Đặt tên prop callback không nhất quán
```tsx
// ❌ SAI: lúc add, lúc onAddedChange, lúc handleAdd — khó đoán đâu là sự kiện
<CounterButton add={fn} /><Switch onSwitched={fn} />
```
```tsx
// ✅ ĐÚNG: quy ước on* cho sự kiện, value/onValueChange cho controlled
<CounterButton onAdd={fn} /><Switch isOn={isOn} onToggle={setIsOn} /><TextInput value={v} onValueChange={setV} />
```

### 8. Spread props bừa làm lộ API
```tsx
// ❌ SAI: rò rỉ mọi prop (kể cả onAdd nội bộ) xuống DOM button -> warning unknown prop
function Btn(props: any) { return <button {...props}>Hi</button>; }
```
```tsx
// ✅ ĐÚNG: destructure thứ cần, spread phần còn lại có chủ đích
function Btn({ onAdd, ...rest }: { onAdd: () => void } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button {...rest} onClick={onAdd}>Hi</button>;
}
```

## Best practices / Mẹo
- **Đặt tên props callback theo `on*`** (`onSave`, `onDelete`, `onAdd`, `onToggle`, `onValueChange`) — tương đương tên `@Output` rõ ràng. Vì sao? Để nhìn tên là biết đây là sự kiện con báo lên, không phải dữ liệu.
- **Props nên nguyên thủy càng tốt** — string/number/boolean/callback thay vì cả object. Vì sao? Để `memo` so `Object.is` nhanh, test chỉ cần truyền giá trị đơn giản.
- **Dùng `key` để reset component có state nội bộ** khi props đổi ngữ nghĩa: `<Profile key={userId} userId={userId} />`. Vì sao? Để tránh state cũ (input user trước) rò sang user mới.
- Với dữ liệu truyền sâu 3+ tầng, đừng ép props — Context (DAY 7) cho config ít đổi, store (DAY 8) cho dữ liệu hay đổi. Vì sao? Vì prop drilling 5 tầng làm mọi tầng trung gian re-render và khó refactor.
- React Compiler 1.0 memo hóa arrow trong JSX — không cần `useCallback` "để phòng". Vì sao? Vì `useCallback` sai deps còn gây stale closure, Compiler an toàn hơn.
- Đặt interface props cạnh component; nếu dùng chung nhiều nơi, export ra `types.ts`. Vì sao? Để một chỗ đổi type, mọi nơi dùng đều được check.
- Viết component theo hướng **controlled** nếu cha cần kiểm soát (`value` + `onValueChange`), **uncontrolled + defaultValue** nếu chỉ cần giá trị khởi tạo. Vì sao? Để không có hai nguồn sự thật.
- Giữ số lượng props vừa phải (<7); nhiều hơn gộp config object hoặc tách component. Vì sao? Vì component 12 props khó nhớ, dễ truyền thiếu, khó test.

## Bài tập nhỏ
1. Thêm nút "Reset" ở cha (`setCount(0)`) và nút "−1" trong component con khác nhận `onSub` — minh họa 2 con chia sẻ 1 state của cha. Vì sao state phải ở cha mà không ở mỗi con?
2. Viết `UserCard` nhận `name` bắt buộc và `age?` tùy chọn (default 0). Bọc `memo` để thấy `UserCard` không re-render khi `count` thay đổi (kiểm tra bằng `console.log`). Vì sao callback mới mỗi render làm memo miss và Compiler khắc phục thế nào?
3. Viết `Select` nhận `value` + `onChange` (controlled), và `options: {label,value}[]` — con báo cha qua `onChange` khi chọn. So sánh với `TextInput` trong bài: khác gì ngoài element?
4. Lifting state: tách `Counter` thành `Display` (đọc `count`) + `Controls` (báo `onChange`) và giữ state chung ở cha. Vì sao `Display` và `Controls` không được giữ state riêng?
5. Thêm prop `max?: number` cho `Counter` và chặn không cho vượt — minh họa props điều khiển hành vi con. Cha chặn bằng cách nào (không cho set hay cho set rồi clamp)?

## Reference
- https://react.dev/learn/passing-props-to-a-component
- https://react.dev/learn/sharing-state-between-components
- https://react.dev/learn/thinking-in-react
- https://react.dev/reference/react/memo
