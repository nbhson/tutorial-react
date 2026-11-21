// (1) THAM CHIẾU DOM (focus, scroll, đo kích thước) — ĐỌC trong effect/event, KHÔNG đọc trong render
const inputRef = useRef<HTMLInputElement>(null);
useEffect(() => { inputRef.current?.focus(); }, []); // ✅ an toàn (sau mount)
// ❌ const h = inputRef.current?.clientHeight; // trong render → null / giá trị cũ

// (2) GIÁ TRỊ GIỮA CÁC LẦN RENDER (timer id, "lần chạy" để tránh trùng)
const idRef = useRef<number | undefined>(undefined); // interval id
// Dùng useState giữ id → mỗi lần set id (re-render) tạo timer MỚI → loop (đáng "ăn điểm")
// Dùng useRef → "im lặng", không re-render, không loop

// (3) CHUYỂN DỮ LIỆU SỰ KIỆN (giá trị "cũ" cần so với "mới")
function usePrevious<T>(value: T) {
  const ref = useRef<T>(); // giữ giá trị render TRƯỚC
  useEffect(() => { ref.current = value; }, [value]); // cập nhật sau render (đúng "lúc này")
  return ref.current; // trả giá trị "trước" (rất hay dùng cho animation "giá trị mới - giá trị cũ")
}
