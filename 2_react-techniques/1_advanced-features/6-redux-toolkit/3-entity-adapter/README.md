# Entity Adapter — Chuẩn hóa collection

> Nguồn: https://redux-toolkit.js.org/api/createEntityAdapter

## Mục tiêu
- Hiểu vì sao mảng thô không hợp cho collection cần update/xóa từng item.
- Dùng `createEntityAdapter` + reducer CRUD có sẵn + selector `selectAll`/`selectById`.
- Biết sắp xếp (`sortComparer`) và gộp adapter với `status` async.

## Khái niệm cốt lõi
- **Chuẩn hóa (normalize)**: mảng `[{id, ...}]` thành `{ ids: [1,2], entities: { 1: {...}, 2: {...} }` — tìm/update theo id O(1), không `find`/`map` cả mảng mỗi lần.
- **`createEntityAdapter<T>()`**: sinh `getInitialState`, reducer CRUD (`addOne/addMany/setAll/removeOne/updateOne/upsertMany`) và `getSelectors` — khỏi viết `filter`/`map` tay.
- **`getSelectors((state: RootState) => state.todos)`**: selector memo sẵn (`selectAll`, `selectById`, `selectIds`, `selectTotal`) — component đọc đúng item cần, item khác đổi không re-render.
- **`sortComparer`**: giữ `ids` luôn sắp xếp (vd theo tên) — UI list ổn định không cần sort lúc render.
- **Gộp với async**: state adapter + thêm field `status`/`error` cho thunk (bài 2) — `setAll` trong fulfilled, `removeOne` sau delete thành công.

## Ví dụ chi tiết
```tsx
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
```

## Giải thích từng phần
- `added: itemsAdapter.addOne` — gán trực tiếp "case reducer" có sẵn, không cần viết thân hàm.
- `updateOne` nhận `{ id, changes }` (partial) — khác `setOne` (thay cả entity); dùng sai là mất field.
- `selectById(state, id)` trả đúng tham chiếu entity — entity khác đổi không ảnh hưởng `===` nên không re-render thừa.
- `sortComparer` chạy lúc insert/update — render không sort lại, list luôn đúng thứ tự.

## Lỗi thường gặp
- **Giữ mảng thô rồi `map`/`find` khắp nơi** → O(n) mỗi update, selector khó memo. Fix: adapter ngay từ đầu, đừng đợi phình mới refactor.
- **Dùng `setAll` cho update một item** → thay cả `entities`, mọi `selectById` đổi tham chiếu → re-render cả list. Fix: `updateOne`/`upsertMany` đúng phạm vi.
- **Quên `getSelectors` với selector root** → selector đọc sai nhánh state. Fix: truyền `(s: RootState) => s.cart` ngay khi tạo.
- **Hai adapter cho cùng entity ở 2 slice** → 2 nguồn sự thật. Fix: một entity một adapter một slice.

## Reference
- [createEntityAdapter](https://redux-toolkit.js.org/api/createEntityAdapter)
