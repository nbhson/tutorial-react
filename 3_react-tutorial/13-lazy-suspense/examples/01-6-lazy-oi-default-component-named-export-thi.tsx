import { lazy } from "react";

// File HeavyChart.tsx chỉ có named export: export function HeavyChart() {...}
// Adapter: gói named export thành default để lazy hiểu được
const HeavyChart = lazy(() =>
  import("./HeavyChart").then((m) => ({ default: m.HeavyChart }))
);
