# DAY 3: PROPS & TƯƠNG TÁC COMPONENT

## Mục tiêu bài học
- Nắm `props` là kênh dữ liệu một chiều cha → con, read-only (tương đương `@Input`), và callback qua props cho con → cha (tương đương `@Output` + `EventEmitter`).
- Thành thạo pattern **lifting state up**: đưa state lên cha chung khi nhiều component cần chia sẻ dữ liệu.
- TypeScript type cho props chính là "API contract" — viết tốt để IDE gợi ý và bắt lỗi sớm.

## Khái niệm cốt lõi (Core)
- **Props là argument của function component.** Component nhận props qua destructuring `({ name, age }: Props)`. Vì là function argument nên **read-only** theo nguyên tắc — không được gán `props.name = ...`.
- **Unidirectional data flow:** dữ liệu chảy xuống qua props, sự kiện chảy lên qua callback. Không có `[()]` banana-in-a-box; hai chiều được mô hình hóa thành "cha cho giá trị + con báo sự kiện".
- **Callback = prop hàm.** Con không biết cha xử lý ra sao — con chỉ gọi `onAdd(1)`. Đây chính là tinh thần `EventEmitter`: contract là *tên sự kiện + payload*.
- **Lifting state up:** khi 2 component cần cùng một dữ liệu thay đổi theo thời gian, đưa `useState` lên component cha chung nhất, rồi truyền xuống qua props + callback. State là "single source of truth" duy nhất.
- **Props mặc định** dùng destructuring default value (`age = 0`), không dùng `defaultProps` (đã bị loại bỏ ở function component).
- **`children` là một props đặc biệt** (DAY 5); còn lại props là gì do bạn định nghĩa.
- **Props có thể là bất kỳ giá trị TS:** string, number, boolean, object, mảng, hàm, JSX (ReactNode), thậm chí component khác.
- **Không có "constructor" hay DI cho props:** bạn truyền tường minh; muốn dữ liệu toàn cục thay vì truyền tay → Context (DAY 7).
- **Props là snapshot mỗi render:** mỗi render nhận một bộ props mới (bất biến), không dùng để lưu state.
- **Keyword chính:** `props`, `destructuring`, `default value`, `lifting state up`, `callback`, `@Input` ↔ `props`, `@Output` ↔ `onXxx`.

## Luồng hoạt động (Flow)
1. `App` render: `useState(0)` tạo `count`, lần đầu = 0.
2. `App` trả JSX gồm `<p>Count: {count}</p>` và `<CounterButton onAdd={(step) => setCount((c) => c + step)} />`.
3. Props `onAdd` (một arrow function) được truyền xuống `CounterButton`; component con render nút `+1`.
4. User bấm `+1` → `onClick` fire → gọi `onAdd(1)` (chính là callback cha truyền xuống).
5. Callback chạy trong scope của `App`: `setCount((c) => c + 1)` với functional update → React biết state `count` đổi.
6. React lên lịch re-render `App`.
7. `App` re-render với `count` mới → `<p>Count: {count}</p>` cập nhật; `CounterButton` nhận callback **mới**.
8. `CounterButton` re-render (trừ khi `memo` chặn — callback mới làm memo miss; React Compiler 1.0 xử lý việc này).
9. Nếu state ở con và cần chia sẻ với anh em: phải lifting state lên cha, rồi truyền `count` + `onAdd` xuống cả hai.
10. Không bao giờ con tự đổi `count` — con chỉ "đề nghị" qua callback; cha quyết định.
11. Nếu cha truyền callback tạo bằng `useCallback`/Compiler, tham chiếu ổn định → con `memo` không re-render thừa.
12. Khi state ở cha đổi nhưng con không liên quan nằm trong cùng subtree, React vẫn re-render con — cân nhắc tách component/Context.
13. Toàn bộ vòng lặp "props xuống — callback lên" khép kín: không có nguồn sự thật thứ hai.

## Ví dụ chi tiết
```tsx
// example.tsx — DAY 3: props + child-to-parent callback
import { useState } from "react";

// Component con: nhận callback qua props, KHÔNG biết cha xử lý thế nào
function CounterButton({ onAdd }: { onAdd: (step: number) => void }) {
  return <button onClick={() => onAdd(1)}>+1</button>; // gọi callback khi click
}

export default function App() {
  // State nằm ở cha — "single source of truth"
  const [count, setCount] = useState(0);
  return (
    <>
      <p>Count: {count}</p>
      {/* Truyền callback xuống con; functional update tránh stale closure */}
      <CounterButton onAdd={(step) => setCount((c) => c + step)} />
    </>
  );
}
```

Ví dụ đầy đủ hơn với props typed + default + 2 con chia sẻ state:

```tsx
type UserCardProps = { name: string; age?: number };

export function UserCard({ name, age = 0 }: UserCardProps) {
  return <p>{name} — {age} tuổi</p>; // age mặc định 0 nếu cha không truyền
}

// 2 con cùng "điều khiển" 1 state ở cha
function Plus({ onStep }: { onStep: (n: number) => void }) {
  return <button onClick={() => onStep(1)}>+1</button>;
}
function Minus({ onStep }: { onStep: (n: number) => void }) {
  return <button onClick={() => onStep(-1)}>-1</button>;
}
```

## Giải thích từng phần
- `function CounterButton({ onAdd }: { onAdd: (step: number) => void })`: destructuring props + inline type. Contract: con gọi với `number`, không cần kết quả trả về.
- `<button onClick={() => onAdd(1)}>+1</button>`: con bọc gọn; khác `@Output` cần `EventEmitter` + `emit()`, ở đây chỉ là gọi hàm TS thuần.
- `const [count, setCount] = useState(0)`: state ở cha. Vì trong ví dụ thật, component khác (anh em) cũng cần đọc `count`.
- `setCount((c) => c + step)`: **functional update** — React đảm bảo `c` là giá trị mới nhất, an toàn khi có nhiều update liên tiếp.
- `age = 0`: default value qua destructuring — không cần `defaultProps` (đã bị bỏ ở function component).
- `UserCardProps` đặt tên rõ ràng: type riêng giúp export/import, tái dùng trong test.
- `onStep: (n) => void`: một callback dùng chung cho cả tăng và giảm — payload quyết định hành vi; giảm số prop.
- **Vì sao state phải ở cha?** Nếu `Plus` và `Minus` mỗi bên giữ state riêng, chúng không đồng bộ và không ai đọc được tổng.
- **Props không tự đổi:** muốn con "phản ứng" prop đổi, dùng effect (DAY 15) hoặc reset bằng `key` (DAY 2); thường chỉ cần render lại với prop mới.
- **Callback ổn định:** trước Compiler, callback tạo inline mỗi render làm `memo` con miss; Compiler 1.0 memo tự động.
- **Payload của callback nên là dữ liệu con biết**, không phải sự kiện thô — `onAdd(1)` rõ hơn `onAdd(event)`.
- **Type của callback quyết định ergonomics:** `(step: number) => void` dễ dùng hơn `(e: React.MouseEvent) => void`.
- **Props không nên vừa là dữ liệu vừa là state:** nếu một prop cần đổi cục bộ, cân nhắc dùng state nội bộ hoặc controlled pattern.
- **Component "thuần" theo props:** cùng props → cùng output, dễ test (DAY 21) và dễ Compiler memo.
- **Read-only like Angular `@Input`:** muốn mutate, phát tín hiệu lên; tránh "hai nguồn sự thật".

## Bảng so sánh Angular ↔ React
| Angular | React | Ghi chú |
|---|---|---|
| `@Input() name` | `function C({ name }: Props)` | Cả hai đều read-only từ góc nhìn con |
| `@Output() add = new EventEmitter()` | prop callback `onAdd: (v: number) => void` | React không cần class emitter |
| `(add)="fn($event)"` | `<C onAdd={(v) => fn(v)} />` | `$event` ↔ tham số arrow function |
| `@Input() set x(v)` (setter) | derived value tính trong render / `useMemo` | Không có setter magic |
| `@Input({ required: true })` | `name: string` (không dấu `?`) | TS bắt buộc lúc compile |
| `@Input({ transform })` | tính biến đổi trong render hoặc adapter | Không có transform API |
| `ngOnChanges(changes)` | `useEffect(..., [prop])` hoặc `key` reset | Thường không cần |
| Two-way `[(value)]` | `value={x} onValueChange={setX}` | Tự đặt quy ước tên |
| `@ContentChild` đọc DOM con | props + children (DAY 5, 9) | Semantics khác |
| `@ViewChild` gọi method con | `ref` + `useImperativeHandle` (DAY 4) | Escape hatch, dùng ít |
| `EventEmitter` async stream | callback + (tuỳ chọn) store | Không phải RxJS stream |

## Lỗi thường gặp (Common pitfalls)
- **Gán lại props** (`props.name = "x"`) → vi phạm một chiều, hành vi khó lường. → Fix: cha đổi state và truyền giá trị mới.
- **`onClick={() => onAdd(1)}` thành `onClick={onAdd(1)}`** → gọi ngay lúc render. → Fix: bọc arrow khi cần tham số.
- **Quên functional update khi nhiều update liên tiếp** → `setCount(count + 1)` hai lần chỉ tăng 1. → Fix: `setCount((c) => c + 1)`.
- **Lifting state quá sớm / quá muộn** → re-render thừa hoặc anh em không chia sẻ được. → Fix: đưa lên **cha chung gần nhất**; đo lại khi cây lớn.
- **Không khai type cho props** → mất TS check, IDE không gợi ý. → Fix: luôn khai `type Props`.
- **Truyền object/array literal xuống component không `memo`** → con re-render liên tục. → Fix: Compiler 1.0 tự xử lý; nếu không có Compiler mới cần `useMemo`.
- **Truyền cả object service lớn qua props** → khó so sánh, khó test. → Fix: truyền nguyên thủy/callback.
- **Đặt tên prop callback không nhất quán** (`add` và `onAddedChange` trộn) → khó đoán. → Fix: quy ước `on*` cho handler, `xxxChange` cho giá trị.
- **Nhầm `children` là prop bình thường có thể bỏ qua** → không tùy biến được. → Fix: nhận `children` rõ ràng (DAY 5).
- **Spread props bừa (`{...props}`) làm lộ prop không mong muốn** → rò rỉ API. → Fix: destructure prop cần rồi spread phần còn lại có chủ đích.
- **Truyền `style` inline object sai tên** (`background-color`) → React bỏ qua. → Fix: camelCase `backgroundColor`.

## Best practices / Mẹo
- **Đặt tên props callback theo quy ước `on*`** (`onSave`, `onDelete`) — tương đương tên `@Output` rõ ràng.
- **Props nên "nguyên thủy" càng tốt** — truyền string/number/callback thay vì cả object; giúp `memo` so sánh đơn giản.
- **Dùng `key` để reset component có state nội bộ** khi props đổi ngữ nghĩa: `<Profile key={userId} userId={userId} />`.
- Với dữ liệu truyền sâu, đừng ép props — Context (DAY 7) cho config toàn cục, store (DAY 8) cho dữ liệu hay đổi.
- React Compiler 1.0 memo hóa arrow function trong JSX — không cần `useCallback` "để phòng".
- Đặt interface props cạnh component; nếu props dùng chung nhiều nơi, export type ra file `types.ts`.
- Dùng `Readonly<Props>` nếu muốn TS cảnh báo mutate props (tuỳ chỉnh).
- Viết component theo hướng **controlled** nếu cha cần kiểm soát, **uncontrolled + defaultValue** nếu chỉ cần giá trị khởi tạo.
- Giữ số lượng props vừa phải (khoảng <7); nhiều hơn cân nhắc gộp config object hoặc tách component.
- Đặt `displayName` cho component bọc `memo` để DevTools hiển thị tên đẹp.

## Bài tập nhỏ
1. Thêm nút "Reset" ở cha (`setCount(0)`) và nút "−1" trong component con khác nhận `onSub` — minh họa 2 con chia sẻ 1 state của cha.
2. Viết `UserCard` nhận `name` bắt buộc và `age?` tùy chọn (default 0). Bọc `memo` để thấy `UserCard` không re-render khi `count` thay đổi (kiểm tra bằng `console.log`).
3. Viết `Select` nhận `value` + `onChange` (controlled), và `options: {label,value}[]` — con báo cha qua `onChange` khi chọn.
4. Lifting state: tách `Counter` thành `Display` (đọc `count`) + `Controls` (báo `onChange`) và giữ state chung ở cha.
5. Thêm prop `max?: number` cho `Counter` và chặn không cho vượt — minh họa props điều khiển hành vi con.

## Reference
- https://react.dev/learn/passing-props-to-a-component
- https://react.dev/learn/sharing-state-between-components
- https://react.dev/learn/thinking-in-react
- https://react.dev/reference/react/memo