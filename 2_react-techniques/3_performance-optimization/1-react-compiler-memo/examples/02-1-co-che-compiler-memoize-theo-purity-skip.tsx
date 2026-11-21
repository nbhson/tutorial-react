// ❌ SAI: mutate props — Compiler skip, mất tối ưu (và eslint báo đỏ)
function Row({ item }: any) { item.ten = item.ten.trim(); return <li>{item.ten}</li>; }
// ✅ ĐÚNG: thuần — Compiler cache được
function Row({ item }: any) { const ten = item.ten.trim(); return <li>{ten}</li>; }
