// ❌ SAI: lazy trong render — mỗi render reset
function Comp() { const X = lazy(() => import('./X')); return <X />; }
// ✅ ĐÚNG: lazy ở module scope — factory ổn định
const X = lazy(() => import('./X'));
function Comp() { return <X />; }
