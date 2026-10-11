import { createEntityAdapter, createSlice } from '@reduxjs/toolkit';

// Entity giỏ hàng + adapter sắp xếp theo tên — khỏi viết push/filter/map tay
type CartItem = { id: number; name: string; qty: number };
const itemsAdapter = createEntityAdapter<CartItem>({
  sortComparer: (a, b) => a.name.localeCompare(b.name), // ids luôn có thứ tự
});

// State = chuẩn hóa { ids, entities } + status async (gộp bài 2)
const cartSlice = createSlice({
  name: 'cart',
  initialState: itemsAdapter.getInitialState({ status: 'idle' as const }),
  reducers: {
    added: itemsAdapter.addOne, // gán thẳng reducer có sẵn
    removed: itemsAdapter.removeOne,
    qtySet: itemsAdapter.updateOne, // payload { id, changes: { qty } }
    cleared: (s) => { itemsAdapter.removeAll(s); }, // bọc khi cần logic thêm
  },
});
export const { added, removed, qtySet, cleared } = cartSlice.actions;
export default cartSlice.reducer;

// Selectors memo sẵn — colocate với slice (cần RootState từ store.ts bài 1):
// import type { RootState } from '../1-slice-store/example';
// export const {
//   selectAll: selectCartItems, // toàn bộ items (đã sắp xếp)
//   selectById: selectCartItem, // một item theo id — item khác đổi không re-render
//   selectTotal: selectCartCount, // số lượng ids
// } = itemsAdapter.getSelectors((s: RootState) => s.cart);

// Cách dùng:
// dispatch(added({ id: 1, name: 'Bút', qty: 2 })); // thêm một
// dispatch(qtySet({ id: 1, changes: { qty: 5 } })); // sửa một — chỉ item 1 đổi tham chiếu
// const item = useAppSelector((s) => selectCartItem(s, 1)); // đọc một item
