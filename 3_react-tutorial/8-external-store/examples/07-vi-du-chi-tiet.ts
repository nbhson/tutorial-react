import { configureStore, createSlice } from "@reduxjs/toolkit";

const cartSlice = createSlice({
  name: "cart",
  initialState: { items: [] as string[] },
  reducers: { add: (s, a: { payload: string }) => { s.items.push(a.payload); } }, // Immer: viết mutate, kết quả bất biến
});
export const { add } = cartSlice.actions;
export const store = configureStore({ reducer: { cart: cartSlice.reducer } });
// Component: const items = useSelector((s: RootState) => s.cart.items);
// Dispatch: dispatch(add("Hàng A")) — DevTools ghi action để time-travel/undo.
