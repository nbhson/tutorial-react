// ✅ ĐÚNG: nguồn ổn định (state/props/memo) + bất biến, hoặc bỏ memo khi rẻ (Compiler lo)
const [rows] = useState([120000, 45000, 89000]);
const total = useMemo(() => rows.reduce((a, b) => a + b, 0), [rows]);
// Hoặc rẻ thì: const total = rows.reduce((a, b) => a + b, 0); // Compiler memo giúp
