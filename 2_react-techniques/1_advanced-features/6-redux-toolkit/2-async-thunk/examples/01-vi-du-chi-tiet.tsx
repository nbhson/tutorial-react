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
