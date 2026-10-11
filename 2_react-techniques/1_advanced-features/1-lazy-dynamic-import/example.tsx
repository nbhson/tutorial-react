import { lazy, Suspense, useState } from 'react';

const HeavyChart = lazy(() =>
  import('./HeavyChart').then((m) => ({ default: m.HeavyChart })),
);

export function LazyDemo() {
  const [show, setShow] = useState(false);
  return (
    <div>
      <button onClick={() => setShow(true)}>Mở biểu đồ</button>
      {show && (
        <Suspense fallback={<p>Đang tải biểu đồ…</p>}>
          <HeavyChart />
        </Suspense>
      )}
    </div>
  );
}
