// ❌ SAI: cùng tham chiếu, React bỏ qua (hoặc thấy nửa vời)
setItems((xs) => { const [m] = xs.splice(from, 1); xs.splice(to, 0, m); return xs; });
