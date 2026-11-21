// ❌ SAI: object mới mỗi lần — re-render dù a, b không đổi
const { a, b } = useUi((s) => ({ a: s.a, b: s.b }));

// ✅ ĐÚNG: bọc useShallow
const { a, b } = useUi(useShallow((s) => ({ a: s.a, b: s.b })));
