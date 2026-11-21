// ✅ ĐÚNG: trả tham chiếu hiện tại; chỉ tạo mới khi thật sự đổi (trong add/clear)
getSnapshot() { return cartStore.items; }
