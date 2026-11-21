// ĐÚNG: lazy ở module scope, prefetch trong event, boundary có resetKeys
import { Suspense, lazy, useState } from "react";
import { ErrorBoundary } from "react-error-boundary";

// Khai một lần ngoài component: promise ổn định, không remount oan
const HeavyChart = lazy(() =>
  Promise.resolve({ default: () => <div>Biểu đồ nặng (chunk riêng)</div> })
);
const preload = () => import("./example"); // helper prefetch dùng lại cache

function App() {
  const [show, setShow] = useState(false); // mở/tắt biểu đồ
  return (
    <>
      {/* Prefetch khi hover, mở khi click: 2 hành động tách bạch */}
      <button onMouseEnter={preload} onClick={() => setShow(true)}>Mở biểu đồ</button>
      {show && (
        <ErrorBoundary fallback={<p>Tải thất bại, thử lại.</p>}>
          <Suspense fallback={<p>Đang tải...</p>}>
            <HeavyChart />
          </Suspense>
        </ErrorBoundary>
      )}
    </>
  );
}
