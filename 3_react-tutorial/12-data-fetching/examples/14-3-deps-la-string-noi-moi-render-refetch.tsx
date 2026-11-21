// ✅ ĐÚNG: deps nguyên thủy ổn định, hoặc để queryKey lo
const q = filter.q; // string ổn định
useEffect(() => { fetch(`/api/users?q=${q}`); }, [q]);
// TanStack: useQuery({ queryKey: ["users", { q }], queryFn }) — key object được hash ổn định
