// ❌ SAI: HeavyChart là named export — lazy không hiểu
const HeavyChart = lazy(() => import('./HeavyChart'));

// ✅ ĐÚNG: map sang default
const HeavyChart = lazy(() =>
  import('./HeavyChart').then((m) => ({ default: m.HeavyChart })),
);
