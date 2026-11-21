// ✅ ĐÚNG: copy rồi sort, hoặc dùng bản không mutate ES2023
const sorted = [...todos].sort((a, b) => a.id - b.id);
// Hoặc: const sorted = todos.toSorted((a, b) => a.id - b.id);
