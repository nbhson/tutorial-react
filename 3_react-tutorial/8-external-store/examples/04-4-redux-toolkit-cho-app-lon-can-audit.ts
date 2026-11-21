// Redux Toolkit (app lớn — DevTools time-travel, audit action):
import { configureStore, createSlice } from "@reduxjs/toolkit";
const cartSlice = createSlice({
  name: "cart",
  initialState: { items: [] as string[] },
  reducers: { add: (s, a: { payload: string }) => { s.items.push(a.payload); } }, // Immer: viết mutate, thực chất bất biến
});
export const { add } = cartSlice.actions;
export const store = configureStore({ reducer: { cart: cartSlice.reducer } });
// Component: const count = useSelector((s: RootState) => s.cart.items.length);
