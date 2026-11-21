// ❌ SAI
items.forEach((it, i) => { const [v, setV] = useState(it); }); // 1 hook × n

// ✅ ĐÚNG: 1 state duy nhất giữ mảng
const [vals, setVals] = useState(items.map((i) => i));
