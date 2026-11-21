// ✅ ĐÚNG: top-level; điều kiện bên trong hook/effect
const [x] = useState(0);
if (!user) return null;
// Hook nhận cond: function useX(enabled: boolean) { useEffect(() => { if (enabled) {...} }, [enabled]); }
