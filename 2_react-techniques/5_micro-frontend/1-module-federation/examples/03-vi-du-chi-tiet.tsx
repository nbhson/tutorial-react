// host/src/HostCart.tsx — tải remote lúc runtime + fallback đầy đủ
import { lazy, Suspense } from 'react';
import { ErrorBoundary } from 'react-error-boundary';

// import('shop/Cart') chỉ fetch remoteEntry khi component này render
// @ts-expect-error — type đến từ federation-types khi dev
const RemoteCart = lazy(() => import('shop/Cart'));

export function HostCart() {
  return (
    // Remote lỗi render → không vỡ cả trang, cho phép thử lại
    <ErrorBoundary
      fallbackRender={({ resetErrorBoundary }) => (
        <div role="alert">
          <p>Không tải được giỏ hàng (remote lỗi).</p>
          <button onClick={resetErrorBoundary}>Thử lại</button>
        </div>
      )}
    >
      {/* Suspense: hiện fallback trong lúc fetch remoteEntry + module */}
      <Suspense fallback={<p>Đang tải giỏ hàng…</p>}>
        <RemoteCart />
      </Suspense>
    </ErrorBoundary>
  );
}
