import { useEffect } from 'react';
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

// Kiểu dữ liệu + state async chuẩn: items + status + error
type Todo = { id: number; title: string; done: boolean };
type TodosState = { items: Todo[]; status: 'idle' | 'pending' | 'failed'; error: string | null };

// Thunk fetch: signal hủy request + lỗi gom gọn qua rejectWithValue
export const fetchTodos = createAsyncThunk('todos/fetch', async (_, { rejectWithValue, signal }) => {
  const r = await fetch('https://jsonplaceholder.typicode.com/todos?_limit=5', { signal });
  if (!r.ok) return rejectWithValue('Fetch failed'); // đẩy sang case rejected
  return (await r.json()) as Todo[];
});

const todosSlice = createSlice({
  name: 'todos',
  initialState: { items: [], status: 'idle', error: null } as TodosState,
  reducers: {},
  extraReducers: (b) => {
    b.addCase(fetchTodos.pending, (s) => { s.status = 'pending'; s.error = null; }) // reset lỗi cũ
      .addCase(fetchTodos.fulfilled, (s, a) => { s.status = 'idle'; s.items = a.payload; }) // có data
      .addCase(fetchTodos.rejected, (s, a) => { s.status = 'failed'; s.error = String(a.payload ?? 'Lỗi'); }); // lỗi
  },
});
export default todosSlice.reducer;

// Component dùng slice này (giả định useAppDispatch/useAppSelector từ store.ts bài 1):
// import { useAppDispatch, useAppSelector } from '../1-slice-store/example';
// export function TodoList() {
//   const dispatch = useAppDispatch();
//   const { items, status, error } = useAppSelector((s) => s.todos);
//   useEffect(() => { dispatch(fetchTodos()); }, [dispatch]); // fetch một lần sau mount
//   if (status === 'pending') return <p>Đang tải…</p>; // nhánh tải
//   if (status === 'failed') return ( // nhánh lỗi + thử lại
//     <p>{error} <button onClick={() => dispatch(fetchTodos())}>Thử lại</button></p>
//   );
//   return <ul>{items.map((t) => <li key={t.id}>{t.title}</li>)}</ul>; // nhánh xong
// }
