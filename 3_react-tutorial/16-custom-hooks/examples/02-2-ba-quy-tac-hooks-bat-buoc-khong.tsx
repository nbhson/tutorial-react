// ❌ SAI: hook trong điều kiện — user đổi là số hook đổi
if (user) { const [x] = useState(0); }

// ✅ ĐÚNG: hook top-level, điều kiện sau/bên trong
const [x] = useState(0);
if (!user) return null;
// Hoặc điều kiện BÊN TRONG hook: function useX(cond: boolean) { useEffect(..., [cond]); }
