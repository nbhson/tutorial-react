// Hợp đồng tối giản (trích example.tsx, xem bản đầy đủ ở Ví dụ chi tiết):
subscribe(fn: () => void) {
  cartStore.listeners.add(fn); // bạn CẤT fn do React tạo vào Set
  return () => { cartStore.listeners.delete(fn); }; // bạn TRẢ hàm hủy, React GỌI khi unmount
},
getSnapshot() { return cartStore.items; }, // bạn TRẢ giá trị hiện tại, React SO SÁNH
// add(): bạn tạo mảng mới + forEach báo subscriber kiểm tra lại
