// ❌ SAI: đẩy trực tiếp vào mảng state — mutate, Compiler bỏ qua
items.push(moi); setItems(items);
// ✅ ĐÚNG: bản sao — Compiler cache được, React phát hiện đổi
setItems([...items, moi]);
