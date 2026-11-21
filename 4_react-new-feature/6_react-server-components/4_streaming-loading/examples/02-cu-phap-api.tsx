// app/dashboard/page.tsx — Server Component async, stream thủ công theo vùng
import { Suspense } from "react";

export default function DashboardPage() {
  return (
    <div>
      <h1>Dashboard</h1>
      {/* Vùng nhanh — render cùng shell */}
      <Revenue />
      {/* Vùng chậm — stream sau, fallback hiện trước */}
      <Suspense fallback={<ChartSkeleton />}>
        <SlowChart /> {/* async component, await 2s */}
      </Suspense>
      <Suspense fallback={<TableSkeleton />}>
        <RecentOrders />
      </Suspense>
    </div>
  );
}
