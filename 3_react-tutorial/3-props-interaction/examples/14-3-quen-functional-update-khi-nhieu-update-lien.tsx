// ❌ SAI: bấm 1 lần gọi 2 set nhưng chỉ tăng 1 (cùng đọc count cũ)
const handleDouble = () => { setCount(count + 1); setCount(count + 1); };
