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
