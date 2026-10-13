# DevTools + Persist — Debug và giữ state

> Nguồn: https://redux-toolkit.js.org/api/configureStore — https://github.com/reduxjs/redux-devtools-extension

## Mục tiêu
- Dùng Redux DevTools time-travel: xem action, nhảy state, skip action để khoanh bug.
- Hiểu `serializableCheck` và giữ store serialize được.
- Persist slice cần thiết qua reload bằng redux-persist (whitelist, migrate).

## Khái niệm cốt lõi
- **DevTools time-travel**: mỗi dispatch là một điểm trong lịch sử — click nhảy tới state bất kỳ, "skip" bỏ qua action để xem UI không có nó ra sao. Đây là lý do lớn nhất chọn Redux cho app lớn.
- **Action log đọc được**: `todos/toggle` + payload hiển thị rõ — đặt tên slice/reducer rõ nghĩa chính là đầu tư cho debug.
- **`serializableCheck` (mặc định bật)**: cảnh báo khi state/action chứa Date/class/function/Promise — vì time-travel + persist cần serialize. Tắt từng field có chủ đích, không tắt cả middleware.
- **redux-persist**: `persistReducer({ key, storage, whitelist })` bọc reducer + `persistStore` — rehydrate khi boot. `whitelist` chỉ giữ slice cần (cart/theme), blacklist auth/token nhạy cảm.
- **Listener middleware** (`createListenerMiddleware`): phản ứng sau action (vd action X xong thì dispatch Y, log analytics) — thay saga cho case vừa, vẫn trong hệ sinh thái RTK.

## Ví dụ chi tiết
```tsx
import { configureStore, createListenerMiddleware } from '@reduxjs/toolkit';
import { persistReducer, persistStore } from 'redux-persist';
import storage from 'redux-persist/lib/storage'; // localStorage web
import todosReducer from '../2-async-thunk/example';

// Listener: sau khi fetch thành công thì log — thay saga cho case đơn giản
const listener = createListenerMiddleware();
listener.startListening({
  actionCreator: fetchTodos.fulfilled, // nghe đúng action thunk (import từ bài 2)
  effect: async (action, api) => {
    console.log(`Đã tải ${action.payload.length} todos`); // analytics/log tại đây
    api.dispatch({ type: 'stats/bump' }); // được dispatch tiếp nếu cần
  },
});

// Persist: chỉ giữ todos, version + migrate để đổi shape không vỡ data cũ
const persistedTodos = persistReducer(
  { key: 'todos', storage, whitelist: ['items'], version: 1 },
  todosReducer,
);

export const store = configureStore({
  reducer: { todos: persistedTodos },
  middleware: (g) => g({ serializableCheck: { ignoredActions: ['persist/PERSIST'] } }).prepend(listener.middleware),
});
export const persistor = persistStore(store); // entry bọc <PersistGate persistor={persistor}>
```

## Giải thích từng phần
- `whitelist: ["items"]` — chỉ persist dữ liệu, bỏ `status`/`error` (trạng thái nhất thời, boot lại tính mới).
- `ignoredActions: ["persist/PERSIST"]` — action của persist chứa function/non-serializable có chủ đích, bỏ qua check đúng chỗ thay vì tắt cả middleware.
- `.prepend(listener.middleware)` — listener chạy trước thunk mặc định để kịp nghe action; thứ tự middleware là thứ tự chạy.
- `<PersistGate>` giữ UI chờ rehydrate xong — không thì lần render đầu đọc state rỗng rồi nhảy UI.

## Lỗi thường gặp
- **Persist cả token/auth vào localStorage** → XSS đọc được. Fix: token httpOnly cookie (nhóm `4_security-config`), persist chỉ data vô hại.
- **Đổi shape state không migrate** → rehydrate data cũ vỡ app. Fix: `version` + `migrate` mỗi lần đổi shape.
- **Tắt hẳn `serializableCheck`** vì "ồn" → mất lá chắn time-travel/persist. Fix: `ignoredActions`/`ignoredPaths` đúng field.
- **Debug bằng console.log thay vì DevTools** → chậm. Fix: thói quen mới — nghi bug là mở DevTools xem action trước, skip action để khoanh vùng.

## Reference
- [Redux DevTools](https://github.com/reduxjs/redux-devtools-extension) · [redux-persist](https://github.com/rt2zz/redux-persist)
