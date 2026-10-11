import { configureStore, createListenerMiddleware } from '@reduxjs/toolkit';
import { persistReducer, persistStore } from 'redux-persist';
import storage from 'redux-persist/lib/storage'; // localStorage web
import todosReducer, { fetchTodos } from '../2-async-thunk/example';

// Listener: phản ứng sau action — thay saga cho case đơn giản, vẫn trong RTK
const listener = createListenerMiddleware();
listener.startListening({
  actionCreator: fetchTodos.fulfilled, // nghe đúng action thunk từ bài 2
  effect: async (action, api) => {
    console.log(`Đã tải ${action.payload.length} todos`); // log/analytics tại đây
    api.dispatch({ type: 'stats/bump' }); // được dispatch tiếp nếu cần
  },
});

// Persist: chỉ giữ items (dữ liệu), bỏ status/error (trạng thái nhất thời)
const persistedTodos = persistReducer(
  { key: 'todos', storage, whitelist: ['items'], version: 1 }, // version để migrate khi đổi shape
  todosReducer,
);

export const store = configureStore({
  reducer: { todos: persistedTodos },
  middleware: (g) =>
    g({ serializableCheck: { ignoredActions: ['persist/PERSIST'] } }) // bỏ qua action của persist đúng chỗ
      .prepend(listener.middleware), // listener chạy trước để kịp nghe action
});
export const persistor = persistStore(store); // entry bọc <PersistGate persistor={persistor}> chờ rehydrate
