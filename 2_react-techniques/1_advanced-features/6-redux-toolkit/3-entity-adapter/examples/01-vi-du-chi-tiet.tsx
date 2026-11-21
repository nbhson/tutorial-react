import { createEntityAdapter, createSlice, type PayloadAction } from '@reduxjs/toolkit';

type CartItem = { id: number; name: string; qty: number };
const itemsAdapter = createEntityAdapter<CartItem>({ sortComparer: (a, b) => a.name.localeCompare(b.name) });

// State = adapter + status async (gộp bài 2): setAll khi fetch xong
const cartSlice = createSlice({
  name: 'cart',
  initialState: itemsAdapter.getInitialState({ status: 'idle' as const }),
  reducers: {
    added: itemsAdapter.addOne, // dùng thẳng reducer có sẵn — khỏi viết push/filter
    removed: itemsAdapter.removeOne,
    qtySet: itemsAdapter.updateOne, // payload { id, changes: { qty } }
    cleared: (s) => { itemsAdapter.removeAll(s); }, // bọc khi cần logic thêm
  },
});
export const { added, removed, qtySet, cleared } = cartSlice.actions;
export default cartSlice.reducer;

// Selectors memo sẵn — colocate với slice, component chỉ import:
// export const { selectAll: selectCartItems, selectById: selectCartItem, selectTotal: selectCartCount } =
//   itemsAdapter.getSelectors((s: RootState) => s.cart);
// dispatch(added({ id: 1, name: 'Bút', qty: 2 })); // addOne
// dispatch(qtySet({ id: 1, changes: { qty: 5 } })); // updateOne — chỉ item 1 đổi
// const item = useAppSelector((s) => selectCartItem(s, 1)); // item 2 đổi: component này đứng yên
