// ✅ ĐÚNG: map sang default, hoặc đổi file sang export default
const Heavy = lazy(() => import("./HeavyChart").then((m) => ({ default: m.Chart })));
// Tốt nhất: // HeavyChart.tsx: export default function HeavyChart() {...}
