// example.tsx — DAY 13: lazy + Suspense + ErrorBoundary + prefetch (khớp README)
// Mục đích: chunk nặng chỉ tải khi cần; fallback chờ; boundary bắt lỗi tải; hover tải trước.
import { Suspense, lazy, useState } from "react"; // (1) lazy tách chunk, Suspense khai UI chờ
import { ErrorBoundary } from "react-error-boundary"; // (2) Bắt lỗi tải chunk (Suspense chỉ bắt pending, không bắt error)

// (3) Demo: thay Promise.resolve bằng import("./HeavyChart") thật.
// lazy yêu cầu callback trả { default: Component } — import() trả module, lazy lấy .default.
const HeavyChart = lazy(() =>
  Promise.resolve({ default: () => <div>Biểu đồ nặng (chunk riêng)</div> })
);
// Prod thật: const HeavyChart = lazy(() => import("./HeavyChart"));
// - Vite thấy import("./HeavyChart") -> tách HeavyChart-[hash].js riêng, index nhẹ.
// - Chưa render là chưa tải; lần đầu render mới tải; sau đó cache, remount không tải lại.

// (4) Preload helper: gọi import() sớm (hover/idle), lazy dùng lại cache khi render thật.
const preloadChart = () => import("./example"); // demo trỏ lại file này; thật là import("./HeavyChart")

export default function App() {
  const [show, setShow] = useState(false); // (5) Điều kiện mount — chunk chỉ yêu cầu khi show true (nếu chưa preload)
  return (
    <>
      <button
        // (6) Prefetch: hover là tải trước chunk — click sau không chờ lâu. Gọi trong event, không mỗi render.
        onMouseEnter={preloadChart}
        onFocus={preloadChart} // keyboard focus cũng preload (a11y, không chỉ chuột)
        onClick={() => setShow(true)}
      >
        Mở biểu đồ
      </button>
      {/* (7) Render có điều kiện (DAY 2): chỉ mount Suspense khi mở */}
      {show && (
        // (8) ErrorBoundary NGOÀI Suspense: lỗi tải chunk (mất mạng) ném lên, boundary bắt -> fallback lỗi.
        // Đảo lại (Suspense ngoài) là sai: Suspense không bắt error, lỗi trồi qua, trang trắng.
        <ErrorBoundary fallback={<p>Tải thất bại, thử lại.</p>}>
          {/* (9) Suspense fallback nhỏ (spinner dòng) — chunk về thì thay bằng HeavyChart thật */}
          <Suspense fallback={<p>Đang tải biểu đồ...</p>}>
            <HeavyChart />
          </Suspense>
        </ErrorBoundary>
      )}
    </>
  );
}

// Ghi chú route-level (DAY 14, không chạy ở đây):
// const router = createBrowserRouter([{ path: "/chart", lazy: () => import("./pages/Chart") }]);
// Router tự split + Suspense theo route — không viết tay lazy/Suspense mỗi trang.
