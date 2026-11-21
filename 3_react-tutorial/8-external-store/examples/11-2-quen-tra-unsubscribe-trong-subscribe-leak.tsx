// ✅ ĐÚNG: trả hàm xóa, React gọi khi unmount (như example)
subscribe(fn: () => void) {
  cartStore.listeners.add(fn);
  return () => { cartStore.listeners.delete(fn); };
}
