# Slice + Store — Nền Redux Toolkit

> Nguồn: https://redux-toolkit.js.org/api/createSlice — https://redux-toolkit.js.org/api/configureStore

## Mục tiêu
- Viết được `createSlice` (action + reducer một chỗ) và hiểu Immer cho phép viết như mutate.
- Dựng `configureStore` + `Provider` + typed hooks (`useAppDispatch`/`useAppSelector`).
- Nắm luồng render: dispatch → reducer → notify → selector → re-render.

## Khái niệm cốt lõi
- **`createSlice({ name, initialState, reducers })`**: mỗi key trong `reducers` vừa là hàm update vừa tự sinh action creator (`counter/increment`). `name` thành tiền tố action type — DevTools đọc là hiểu.
- **Immer bên trong reducer**: `state.value++` trông như mutate nhưng Immer tạo state mới bất biến. Chỉ đúng **trong** reducer slice — copy thói quen này ra component là sai.
- **`configureStore({ reducer: {...} })`**: gộp slice, gắn sẵn thunk middleware + Redux DevTools + `serializableCheck`. Khác `createStore` cũ phải cấu hình tay từng thứ.
- **Typed hooks**: `RootState`/`AppDispatch` suy từ store, khóa kiểu một lần bằng `withTypes` — component sau đó không nhắc lại generic, thunk cũng được type.
- **`useSelector` so slice bằng `===`**: chỉ component đọc slice đổi mới re-render — khác Context (value đổi là cả cụm consumer render).

## Ví dụ chi tiết
```tsx
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
```

## Giải thích từng phần
- `PayloadAction<number>`: type payload chuẩn — sai kiểu là lỗi biên dịch, không phải runtime.
- `counterSlice.actions` vs `counterSlice.reducer`: actions đi vào `dispatch`, reducer đi vào `configureStore` — nhầm là app không chạy.
- `withTypes`: cú pháp chuẩn RTK 2.x; cách cũ `useDispatch<AppDispatch>()` vẫn chạy nhưng không khuyến nghị.
- Một `store` duy nhất ở module scope + một `Provider` ở entry — tạo store trong component là reset state mỗi render.

## Lỗi thường gặp
- **Mutate state ở component** (`obj.field = x` rồi dispatch) → React-Redux không phát hiện. Fix: mọi đổi state qua action + reducer.
- **Dispatch trong lúc render** → vòng lặp render. Fix: dispatch trong event handler hoặc `useEffect` có deps.
- **Dùng `useSelector`/`useDispatch` thô khắp nơi** → mất type thunk, refactor khó. Fix: chỉ export bản đã type từ `store.ts`.
- **Nhét `Date`/function vào state** → cảnh báo serializable, time-travel vỡ. Fix: ISO string ở biên, function để ngoài store.

## Reference
- [createSlice](https://redux-toolkit.js.org/api/createSlice) · [configureStore](https://redux-toolkit.js.org/api/configureStore)
