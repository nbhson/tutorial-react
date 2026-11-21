// ✅ ĐÚNG: mảng mới (Zustand thường) hoặc Immer (RTK cho phép push nhưng kết quả bất biến)
add: (item) => set((s) => ({ items: [...s.items, item] }))
// RTK: add: (s, a) => { s.items.push(a.payload); } // Immer biến thành bất biến giúp bạn
