// ✅ ĐÚNG: selector nhỏ — chỉ lát đổi mới render
const count = useCart((s) => s.items.length);
const items = useCart((s) => s.items);
