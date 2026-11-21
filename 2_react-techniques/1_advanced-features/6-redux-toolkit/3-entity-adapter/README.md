# Entity Adapter — Chuẩn hóa collection

> Nguồn: https://redux-toolkit.js.org/api/createEntityAdapter

## Mục tiêu

Mục này nói về ba đích đến của bài: hiểu vì sao phải chuẩn hóa collection, dùng adapter sinh sẵn CRUD, và biết sắp xếp + gộp với async. Đọc để biết bài cho bạn công cụ gì.

- Hiểu vì sao mảng thô không hợp cho collection cần update/xóa từng item.
- Dùng `createEntityAdapter` + reducer CRUD có sẵn + selector `selectAll`/`selectById`.
- Biết sắp xếp (`sortComparer`) và gộp adapter với `status` async.

> **Tóm gọn 1 câu:** Entity adapter biến mảng lộn xộn thành "tủ hồ sơ có mục lục" — tìm theo id tức thì, CRUD có sẵn, không viết tay filter/map.

## Khái niệm cốt lõi

Mục này nói về 5 khái niệm của createEntityAdapter — đọc để hiểu "tủ hồ sơ" hoạt động ra sao trước khi xem code.

- **Chuẩn hóa (normalize)**: mảng `[{id, ...}]` thành `{ ids: [1,2], entities: { 1: {...}, 2: {...} }` — tìm/update theo id O(1), không `find`/`map` cả mảng mỗi lần. Ví von: thay vì lật từng trang vở để tìm một bài, bạn có mục lục ghi số trang — muốn bài nào mở đúng ngay trang đó.
- **`createEntityAdapter<T>()`**: sinh `getInitialState`, reducer CRUD (`addOne/addMany/setAll/removeOne/updateOne/upsertMany`) và `getSelectors` — khỏi viết `filter`/`map` tay, như được giao sẵn bộ dụng cụ đủ mặt thay vì tự rèn từng chiếc.
- **`getSelectors((state: RootState) => state.todos)`**: selector memo sẵn (`selectAll`, `selectById`, `selectIds`, `selectTotal`) — component đọc đúng item cần, item khác đổi không re-render.
- **`sortComparer`**: giữ `ids` luôn sắp xếp (vd theo tên) — UI list ổn định không cần sort lúc render. Hãy hình dung thủ thư chèn sách vào đúng vị trí ngay khi nhập kho, thay vì xếp lại cả kệ mỗi lần khách đến.
- **Gộp với async**: state adapter + thêm field `status`/`error` cho thunk (bài 2) — `setAll` trong fulfilled, `removeOne` sau delete thành công.

> **Tóm gọn 1 câu:** Normalize là mục lục O(1), adapter là bộ CRUD sinh sẵn, `sortComparer` là thủ thư xếp sẵn kệ — bạn chỉ còn việc dispatch.

## Ví dụ chi tiết

Mục này nói về code hoàn chỉnh của bài — đọc song song phần giải thích dưới.

> 📄 **Code ví dụ:** [`examples/01-vi-du-chi-tiet.tsx`](examples/01-vi-du-chi-tiet.tsx)

## Giải thích từng phần

Mục này nói về các chi tiết trong ví dụ dễ dùng nhầm — đọc để chọn đúng hàm cho đúng việc.

- `added: itemsAdapter.addOne` — gán trực tiếp "case reducer" có sẵn, không cần viết thân hàm.
- `updateOne` nhận `{ id, changes }` (partial) — khác `setOne` (thay cả entity); dùng sai là mất field. Ví von: `updateOne` là vá áo (chỉ vá chỗ rách), `setOne` là đổi nguyên chiếc áo khác.
- `selectById(state, id)` trả đúng tham chiếu entity — entity khác đổi không ảnh hưởng `===` nên không re-render thừa.
- `sortComparer` chạy lúc insert/update — render không sort lại, list luôn đúng thứ tự.

## Lỗi thường gặp

Mục này nói về 4 bẫy khi dùng adapter — đọc để không tự làm chậm app do giữ mảng thô.

- **Giữ mảng thô rồi `map`/`find` khắp nơi** → O(n) mỗi update, selector khó memo. Fix: adapter ngay từ đầu, đừng đợi phình mới refactor.
- **Dùng `setAll` cho update một item** → thay cả `entities`, mọi `selectById` đổi tham chiếu → re-render cả list. Fix: `updateOne`/`upsertMany` đúng phạm vi.
- **Quên `getSelectors` với selector root** → selector đọc sai nhánh state. Fix: truyền `(s: RootState) => s.cart` ngay khi tạo.
- **Hai adapter cho cùng entity ở 2 slice** → 2 nguồn sự thật. Fix: một entity một adapter một slice — một hồ sơ chỉ nằm đúng một ngăn kéo.

> **Tóm gọn 1 câu:** Adapter hóa ngay từ đầu, update từng món bằng `updateOne` chứ không `setAll`, và mỗi entity chỉ một adapter.

## Reference

- [createEntityAdapter](https://redux-toolkit.js.org/api/createEntityAdapter)
