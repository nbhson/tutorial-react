// example.tsx — DAY 13: lazy + Suspense
import { Suspense, lazy, useState } from "react";
import { ErrorBoundary } from "react-error-boundary";

// Demo: thay "./HeavyChart" bằng component nặng thật (chart/editor)
const HeavyChart = lazy(() =>
  Promise.resolve({ default: () => <div>Biểu đồ nặng (chunk riêng)</div> })
);

export default function App() {
  const [show, setShow] = useState(false);
  return (
    <>
      <button
        onMouseEnter={() => import("./example")}
        onClick={() => setShow(true)}
      >
        Mở biểu đồ
      </button>
      {show && (
        <ErrorBoundary fallback={<p>Tải thất bại, thử lại.</p>}>
          <Suspense fallback={<p>Đang tải biểu đồ...</p>}>
            <HeavyChart />
          </Suspense>
        </ErrorBoundary>
      )}
    </>
  );
}
