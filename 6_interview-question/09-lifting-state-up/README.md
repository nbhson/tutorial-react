# Q9: Hai component con cùng cần một state thì đặt state ở đâu?

## Câu hỏi

> Trong app, hai component anh em cùng cần đọc/đổi một dữ liệu (vd Plus/Minus cùng một count) thì mình đặt state ở đâu?
> Vì sao đưa lên cha chung gần nhất mà không phải cứ lên root?
> Nếu cần chia sẻ qua nhiều tầng (5-10 tầng), lifting state còn đủ không, nên chuyển sang gì?
> So với Angular thì xử lý kiểu gì?

## Trả lời ngắn (elevator pitch, 30 giây)

- **Lifting state up** = **đưa `useState` lên component cha chung gần nhất** khi **nhiều component cần đọc/đổi cùng một dữ liệu**. Con nhận giá trị qua **props** (một chiều xuống), báo thay đổi qua **callback** (một chiều lên). State lúc đó là **single source of truth (nguồn sự thật duy nhất)**.
- **Khi nào phải đưa lên cha**: (1) **hai component "anh em"** (không là cha–con của nhau) cần cùng một dữ liệu; (2) **cha cần đọc giá trị con đang giữ** (hiển thị, validate, quyết định); (3) **một sự kiện ở con A phải ảnh hưởng giao diện của con B**.
- **Đưa lên "cha chung gần nhất"**, không phải root: đặt cao quá → **cả app re-render** mỗi khi state đổi; đặt thấp quá → "hai anh em" không ai đọc được. Cần **chia sẻ sâu/rộng** → chuyển sang **Context** (DAY 7) hoặc **store** (Zustand/Redux — DAY 8), không "lifting vô hạn".

## Trả lời chi tiết

### 1. Vấn đề "hai con, mỗi đứa một state riêng"

```tsx
// ❌ SAI — Plus và Minus mỗi bên giữ state riêng: không ai đọc được tổng
function Plus() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(count + 1)}>+1</button>;
}
function Minus() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(count - 1)}>-1</button>;
}
// App: <Plus /> <Minus /> → Plus và Minus "không biết nhau", count lệch nhau
```

Hai state **riêng rẽ** = **hai nguồn sự thật** → bug "state không đồng bộ" (Plus "cộng" nhưng Minus "không giảm" cùng count). Cách sửa: **đưa state lên App (cha chung)**, con nhận giá trị + callback.

### 2. Pattern chuẩn (lifting)

```tsx
// ✅ App (cha) là single source of truth: Plus/Minus/Greeting/TextInput
// tất cả "đọc chung" một state, không ai "giữ riêng".
import { useState } from "react";

function App() {
  const [count, setCount] = useState(0);        // number state
  const [isOn, setIsOn] = useState(false);       // boolean state
  const [name, setName] = useState("Son");        // string state (controlled input)

  return (
    <>
      <Badge count={count} />                    // đọc
      <CounterButton onAdd={(step) => setCount((c) => c + step)} /> // "đề nghị"
      <Switch isOn={isOn} onToggle={() => setIsOn((v) => !v)} />
      <TextInput value={name} onValueChange={setName} />
    </>
  );
}
```

Cơ chế (một chiều xuống + một chiều lên):

```
Dữ liệu:      state (cha)  ──props──▶  con (chỉ đọc, không đổi)
Sự kiện:      con ──callback──▶  cha (cha "quyết định" đổi state)
```

- **Con không biết cha xử lý ra sao** — con chỉ gọi đúng contract (tên + payload). Ví dụ `onAdd(5)`: con "đề nghị" cộng 5, **cha** có thể cộng, log, chặn (nếu vượt `max`...). **Quyết định cuối luôn ở cha** — con không "ép" cha.
- **Payload nên là "dữ liệu con biết"** (số, text, cờ) mà không phải event thô (`React.MouseEvent`) — type đơn giản, dễ test (gọi `onAdd(5)` trực tiếp, không cần mock DOM).

### 3. "Dấu hiệu" (heuristic) — khi nào "phải" lifting

Trả lời câu "Khi nào phải đưa state lên cha?" với **3 dấu hiệu**:

| Dấu hiệu | Ví dụ | Không lifting → hậu quả |
|---|---|---|
| **Hai "anh em" cần cùng dữ liệu** | `<Plus/>` + `<Minus/>` cùng count; `<Filter/>` + `<List/>` cùng `query` | state "lệch" (2 nguồn sự thật) |
| **Cha cần đọc giá trị con đang giữ** | Form: `<TextInput value={name}/>` mà `name` ở App (cha validate/hiển thị tên) | Con "giữ" → cha không thấy (prop không "đổi ngược") |
| **Sự kiện con A phải đổi giao diện con B** | `<TextInput/>` gõ → `<Preview/>` (anh em) cập nhật | Hai con "không nói chuyện được" nếu không chung cha |

> **Quy tắc thực chiến**: nếu hai component **không là cha–con của nhau** và **cùng cần một dữ liệu** → **state phải ở "cha chung gần nhất"**.

### 4. "Đưa lên cao nhất (root) luôn" — KHÔNG (đây là "bẫy")

- **Đặt cao quá** (root) khi chỉ cần "hai anh em trong một section":
  - **Re-render lan rộng**: mỗi lần state đổi, **cả app** re-render (mặc định React không "chặn" con re-render khi props đổi — xem [`10-memo-format`](../../3_react-tutorial/10-memo-format)).
  - **Không "nói rõ" intent**: state ở root nhưng chỉ dùng trong 1 section → code "đẩy" dữ liệu không cần thiết lên cao (vi phạm "đặt cao nhất *cần*").
- **Quy tắc đúng**: **cha chung *gần nhất*** (closest common ancestor). Ví dụ: 2 anh em trong `<CartSection/>` → state ở `CartSection`, không phải App.
- **Nâng cấp khi "quá cao" không đủ**: khi cần **chia sẻ sâu/rộng** (5–10+ tầng, hoặc nhiều cây con không là "anh em") → **Context** (DAY 7) hoặc **store** (Zustand/Redux — DAY 8). Context/store **không thay thế** "single source of truth", mà **mở rộng** phạm vi "nơi state được chia sẻ" mà không "prop-drilling".

### 5. Đối chiếu Angular (điểm "ăn điểm")

| React | Angular (cùng vấn đề) |
|---|---|
| Lifting state up (cha giữ state, con nhận **props**) | **State ở component "cha"**, con nhận `@Input()`; con "báo" qua `@Output()`/`EventEmitter` (one-way binding xuống + sự kiện lên) |
| "Hai anh em cần cùng dữ liệu" → đưa lên "cha chung gần nhất" | Angular "cùng vấn đề" (hai component `@Input` "lệch" nếu không có "service" hoặc "cha" giữ state) |
| Context (DAY 7) / Store (DAY 8) khi "nhiều tầng" | **`@Injectable` service** (chia sẻ một instance) hoặc **Ngrx/Zustand** (khi tree sâu) |

> Điểm khác **cơ bản**: Angular có **DI container** (service "một instance" tự nhiên) — React **không có DI** (chỉ Context/store "tự viết" chia sẻ) — vì React là **library**, không phải framework full (xem [`01-library-vs-framework`](../01-library-vs-framework/README.md)).

## Bẫy khi phỏng vấn

1. **"State 'luôn' ở component con (gần nơi 'dùng')"** (nói suông) → **sai**: đúng "khi chỉ con cần". Nhưng **hai anh em** hoặc **cha cần đọc** → **bắt buộc** lifting (xem "dấu hiệu" ở §3).
2. **"Đưa lên root 'cho chắc'"** → **sai** (re-render lan, không "nói rõ" intent). Quy tắc "đặt cao nhất *cần*", không phải "cao nhất *có thể*".
3. **Con "tự đổi" state cha truyền vào (gán `props.value = ...`)** → **sai** (props là **read-only** — mỗi render cha tạo object props mới, gán con "chỉ sửa" snapshot cục bộ, render sau "nhảy về"). Fix: **báo cha qua callback**, cha đổi state, props mới "chảy xuống".
4. **Nhầm "lifting" với "prop-drilling sâu"** → lifting là "đưa lên cha *chung gần nhất*", không phải "đưa lên root". Nếu "đi qua" 4–5 tầng mà chỉ "một giá trị" → **chuyển sang Context/store**, không "kéo" state quá cao.
5. **Truyền "event thô" (MouseEvent) làm payload** → con "nên" truyền **dữ liệu** (số, text, cờ), không phải event (type đơn giản, dễ test).

## Gợi ý câu chốt

> "Lifting state up là 'đưa `useState` lên cha chung gần nhất' khi nhiều component cần đọc/đổi cùng một dữ liệu — con nhận **props** (một chiều xuống), báo **callback** (một chiều lên), state là **single source of truth**. Dấu hiệu phải lifting: hai 'anh em' cần cùng dữ liệu, cha cần đọc giá trị con đang giữ, hoặc sự kiện con A phải đổi giao diện con B. **Không** đưa lên root 'cho chắc' — chỉ 'cha chung *gần nhất*'. Khi tree sâu/rộng (5+ tầng, nhiều cây con không là 'anh em') → chuyển sang **Context** (DAY 7) hoặc **store** (DAY 8), không 'kéo state lên root' vô hạn."

## Reference

- [`3_react-tutorial/3-props-interaction`](../../3_react-tutorial/3-props-interaction) — "Lifting state up" (mục 4), callback event, payload
- [`3_react-tutorial/7-context-basic`](../../3_react-tutorial/7-context-basic) — Context khi "nhiều tầng"
- [`3_react-tutorial/8-external-store`](../../3_react-tutorial/8-external-store) — Store (Zustand/Redux) khi "rộng"
- Q1 (Library vs Framework) — vì sao React "không có DI" (Angular có, React không)
- [`10-memo-format`](../../3_react-tutorial/10-memo-format) — re-render khi props đổi (vì sao "đặt cao quá" = "re-render lan")

## Câu hỏi liên quan

- **Hỏi tiếp (liên tục)**: [Q13 — prop drilling quá sâu thì chuyển Context khi nào?](../13-context-vs-props/README.md) · [Q28 — state nhiều chỗ phụ thuộc nhau, chuyển useReducer?](../28-usereducer-vs-usestate/README.md)
- **Đào sâu (xuyên nhóm)**: [Q15 — state chung nhiều feature (Redux/Zustand)?](../15-external-stores/README.md) · [Q36 — khi nào thì context/store không đủ, cần kiến trúc layer?](../36-architecture-code-org/README.md)
