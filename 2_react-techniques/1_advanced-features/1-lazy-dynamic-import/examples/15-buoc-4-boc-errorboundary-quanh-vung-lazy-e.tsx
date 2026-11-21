// ✅ ĐÚNG: ErrorBoundary ngoài Suspense để bắt lỗi tải chunk
<ErrorBoundary fallback={<p>Tải lỗi. <button onClick={() => location.reload()}>Thử lại</button></p>}>
  <Suspense fallback={<p>Đang tải…</p>}>
    <ReportsPage />
  </Suspense>
</ErrorBoundary>
