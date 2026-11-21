// ✅ ĐÚNG: đọc trực tiếp qua hook; state chỉ cho giá trị cục bộ (filter text, input)
const items = useCartStore((s) => s); // dùng thẳng, không copy vào state
