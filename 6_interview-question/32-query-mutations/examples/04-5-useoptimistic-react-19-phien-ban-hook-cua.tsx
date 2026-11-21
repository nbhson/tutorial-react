// useOptimistic (React 19) — "hiện" tin nhắn TẠM trong khi server "xử"
const [optimisticPosts, addOptimistic] = useOptimistic(
  posts,                        // "actual" (cache/state thật)
  (current, newPost) => [...current, { ...newPost, pending: true }], // "phỏng đoán"
);
// "Bấm gửi" (trong Action, "kèm" startTransition):
addOptimistic(post);           // "hiện" ngay (pending: true, mờ)
// "Server" về: thành công → setActual (optimistic "biến"); lỗi → React "rollback" (tự)
