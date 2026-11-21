// ❌ SAI: push giữ tham chiếu — subscriber tưởng không đổi
add: (item) => set((s) => { s.items.push(item); return s; })
