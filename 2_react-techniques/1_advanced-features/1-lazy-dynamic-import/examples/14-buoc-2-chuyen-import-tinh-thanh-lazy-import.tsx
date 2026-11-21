// ❌ SAI: lazy nhưng quên Suspense — crash runtime
const Reports = lazy(() => import('./ReportsPage'));
<Reports /> // lỗi suspended without Suspense

// ✅ ĐÚNG: lazy + Suspense đi đôi
<Suspense fallback={<p>Đang tải báo cáo…</p>}>
  <Reports />
</Suspense>
