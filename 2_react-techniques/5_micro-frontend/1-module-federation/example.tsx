import { lazy, Suspense } from 'react';
import { ErrorBoundary } from 'react-error-boundary';

// Remote 'shop/Cart' do team khác expose — host chỉ cần tên + lúc runtime mới tải
const RemoteCart = lazy(() => import('shop/Cart'));

export function HostCart() {
  return (
    <ErrorBoundary fallback={<p>Không tải được giỏ hàng (remote lỗi).</p>}>
      <Suspense fallback={<p>Đang tải giỏ hàng…</p>}>
        <RemoteCart />
      </Suspense>
    </ErrorBoundary>
  );
}
