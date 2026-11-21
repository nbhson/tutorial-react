// ❌ SAI: onClick mới mỗi lần — Row memo so props luôn khác
{list.map((i) => <Row key={i.id} item={i} onChon={() => chon(i.id)} />)}
// ✅ ĐÚNG: useCallback ổn định (hoặc Compiler lo) + Row memo mới có tác dụng
const chon = useCallback((id: number) => chonThat(id), []);
