// ❌ SAI: object literal mới mỗi lần — Object.is luôn khác
const { a, b } = useCart((s) => ({ a: s.a, b: s.b }));
