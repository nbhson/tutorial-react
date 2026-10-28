// Demo streaming + loading.js + Suspense per-route (self-contained, client-safe).
// Trong Next.js App Router thật: các hàm get* chạy trên server (async component),
// `await` đẩy vào component con bọc <Suspense> để shell stream ngay, vùng chậm stream sau.
// File này mô phỏng bằng delay + cấu trúc JSX giống hệt để đọc/so sánh.

import { Suspense, useState, useEffect, type CSSProperties } from "react";

type Sale = { id: string; total: number };
type ChartPoint = { day: string; value: number };

// ── Giả lập fetch dữ liệu (trên server thật: db.query() / fetch()) ──
async function fetchSales(): Promise<Sale[]> {
  await new Promise((r) => setTimeout(r, 200)); // nhanh — nằm trong shell
  return [
    { id: "o1", total: 1_200_000 },
    { id: "o2", total: 890_000 },
  ];
}

async function fetchWeeklySales(): Promise<ChartPoint[]> {
  await new Promise((r) => setTimeout(r, 2500)); // chậm — stream sau
  return [
    { day: "T2", value: 12 },
    { day: "T3", value: 19 },
    { day: "T4", value: 8 },
  ];
}

// ── Skeletons (fallback) ──
function ChartSkeleton() {
  return (
    <div style={box}>
      <p style={muted}>Đang tải biểu đồ... (fallback của Suspense chậm)</p>
    </div>
  );
}

function TableSkeleton() {
  return (
    <div style={box}>
      <p style={muted}>Đang tải đơn hàng...</p>
    </div>
  );
}

// ── Vùng NHANH: không bọc Suspense — render cùng shell, hiện ngay ──
// (Trong App Router thật: async Server Component; ở đây dùng effect để mô phỏng trên client.)
function Revenue() {
  const [sales, setSales] = useState<Sale[] | null>(null);
  useEffect(() => {
    fetchSales().then(setSales);
  }, []);
  const total = sales?.reduce((s, x) => s + x.total, 0) ?? 0;
  return (
    <div style={box}>
      <strong>Doanh thu hôm nay</strong>
      <p>{sales ? total.toLocaleString("vi-VN") + "đ" : "..."}</p>
    </div>
  );
}

// ── Vùng CHẬM 1: chart — được bọc <Suspense> ở page bên dưới ──
// (Server thật: async function + await fetchWeeklySales() trực tiếp trong body.)
function SlowChart() {
  const [points, setPoints] = useState<ChartPoint[] | null>(null);
  useEffect(() => {
    fetchWeeklySales().then(setPoints);
  }, []);
  return (
    <div style={box}>
      <strong>Biểu đồ tuần (chậm 2.5s)</strong>
      {points ? (
        <ul>
          {points.map((p) => (
            <li key={p.day}>
              {p.day}: {"█".repeat(p.value)} {p.value}đ triệu
            </li>
          ))}
        </ul>
      ) : (
        <p style={muted}>— hole đang chờ stream —</p>
      )}
    </div>
  );
}

// ── Vùng CHẬM 2: bảng đơn hàng ──
function RecentOrders() {
  const [sales, setSales] = useState<Sale[] | null>(null);
  useEffect(() => {
    fetchSales().then(setSales);
  }, []);
  return (
    <div style={box}>
      <strong>Đơn hàng gần đây</strong>
      <ul>
        {(sales ?? []).map((o) => (
          <li key={o.id}>{o.id} — {o.total.toLocaleString("vi-VN")}đ</li>
        ))}
      </ul>
    </div>
  );
}

// ── Page: shell + 2 Suspense theo vùng ──
export default function DashboardPage() {
  return (
    <section>
      <h1>Dashboard — Streaming demo</h1>
      {/* shell: header + vùng nhanh hiện ngay, không chờ chart */}
      <Revenue />
      {/* hole 1: chart chậm — fallback hiện trước, stream thay sau */}
      <Suspense fallback={<ChartSkeleton />}>
        <SlowChart />
      </Suspense>
      {/* hole 2: bảng — stream theo lượt xong của riêng nó */}
      <Suspense fallback={<TableSkeleton />}>
        <RecentOrders />
      </Suspense>
      {/* loading.js của Next bọc CẢ segment này trong 1 Suspense nữa (cấp route) */}
    </section>
  );
}

// ── Ghi chú khi chạy trong Next.js App Router thật ──
// app/dashboard/loading.tsx:
//   export default function Loading() { return <DashboardSkeleton />; }
// → Next bọc page.tsx trong <Suspense fallback={<Loading/>}>; file loading.js
//   chỉ áp dụng cho segment /dashboard, không ảnh hưởng segment anh em.
//
// Flow thật trên server:
//   1. shell (layout + header + Revenue) render xong → gửi HTML đợt 1 (TTFB nhanh)
//   2. SlowChart await 2.5s → hole giữ skeleton
//   3. data xong → stream HTML + RSC payload thay fallback, không reload trang.

const box: CSSProperties = {
  border: "1px solid #ddd",
  borderRadius: 8,
  padding: 12,
  marginBottom: 12,
};
const muted: CSSProperties = { color: "#888" };
