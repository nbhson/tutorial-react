# Async Thunk — Đưa API vào store

> Nguồn: https://redux-toolkit.js.org/api/createAsyncThunk

## Mục tiêu
- Viết `createAsyncThunk` với đủ 3 vòng đời pending/fulfilled/rejected.
- Hứng thunk bằng `extraReducers` theo mẫu `status`/`error` chuẩn.
- Biết hủy request (`signal`) và test thunk không cần render.

## Khái niệm cốt lõi
- **`createAsyncThunk("todos/fetch", async (arg, api) => ...)`**: sinh 3 action type `todos/fetch/pending|fulfilled|rejected`. `arg` là tham số gọi, `api` cho `rejectWithValue`/`signal`/`getState`.
- **`extraReducers(builder)`**: nơi slice hứng action từ ngoài (thunk) — `reducers` thường không làm được vì action không do slice sinh.
- **Mẫu `status: "idle"|"pending"|"failed"` + `error`**: mọi slice async cùng một shape — UI nào cũng switch giống nhau, không mỗi chỗ một kiểu.
- **`rejectWithValue(msg)`**: đưa lỗi có kiểm soát vào `action.payload` của case rejected — thay vì error thô khó hiển thị.
- **`signal` (AbortSignal)**: thunk nhận signal hủy fetch; component unmount hoặc gọi lại thì `abort()` — chống race response cũ ghi đè mới.
- **Điều kiện chạy**: `condition` (option thứ ba) cho phép skip thunk khi đang pending — chống double-submit ở tầng store.

## Ví dụ chi tiết
```tsx
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

type Todo = { id: number; title: string; done: boolean };
type TodosState = { items: Todo[]; status: 'idle' | 'pending' | 'failed'; error: string | null };

// Thunk fetch: signal hủy + lỗi gom gọn qua rejectWithValue
export const fetchTodos = createAsyncThunk('todos/fetch', async (_, { rejectWithValue, signal }) => {
  const r = await fetch('https://jsonplaceholder.typicode.com/todos?_limit=5', { signal });
  if (!r.ok) return rejectWithValue('Fetch failed'); // -> case rejected, payload là message
  return (await r.json()) as Todo[];
});

const todosSlice = createSlice({
  name: 'todos',
  initialState: { items: [], status: 'idle', error: null } as TodosState,
  reducers: {},
  extraReducers: (b) => {
    b.addCase(fetchTodos.pending, (s) => { s.status = 'pending'; s.error = null; }) // reset lỗi cũ
     .addCase(fetchTodos.fulfilled, (s, a) => { s.status = 'idle'; s.items = a.payload; })
     .addCase(fetchTodos.rejected, (s, a) => { s.status = 'failed'; s.error = String(a.payload ?? 'Lỗi'); });
  },
});
export default todosSlice.reducer;

// Component: dispatch(fetchTodos()) trong useEffect, switch UI theo status
// const { items, status, error } = useAppSelector((s) => s.todos);
// if (status === 'pending') return <p>Đang tải…</p>;
// if (status === 'failed') return <p>{error} <button onClick={() => dispatch(fetchTodos())}>Thử lại</button></p>;
```

## Giải thích từng phần
- `pending` reset `error`: fetch lại sau lỗi mà còn message cũ là UI sai — reset ngay khi bắt đầu.
- `a.payload` ở rejected chỉ có khi dùng `rejectWithValue`; ném `throw` thường thì lỗi nằm ở `a.error.message`.
- `signal` truyền thẳng vào `fetch` — không cần AbortController tay; gọi `dispatch(fetchTodos())` lần 2 không tự hủy lần 1, muốn vậy dùng `condition` hoặc abort tay qua `promise.abort()`.
- Test thuần: `reducer(prev, fetchTodos.fulfilled(payload, ""))` — gọi action creator của thunk như action thường, không cần mock store.

## Lỗi thường gặp
- **Chỉ hứng fulfilled, bỏ pending/rejected** → UI không có tải/lỗi, treo im khi mạng lỗi. Fix: luôn đủ 3 case.
- **Để `status` kẹt `"pending"` khi lỗi** → spinner quay mãi. Fix: rejected phải set `failed` + `error`.
- **Race 2 lần gọi** (StrictMode double-effect, gõ search nhanh) → response cũ về sau ghi đè. Fix: `signal` + cleanup, hoặc `condition` skip khi đang pending.
- **Nhét cả response thô vào store** → dư field, khó chuẩn hóa. Fix: map về type gọn ở thunk, hoặc chuẩn hóa bằng entity adapter (bài 3).

## Reference
- [createAsyncThunk](https://redux-toolkit.js.org/api/createAsyncThunk)
