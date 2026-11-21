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
