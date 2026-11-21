// ❌ SAI: sửa mảng state gốc tại chỗ — cùng tham chiếu, React không phát hiện
const sorted = todos.sort((a, b) => a.id - b.id);
