<Suspense fallback={<p>Đang tải biểu đồ...</p>}>
  <HeavyChart />
</Suspense>
// Fallback nhỏ (spinner dòng) — to quá sẽ "nháy" khi tải nhanh (100ms cũng hiện rồi mất)
