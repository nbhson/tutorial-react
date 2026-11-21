// ❌ SAI: file export function Chart (named), lazy lấy .default -> undefined, render trắng
// HeavyChart.tsx: export function Chart() {...}
const Heavy = lazy(() => import("./HeavyChart"));
