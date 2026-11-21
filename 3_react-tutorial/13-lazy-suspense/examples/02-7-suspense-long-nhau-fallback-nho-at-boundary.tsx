import { Suspense, lazy } from "react";

const HeavyChart = lazy(() =>
  Promise.resolve({ default: () => <div>Biểu đồ nặng (chunk riêng)</div> })
);

function Dashboard() {
  return (
    <div>
      <h1>Tổng quan (luôn hiện, không bị fallback nuốt)</h1>
      {/* Suspense nhỏ ôm sát widget lazy: chỉ vùng này chờ, trang còn lại yên */}
      <Suspense fallback={<p>Đang tải biểu đồ...</p>}>
        <HeavyChart />
      </Suspense>
    </div>
  );
}
