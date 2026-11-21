// ❌ SAI: deps [] mà dùng filter — đổi filter không lọc lại, UI cũ
const v = useMemo(() => items.filter((i) => i.name.includes(filter)), []);
// ✅ ĐÚNG: deps đủ — hay hơn để Compiler tự làm nếu tuân rules
const v = useMemo(() => items.filter((i) => i.name.includes(filter)), [items, filter]);
