// ❌ SAI: mutate props — immutability đỏ + compiler skip
function Row({ item }: any) { item.ten = item.ten.trim(); return <li>{item.ten}</li>; }
// ✅ ĐÚNG: thuần — xanh + compiler cache được
function Row({ item }: any) { const ten = item.ten.trim(); return <li>{ten}</li>; }
