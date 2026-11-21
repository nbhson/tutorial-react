const [optimisticState, addOptimistic] = useOptimistic(
  actualState,                                  // state thật (ví dụ từ useState)
  (currentState, optimisticValue, ...args) => { // updater thuần — trả state tạm
    return nextOptimisticState;
  },
);

async function action(formData: FormData) {
  addOptimistic(value);        // 1. hiện ngay item tạm
  try {
    const saved = await api.send(value);
    setActual(prev => [...prev, saved]); // 2. actual cập nhật → optimistic biến mất
  } catch {
    // 3. throw/lỗi → optimistic tự rollback
  }
}
