// ✅ ĐÚNG: 4 option tối thiểu — đủ để virtualizer tính cửa sổ
const v = useVirtualizer({
  count: items.length, // tổng dòng — đổi khi filter/append
  getScrollElement: () => parentRef.current, // ref ổn định, không tạo mới mỗi render
  estimateSize: () => 32, // mọi row 32px — chính xác thì không cần measureElement
  overscan: 5, // thêm 5 dòng mỗi đầu — scroll nhanh đã có sẵn trong DOM
});
