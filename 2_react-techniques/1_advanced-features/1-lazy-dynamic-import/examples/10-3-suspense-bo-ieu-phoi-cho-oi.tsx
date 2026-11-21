// ❌ SAI: quên Suspense — runtime ném lỗi
<HeavyChart /> // Error: A component suspended while responding to synchronous input.

// ✅ ĐÚNG: luôn bọc Suspense, có thể bọc chung ở cấp route
<Suspense fallback={<p>Đang tải…</p>}>
  <HeavyChart />
</Suspense>
