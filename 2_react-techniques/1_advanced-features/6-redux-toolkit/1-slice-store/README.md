# Slice + Store — Nền Redux Toolkit

> Nguồn: https://redux-toolkit.js.org/api/createSlice — https://redux-toolkit.js.org/api/configureStore

## Mục tiêu

Mục này nói về ba đích đến của bài: viết slice gọn, dựng store chuẩn, và hiểu luồng render của Redux. Đọc để biết bạn sẽ biết làm được gì sau bài này.

- Viết được `createSlice` (action + reducer một chỗ) và hiểu Immer cho phép viết như mutate.
- Dựng `configureStore` + `Provider` + typed hooks (`useAppDispatch`/`useAppSelector`).
- Nắm luồng render: dispatch → reducer → notify → selector → re-render.

> **Tóm gọn 1 câu:** Bài này cho bạn "bộ khung nhà Redux" — slice là phòng, store là cả ngôi nhà, và bạn biết khách (data) đi qua nhà theo đường nào.

## Khái niệm cốt lõi

Mục này nói về 5 khái niệm nền của Redux Toolkit — đọc trước để các ví dụ phía sau không còn là dòng chữ lạ.

- **`createSlice({ name, initialState, reducers })`**: mỗi key trong `reducers` vừa là hàm update vừa tự sinh action creator (`counter/increment`). `name` thành tiền tố action type — DevTools đọc là hiểu. Ví von: đặt tên slice như đặt tên thư mục — từ đó mọi tập tin sinh ra đều đeo sẵn "đường dẫn" dễ tra cứu.
- **Immer bên trong reducer**: `state.value++` trông như mutate nhưng Immer tạo state mới bất biến. Hãy hình dung Immer như người biên tập viên: bạn gạch xoá trên bản nháp, ra bản in là bản mới sạch, bản gốc vẫn nguyên vẹn. Chỉ đúng **trong** reducer slice — copy thói quen này ra component là sai.
- **`configureStore({ reducer: {...} })`**: gộp slice, gắn sẵn thunk middleware + Redux DevTools + `serializableCheck`. Khác `createStore` cũ phải cấu hình tay từng thứ — như dọn vào chung cư có sẵn nội thất thay vì tự đóng từng món đồ.
- **Typed hooks**: `RootState`/`AppDispatch` suy từ store, khóa kiểu một lần bằng `withTypes` — component sau đó không nhắc lại generic, thunk cũng được type.
- **`useSelector` so slice bằng `===`**: chỉ component đọc slice đổi mới re-render — khác Context (value đổi là cả cụm consumer render). Ví von: mỗi component là một người đăng ký kênh, chỉ ai theo dõi đúng kênh đó mới nhận thông báo, chứ không báo động chung cả tòa nhà.

> **Tóm gọn 1 câu:** `createSlice` viết reducer + action một chỗ, `configureStore` lắp sẵn mọi phụ kiện, typed hooks khóa kiểu một lần dùng mãi.

## Ví dụ chi tiết

Mục này nói về code hoàn chỉnh của bài — đọc song song với phần giải thích ngay dưới.

> 📄 **Code ví dụ:** [`examples/01-vi-du-chi-tiet.tsx`](examples/01-vi-du-chi-tiet.tsx)

## Giải thích từng phần

Mục này nói về ý nghĩa từng chi tiết trong ví dụ — những chỗ dễ nhầm nhỏ mà hậu quả lớn.

- `PayloadAction<number>`: type payload chuẩn — sai kiểu là lỗi biên dịch, không phải runtime.
- `counterSlice.actions` vs `counterSlice.reducer`: actions đi vào `dispatch`, reducer đi vào `configureStore` — nhầm là app không chạy. Ví von: actions là "hàng hoá gửi đi", reducer là "kho tiếp nhận" — gửi nhầm nơi hàng không bao giờ về.
- `withTypes`: cú pháp chuẩn RTK 2.x; cách cũ `useDispatch<AppDispatch>()` vẫn chạy nhưng không khuyến nghị.
- Một `store` duy nhất ở module scope + một `Provider` ở entry — tạo store trong component là reset state mỗi render, như xây lại cả ngôi nhà mỗi lần mời khách.

## Lỗi thường gặp

Mục này nói về 4 bẫy phổ biến với người mới dùng Redux Toolkit — đọc để tránh khỏi khỏi mất buổi debug không cần thiết.

- **Mutate state ở component** (`obj.field = x` rồi dispatch) → React-Redux không phát hiện. Fix: mọi đổi state qua action + reducer.
- **Dispatch trong lúc render** → vòng lặp render. Fix: dispatch trong event handler hoặc `useEffect` có deps.
- **Dùng `useSelector`/`useDispatch` thô khắp nơi** → mất type thunk, refactor khó. Fix: chỉ export bản đã type từ `store.ts`.
- **Nhét `Date`/function vào state** → cảnh báo serializable, time-travel vỡ. Fix: ISO string ở biên, function để ngoài store — store chỉ chứa dữ liệu "chụp ảnh được", giống nhật ký ghi bằng chữ chứ không cài được một cái máy vào trang vở.

> **Tóm gọn 1 câu:** Đổi state chỉ qua action + reducer, dispatch ngoài vòng render, và store chỉ chứa thứ serialize được.

## Reference

- [createSlice](https://redux-toolkit.js.org/api/createSlice) · [configureStore](https://redux-toolkit.js.org/api/configureStore)
