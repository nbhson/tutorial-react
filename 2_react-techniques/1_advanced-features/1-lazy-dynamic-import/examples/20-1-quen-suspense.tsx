// ❌ SAI: lazy mà không có Suspense — crash
const Reports = lazy(() => import('./Reports'));
export function App() { return <Reports />; }

// ✅ ĐÚNG: luôn bọc Suspense, có thể bọc chung ở cấp route
export function App() {
  return (
    <Suspense fallback={<p>Đang tải…</p>}>
      <Reports />
    </Suspense>
  );
}
