// ❌ SAI: HeavyChart là named export nhưng không map — lazy nhận module không có .default
const HeavyChart = lazy(() => import('./HeavyChart')); // render ra undefined, trắng trang

// ✅ ĐÚNG: map named export sang default
const HeavyChart = lazy(() =>
  import('./HeavyChart').then((m) => ({ default: m.HeavyChart })),
);
