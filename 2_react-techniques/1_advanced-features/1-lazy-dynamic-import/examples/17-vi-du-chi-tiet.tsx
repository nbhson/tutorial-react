// example.tsx — mirror đầy đủ, khớp từng dòng với file thật
import { lazy, Suspense, useState } from 'react';

// lazy() nhận factory trả về Promise của module.
// HeavyChart là named export nên phải map sang { default: m.HeavyChart }.
// Vì sao: lazy chỉ đọc module.default — không map là render undefined.
const HeavyChart = lazy(() =>
  import('./HeavyChart').then((m) => ({ default: m.HeavyChart })),
);

export function LazyDemo() {
  // show quyết định component có được mount không.
  // Vì sao: chunk chỉ bắt đầu tải khi show === true — trước đó bundle đầu nhẹ.
  const [show, setShow] = useState(false);
  return (
    <div>
      {/* Chỉ khi bấm nút, lazy component mới bắt đầu tải chunk */}
      <button onClick={() => setShow(true)}>Mở biểu đồ</button>
      {show && (
        // Suspense bắt buộc: vẽ fallback trong lúc chunk đang tải.
        // Nếu thiếu, React ném lỗi "suspended while responding to synchronous input".
        <Suspense fallback={<p>Đang tải biểu đồ…</p>}>
          <HeavyChart />
        </Suspense>
      )}
    </div>
  );
}
