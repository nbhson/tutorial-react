// ---------- counterSlice.ts ----------
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

const counterSlice = createSlice({
  name: 'counter', // tiền tố action type: "counter/increment"
  initialState: { value: 0 },
  reducers: {
    increment: (s) => { s.value++; }, // viết như mutate — Immer lo immutable
    addBy: (s, a: PayloadAction<number>) => { s.value += a.payload; }, // payload có type
  },
});
export const { increment, addBy } = counterSlice.actions; // action creator tự sinh
export default counterSlice.reducer;

// ---------- store.ts ----------
import { configureStore } from '@reduxjs/toolkit';
import { useDispatch, useSelector } from 'react-redux';
import counterReducer from './counterSlice';

export const store = configureStore({ reducer: { counter: counterReducer } }); // thunk + DevTools sẵn
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();

// ---------- Counter.tsx ----------
export function Counter() {
  const value = useAppSelector((s) => s.counter.value); // đọc đúng lát cần
  const dispatch = useAppDispatch();
  return (
    <>
      <p>{value}</p>
      <button onClick={() => dispatch(increment())}>+1</button>
      <button onClick={() => dispatch(addBy(5))}>+5</button>
    </>
  );
}
// Entry bọc một lần: <Provider store={store}><Counter /></Provider>
