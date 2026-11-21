// Vite thấy import() động → tách file thành chunk riêng; index chỉ còn shell
import { lazy, Suspense } from "react";

const ChartPage = lazy(() => import("./pages/Chart")); // Chart-[hash].js riêng

<Suspense fallback={<p>Đang tải…</p>}>
  <ChartPage />
</Suspense>
