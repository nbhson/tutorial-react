// ❌ SAI: chỉ có Suspense — lỗi network không ai bắt
<Suspense fallback={<p>Đang tải…</p>}><Reports /></Suspense>

// ✅ ĐÚNG: ErrorBoundary ngoài cùng với nút Thử lại
<ErrorBoundary fallback={<div>Tải lỗi. <button onClick={() => location.reload()}>Thử lại</button></div>}>
  <Suspense fallback={<p>Đang tải…</p>}><Reports /></Suspense>
</ErrorBoundary>
