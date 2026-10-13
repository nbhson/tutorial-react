import { Provider } from 'react-redux';
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { configureStore } from '@reduxjs/toolkit';
import { useDispatch, useSelector } from 'react-redux';

// Slice đếm: action + reducer một chỗ, viết như mutate nhờ Immer
const counterSlice = createSlice({
  name: 'counter', // tiền tố action type: "counter/increment"
  initialState: { value: 0 },
  reducers: {
    increment: (s) => { s.value++; }, // Immer biến thành update bất biến
    addBy: (s, a: PayloadAction<number>) => { s.value += a.payload; }, // payload có type
  },
});
export const { increment, addBy } = counterSlice.actions; // action creator tự sinh

// Store duy nhất: thunk + DevTools + serializableCheck gắn sẵn
export const store = configureStore({ reducer: { counter: counterSlice.reducer } });
export type RootState = ReturnType<typeof store.getState>; // type toàn app
export type AppDispatch = typeof store.dispatch; // type hiểu cả thunk
export const useAppDispatch = useDispatch.withTypes<AppDispatch>(); // dispatch đã type
export const useAppSelector = useSelector.withTypes<RootState>(); // selector đã type

export function Counter() {
  const value = useAppSelector((s) => s.counter.value); // đọc đúng lát cần
  const dispatch = useAppDispatch(); // ghi qua dispatch
  return (
    <>
      <p>Count: {value}</p>
      <button onClick={() => dispatch(increment())}>+1</button>
      <button onClick={() => dispatch(addBy(5))}>+5</button>
    </>
  );
}

// Entry: bọc Provider một lần, mọi con dùng hook đã type
export function App() {
  return (
    <Provider store={store}>
      <Counter />
    </Provider>
  );
}
