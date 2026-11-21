import { lazy } from 'react';

// ✅ ĐÚNG với default export: không cần map
const Dashboard = lazy(() => import('./pages/Dashboard'));

// ✅ ĐÚNG với named export: bọc sang { default: ... }
const HeavyChart = lazy(() =>
  import('./HeavyChart').then((m) => ({ default: m.HeavyChart })),
);
