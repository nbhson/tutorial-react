# Q28: Khi nào em bỏ nhiều `useState` lẻ để gom về `useReducer`?

## Câu hỏi

> Form 10 field thì viết 10 `useState` hay dùng `useReducer`?
> Reducer thực sự giải quyết được gì mà `useState` không tốt?
> State machine ở đây nghĩa là gì — chỉ dùng cho login → pending → success → error, hay rộng hơn?

## Trả lời ngắn (elevator pitch, 30 giây)
- `useState` hợp cho giá trị **độc lập, thay bằng** giá trị mới (email, bật/tắt). Mỗi ô một state, đọc đâu thấy đó.
- `useReducer` hợp khi nhiều mảnh state **dính nhau**: validate chéo, gộp n `setState` trong một cú click thành một action, hoặc máy trạng thái (idle → loading → success/error) mà luật chuyển chỉ nằm một chỗ trong reducer.
- 10 ô độc lập không check chéo thì 10 `useState` đơn giản hơn. Reducer là hàm thuần (state cũ + action → state mới) nên test dễ.

## Trả lời chi tiết

### 1. Khi nào `useState` đủ, khi nào bắt đầu cân nhắc `useReducer`

| Dấu hiệu | Dùng |
|---|---|
| 1–3 field **độc lập**, thay bằng (login: email, pass) | `useState` (Q17) |
| Nhiều field **liên quan** (confirm = pass, derive "full name" từ first+last), N `setState` **trong 1 handler** (submit: setErr + setSubmitting + setX... đồng thời) | Cân nhắc `useReducer` (gộp 1 action = 1 lần suy state mới) |
| **Rule chuyển trạng thái có điều kiện** (login: chỉ từ `error` mới `retry`; cart: chỉ `add` nếu chưa có item) | `useReducer` — rule nằm **1 chỗ** (reducer), không rải N event handler |
| State machine **nhiều state + transition** (chat: `idle → connecting → open → closed`) | `useReducer` (explicit, test được từng transition) |
| Form nhiều field (≥5) + validate chéo + async (Q19) | **RHF + Zod** (Q18/Q19) — reducer không thay thế form engine; chỉ dùng reducer khi **không dùng RHF** (mô hình MVVM thuần, không lib) |

> **Nguyên tắc quyết định**: (1) **số update liên quan** (không phải số field), (2) **rule transition** (có điều kiện không), (3) **cần test logic riêng** (giữ logic tách khỏi UI). Không đủ 1 trong 3 → `useState` đơn giản hơn.

### 2. `useReducer` hoạt động ra sao (code + giải thích "ăn điểm" nào)

```tsx
import { useReducer } from "react";

// (1) STATE: 1 object (không N state rời)
type State = { status: "idle" | "loading" | "success" | "error"; data: User[] | null; err: string };

// (2) ACTIONS (mô tả "điều xảy ra", không phải "giá trị mới"):
type Action =
  | { type: "FETCH_START" }
  | { type: "FETCH_SUCCESS"; data: User[] }
  | { type: "FETCH_ERROR"; err: string }
  | { type: "RETRY" };

// (3) REDUCER: PURE (state + action → state mới) — không side effect, test được
function reducer(state: State, action: Action): State {
  switch (action.type) {
    // (4) STATE MACHINE: rule transition nằm TẠI ĐÂY (không rải trong onClick/onSubmit)
    case "FETCH_START":
      if (state.status === "loading") return state;      // ← guard: đang loading không fetch lại
      return { ...state, status: "loading", err: "" };
    case "FETCH_SUCCESS":
      return { ...state, status: "success", data: action.data };
    case "FETCH_ERROR":
      return { ...state, status: "error", err: action.err };
    case "RETRY":
      return state.status === "error" ? { ...state, status: "idle" } : state; // ← rule "chỉ từ error mới retry"
    default:
      return state;
  }
}

function UserList() {
  const [state, dispatch] = useReducer(reducer, { status: "idle", data: null, err: "" });

  const load = () => {
    dispatch({ type: "FETCH_START" });           // UI không "biết" fetch — chỉ "đăng ký hành động"
    fetchUsers()
      .then((data) => dispatch({ type: "FETCH_SUCCESS", data }))
      .catch((e) => dispatch({ type: "FETCH_ERROR", err: String(e) }));
  };

  return (
    <div>
      {state.status === "success" && state.data.map((u) => <div key={u.id}>{u.name}</div>)}
      {state.status === "error" && <button onClick={load}>Thử lại (rule "chỉ từ error")</button>}
      {state.status === "loading" && <p>Đang tải…</p>}
    </div>
  );
}
```

**Điểm "ăn điểm" của reducer (nói đúng với interviewer):**
1. **Rule transition 1 chỗ**: "chỉ từ `error` mới `retry`" nằm trong `reducer` (guard `state.status === "error"`) — không phải rải trong `onClick` (N chỗ, dễ sót).
2. **Gộp N `setState` thành 1 suy state**: submit form = `dispatch({type: "SUBMIT"})` (1 action) thay vì `setErr(""); setSubmitting(true); setX(...)` (3 `setState` riêng, order phụ thuộc nhau — dễ sai nếu thêm field).
3. **Test được logic mà không mount UI**: `expect(reducer(state, action))` (pure) — không cần `render`/`fireEvent` (Q17/Q27 liên hệ testing).
4. **MVVM (techniques 3-mvvm-hooks)**: model (state) + view (render) + view-model (reducer = "logic UI") tách bạch — "state ở đâu, logic chuyển ở đâu" rõ.

### 3. Vì sao `useState` KHÔNG TỐT cho "state machine" (nói rõ = ăn điểm)

```tsx
// ❌ useState "mô phỏng" state machine (rule rải trong handler):
const [status, setStatus] = useState("idle");
const [data, setData] = useState(null);
const [err, setErr] = useState("");

const load = () => {
  if (status === "loading") return;            // ← guard này PHẢI nhớ viết tay (dễ sót nếu thêm code)
  setStatus("loading"); setErr("");
  fetchUsers().then(setData).catch(setErr);
};
// (a) Rule "chỉ từ error mới retry" không có — retry được từ state nào cũng (dễ sai)
// (b) 3 state riêng (status/data/err) — đổi "một phần" = 3 setter (order dễ sai)
```

Mỗi lần thêm rule ("nếu đang `success` thì không fetch lại") = thêm `if` trong handler (nhiều chỗ) — **reducer: 1 chỗ** (switch case) → **test + sửa** rẻ hơn.

### 4. `useReducer` KHÔNG phải "chống N field" (sai nếu hiểu vậy)

- Form 10 field **độc lập** (từng field validate riêng, không phụ thuộc nhau) → 10 `useState` **đơn giản** (đọc/debug trực tiếp) — `useReducer` chỉ "rõ" hơn khi **nhiều update liên quan** (validate chéo, derive, reset all, N action trong 1 handler).
- Form **≥5 field + validate chéo + async** (Q19) → **RHF + Zod** (Q18) — reducer không thay thế form engine (RHF đã lo "field đăng ký", "lỗi theo field", "validate schema"); dùng reducer chỉ khi **cố tình không dùng RHF** (MVVM thuần).

### 5. "State machine" nghĩa là gì (định nghĩa rõ, không vẹt)

**State machine** (hữu hạn) = **m tập state + các transition (rule "từ state A, làm action B, sang state C")**. Trong `useReducer`:
- **States**: `status` (idle/loading/success/error), hoặc `data`, hoặc bất kỳ state object.
- **Actions** (triggers): `FETCH_START`, `SUBMIT`, `RETRY`...
- **Transitions**: `reducer(state, action)` trả state mới — **rule "chỉ từ error mới retry" = transition có điều kiện** (guard trong case).

Không phải "chỉ dùng cho login" — **bất kỳ logic có nhiều state + rule chuyển** (chat, wizard bước 1→2→3 (không cho skip), animation (idle→running→paused)) đều "state machine" — `useReducer` tổ chức chúng **có cấu trúc** (1 reducer, không rải N handler).

## Bẫy khi phỏng vấn

1. **"Form nhiều field → dùng `useReducer` (quy tắc)"** → **sai**: nhiều field **độc lập** (không validate chéo) → `useState` đơn giản hơn (đọc/debug trực tiếp — Q17). Reducer ăn điểm khi **nhiều update liên quan / rule transition / cần test logic** (§1).
2. **"Nói `reducer` là hàm thuần, không side effect — nhưng gọi `fetch` trong reducer"** → **sai** (vi phạm pure): fetch gọi **ngoài** (event handler, `dispatch` action với payload đã fetch xong); reducer **chỉ suy state mới** (pure) — test được (Q `renderHook`, Q15 store "không side effect trong selector").
3. **Nhiều `useState` "mô phỏng" state machine (rải guard trong handler)** → thêm rule = thêm `if` (nhiều chỗ, dễ sót) — đúng: 1 reducer (rule tập trung, test từng transition).
4. **Nhầm "reducer = Redux"** → khác: `useReducer` là **hook local** (state 1 component, không cần store global); Redux = **store ngoài + middleware** (Q15 — "Redux là lib quản lý state, không phải 'framework'").
5. **"State machine chỉ là từ ngữ, không thật"** → sai: guard "chỉ từ X mới Y" **là** transition có điều kiện (Q27 effect "không tính data", đây là "logic suy state" — đúng chỗ).

## Gợi ý câu chốt

> "`useState` = giá trị **độc lập, thay bằng** (1 state 1 setter). `useReducer` = **1 state object + update là 'hành động'** (action) — pure (test được), **rule transition nằm 1 chỗ** (switch), ăn điểm khi: **nhiều update liên quan / phụ thuộc state cũ** (validate chéo, 'clear all'), **state machine có rule có điều kiện** ('chỉ từ error mới retry' — guard trong case, không rải N handler), hay **gộp N `setState` lồng nhau trong 1 handler thành 1 action** (submit). Không phải 'form nhiều field → reducer' — 10 field **độc lập** (không validate chéo) `useState` đơn giản hơn; form ≥5 + validate chéo + async → RHF + Zod (Q18/Q19), không phải reducer. Điểm ăn điểm nhất: reducer **pure, test được không cần mount UI** (Q `renderHook`), logic tách khỏi view (MVVM)."

## Reference

- [`3_react-tutorial/hooks-overview`](../../3_react-tutorial/hooks-overview.md) — "`useReducer`: state phức tạp, `dispatch({type})` → reducer thuần", "ít field độc lập → state; nhiều chuyển đổi liên quan → reducer"
- [`2_react-techniques/2_architecture-patterns/3-mvvm-hooks`](../../2_react-techniques/2_architecture-patterns/3-mvvm-hooks) — MVVM bằng hooks (model = state, view-model = logic/reducer, view = render)
- [`2_react-techniques/2_architecture-patterns/4-stop-prop-drilling`](../../2_react-techniques/2_architecture-patterns/4-stop-prop-drilling) — "giảm prop drilling" (nơi reducer có lợi: state 1 object, không N prop)
- Q17 (controlled form) / Q19 (useState vs RHF) — "form nhiều field độc lập" (khi nào RHF thay reducer)
- Q25 (rules of hooks) — hook (reducer) phải top-level (không điều kiện — cùng quy tắc)

## Câu hỏi liên quan

- **Hỏi tiếp (liên tục)**: [Q26 — batching/functional update (reducer dùng functional)?](../26-batching-stale-closure/README.md) · [Q19 — form nhiều field, dấu hiệu "vượt tải" useState?](../19-when-usestate-when-rhf/README.md)
- **Đào sâu (xuyên nhóm)**: [Q35 — discriminated union + state machine (typing reducer)?](../35-type-safety/README.md) · [Q27 — khi nào nên dùng effect (reducer không chạy effect)?](../27-which-effect-when/README.md)
