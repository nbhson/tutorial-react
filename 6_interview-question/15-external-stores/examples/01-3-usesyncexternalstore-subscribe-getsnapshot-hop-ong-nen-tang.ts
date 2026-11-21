// Hợp đồng 2 hàm (trích store "tự viết" trong DAY 8):
subscribe(fn) {
  listeners.add(fn);            // React "gửi" callback, bạn "cất"
  return () => listeners.delete(fn); // BẠN "TRẢ" "hàm" "hủy", React "gọi" "khi unmount"
},
getSnapshot() { return items; } // React "gọi" "để so" (cũ vs mới)
