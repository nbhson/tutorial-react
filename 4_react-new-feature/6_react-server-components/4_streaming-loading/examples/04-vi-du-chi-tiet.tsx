// app/dashboard/page.tsx — SERVER COMPONENT
type Sale = { id: string; total: number };

async function getRevenue() {
  await new Promise((r) => setTimeout(r, 200)); // nhanh — vào shell
  return { revenue: 52_400_000, orders: 131 };
}

async function getSlowChart() {
  await new Promise((r) => setTimeout(r, 2500)); // chậm — stream sau
  return [{ day: "T2", value: 12 }, { day: "T3", value: 19 }];
}

// Vùng nhanh: KHÔNG bọc Suspense — render cùng shell, hiện ngay
async function Revenue() {
  const sales = await fetchSales(); // ~200ms, nằm trong shell
  return <p>Doanh thu: {sales.revenue.toLocaleString("vi-VN")}đ</p>;
}

// Vùng chậm: bọc Suspense thủ công — chỉ vùng này fallback + stream sau
async function SlowChart() {
  const series = await getWeeklySales(); // 2s
  return <Chart data={series} />;
}

export default function DashboardPage() {
  return (
    <section>
      <h1>Dashboard</h1>
      <Suspense fallback={<ChartSkeleton />}>
        <SlowChart />            {/* chậm — stream sau, không chặn phần trên */}
      </Suspense>
      <Suspense fallback={<TableSkeleton />}>
        <RecentOrders />          {/* stream theo lượt xong của nó */}
      </Suspense>
    </div>
  );
}
