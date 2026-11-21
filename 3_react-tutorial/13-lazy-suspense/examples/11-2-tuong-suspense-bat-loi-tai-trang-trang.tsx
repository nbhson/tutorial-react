// ✅ ĐÚNG: Boundary NGOÀI Suspense (như example)
<ErrorBoundary fallback={<p>Tải thất bại, thử lại.</p>}>
  <Suspense fallback={<p>Chờ...</p>}><Heavy /></Suspense>
</ErrorBoundary>
