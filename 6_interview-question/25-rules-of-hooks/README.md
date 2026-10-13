# Q25: Sao `useState` không được gọi trong `if` hay vòng `for`?

## Câu hỏi

> Tại sao `useState` không được đặt trong `if` hay vòng lặp?
> Nếu bạn viết `if (user) { useState(...) }` thì React báo lỗi gì,
> và lỗi đó đến từ cơ chế nào bên trong — chứ không phải chỉ là convention?

## Trả lời ngắn (elevator pitch, 30 giây)
- React nhớ state **theo thứ tự gọi hook**, không theo tên. Mỗi component có một hàng ô nhớ, hook gọi thứ mấy thì vào ô thứ mấy.
- Gọi hook trong `if`/vòng lặp thì số hook đổi giữa các lần vẽ → ô nhớ lệch nhau → state con này chạy sang con kia, crash hoặc sai âm thầm. React báo "Rendered more/fewer hooks than expected".
- Luật: hook chỉ gọi ở đầu component/hook khác. Muốn điều kiện thì đưa vào **bên trong** logic hook (deps), đừng bọc hook bằng `if`.

## Trả lời chi tiết

### 1. Cơ chế gốc: "state theo thứ tự" (nói được = ăn điểm tối đa)

Mỗi lần render, React chạy component từ trên xuống, gặp hook nào là **đăng ký theo thứ tự** vào danh sách state riêng của component đó. Danh sách này **không gắn nhãn** (`useState` thứ 2 không biết mình là "email") — chỉ là **ô 2**.

```tsx
// Render 1 (user = true):
if (user) {
  const [a, setA] = useState(0);   // ô 1
  const [b, setB] = useState(0);   // ô 2
}
// → list: [a, b]

// Render 2 (user = false) — if bỏ qua 2 hook:
// → list: [] (đỗng)

// Render 3 (user = true lại):
// React thấy list render 2 có 0 ô, render 3 đòi 2 ô → LỆCH → "Rendered more hooks"
```

Chính vì **ô số 2 không có "tên"** mà chỉ có **vị trí**, nên vị trí phải **cố định mọi render**. `if` phá vị trí → sai ngay.

### 2. Cách đúng: điều kiện VÀO TRONG hook, không bao hook

```tsx
// ❌ SAI: hook trong điều kiện — số hook đổi giữa render
if (user) {
  const [x, setX] = useState(0);
}

// ✅ ĐÚNG (giao diện): hook top-level, điều kiện là RETURN
const [x, setX] = useState(0);
if (!user) return null;
return <button onClick={() => setX(x + 1)}>{x}</button>;

// ✅ ĐÚNG (logic): điều kiện nằm TRONG deps của effect
useEffect(() => {
  if (!user) return;                 // early-return, hook vẫn top-level
  fetchUser(user.id);
}, [user]);
```

> **Nguyên tắc 2 câu**: (1) hook **cố định top-level**; (2) muốn "điều kiện hóa hành vi" thì **điều kiện nằm TRONG body hook** (deps), **không phải BÊN NGOÀI** (bao hook).

### 3. Loop thì sao? (bẫy thường gặp nhất)

`for (let i = 0; i < n; i++) useState(...)` → **số hook = n** → n đổi (list từ 3 item thành 5) → **dở ngay**. Không có cách "hook trong loop an toàn" — muốn state cho N phần tử, dùng **1 state mảng** (`useState(items.map(...))`), không phải N hook.

```tsx
// ❌ SAI
items.forEach((it, i) => { const [v, setV] = useState(it); }); // 1 hook × n

// ✅ ĐÚNG: 1 state duy nhất giữ mảng
const [vals, setVals] = useState(items.map((i) => i));
```

### 4. Vì sao hook KHÔNG trong hàm con/callback (quy tắc 3)

`onClick(() => { setCount(c => c + 1); })` — `setCount` **gọi ở top-level rồi truyền xuống**, chứ **không phải gọi hook mới trong callback**. Nếu bạn viết `function save() { const [x] = useState(0); }` (gọi hook trong hàm thường) → **vi phạm**: hook phải chạy trong **lần render component** (có "phiên render" để gắn state). Callback chỉ chạy **sau render** (event) — không có phiên render đó.

### 5. Angular so sánh (điểm ăn điểm cho người từ Angular)

| Angular | React | Ghi chú |
|---|---|---|
| `ngOnInit/ngOnChanges/ngOnDestroy` (lifecycle class) | **hook + effect** (function) | Angular lifecycle = **class, cố định theo cấu trúc class**; React = **thứ tự gọi** (không "khóa") |
| Component class 1 instance (state ẩn trong class) | hook list (state theo thứ tự, không "key") | Angular không có "dở hook" (class có field cố định); React **cần quy tắc** vì state **không gắn tên** |
| Không cần quy tắc "hook top-level" | **Bắt buộc** (rules of hooks) | React "mua" linh hoạt (function, không class) bằng **đổi quy tắc thứ tự** |

> **Nói đúng câu chốt**: "Angular 'khóa' state vào field class (mỗi field 1 tên, an toàn). React 'gò' state vào **danh sách theo thứ tự gọi** (để function hóa hook + composition) — đổi lại **bắt phải giữ thứ tự cố định mọi render** (top-level, không điều kiện/loop). Lỗi 'Rendered more hooks' chính là **danh sách hook không khớp**."

## Bẫy khi phỏng vấn

1. **Nói "React cấm vì convention/best practice"** → **sai** (không phải "không nên", là **không thể** — state theo thứ tự, `if` lệch ô). Trả lời "có lý do kỹ thuật (thứ tự gọi)".
2. **"Tôi đặt hook trong `if` nhưng chỉ khi user không đổi (stable) thì an toàn?"** → **sai**: dù "stable" hôm nay, **bất kỳ lần nào user đổi giữa render** là dở. React không "biết bạn promise" — nó chỉ đếm **số ô hiện tại vs trước**.
3. **"Loop `useState` cho N phần tử — mỗi phần tử 1 hook"** → **dở** (số hook = N, N đổi là lệch). Đúng: **1 state mảng**.
4. **Nói "hook trong hàm con (callback) thì được vì vẫn chạy trong component"** → **sai**: callback chạy **sau render** (event), không phải trong "phiên render" → không có state list để gắn. Chỉ hook **top-level + trong body effect/callback hợp lệ** (gọi **setter**, không gọi **hook**).
5. **"Tôi `eslint-disable` rule của hook để bỏ qua"** → giấu bug (dở hook = state lệch = crash vận hành). Rule này **không được disable** (khác `exhaustive-deps` — cái đó có `useEffectEvent` thay thế, Q27).

## Gợi ý câu chốt

> "React nhớ state **theo thứ tự gọi hook**, không theo 'tên' (mỗi component 1 list state, hook lần 1/2/3 gán ô 1/2/3). Gọi hook trong `if`/loop → **số hook đổi giữa render** → list lệch → 'Rendered more hooks'. Quy tắc: **hook top-level, không điều kiện/loop/callback, chỉ trong component/hook**. Muốn điều kiện hóa **hành vi** → **điều kiện VÀO deps**, không **bao hook**. Khác Angular: Angular 'khóa' state vào field class (an toàn); React 'gò' state vào **thứ tự gọi** (linh hoạt hơn, đổi bằng quy tắc top-level)."

## Reference

- [`3_react-tutorial/16-custom-hooks`](../../3_react-tutorial/16-custom-hooks) — "Ba quy tắc hooks (bắt buộc)" + "state theo thứ tự gọi" + "vì sao tiền tố use" (lần gọi 1, 2, 3)
- [`3_react-tutorial/2-conditional-list-rendering`](../../3_react-tutorial/2-conditional-list-rendering) — điều kiện render (early return) đúng cách (không "if hook")
- [`3_react-tutorial/0-react-explore`](../../3_react-tutorial/0-react-explore) — hook là **function, composition** (không class)
- Q1 (library vs framework) — React không class/DI (hook = function), vì sao "quy tắc top-level" cần
- Q27 (effect nào dùng khi nào) — `useEffectEvent` (thay `eslint-disable` cho deps), cùng họ rules of hooks

## Câu hỏi liên quan

- **Hỏi tiếp (liên tục)**: [Q26 — setState 2 lần, render mấy lần (cùng họ hook cơ chế)?](../26-batching-stale-closure/README.md) · [Q27 — effect dùng cho gì?](../27-which-effect-when/README.md)
- **Đào sâu (xuyên nhóm)**: [Q30 — vì sao "state theo thứ tự" (pipeline render)?](../30-rerender-pipeline/README.md) · [Q10 — useRef (giữ giá trị, không phải hook state)?](../10-useref-vs-usestate/README.md) · [Q11 — cha gọi hành vi con (dùng hook trong con)?](../11-parent-calls-child-method/README.md)
