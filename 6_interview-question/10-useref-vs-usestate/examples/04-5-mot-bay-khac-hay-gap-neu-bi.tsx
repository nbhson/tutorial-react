// useRef(x) — giá trị x (đối số) được đánh giá MỖI LẦN RENDER (cùng như mọi đối số hook),
// nhưng React CHỈ GIỮ object ref TỪ LẦN ĐẦU — các lần sau đối số bị bỏ qua.
const ref = useRef(createExpensive()); // ❌ tạo object LẶN mỗi render (lãng phí,
                                        //    và StrictMode gọi 2 lần → 2 object, không "deterministic")
// ✅ ĐÚNG — chỉ "tạo" LẦN ĐẦU:
const ref = useRef<Expensive | null>(null);
if (ref.current === null) ref.current = createExpensive(); // hoặc khởi tạo trong useEffect
