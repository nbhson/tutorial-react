// example.tsx đúng: Boundary NGOÀI, Suspense TRONG
<ErrorBoundary fallback={<p>Tải thất bại, thử lại.</p>}>
  <Suspense fallback={<p>Đang tải biểu đồ...</p>}>
    <HeavyChart />
  </Suspense>
</ErrorBoundary>
// Đảo lại (Suspense ngoài Boundary trong) là sai: lỗi từ lazy ném qua Suspense (không bắt)
// trồi lên trên, trang trắng. Nhớ: pending -> Suspense, error -> Boundary ngoài.
