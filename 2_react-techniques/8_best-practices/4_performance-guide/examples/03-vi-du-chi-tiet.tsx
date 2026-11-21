// Lazy route — mirror từ README gốc: bundle từng trang riêng, tải khi truy cập
import { lazy, Suspense } from 'react';

// Vì sao lazy ở đây: Checkout/Orders nặng, ít vào cùng lúc — First Load không gánh cả hai
const CheckoutPage = lazy(() => import('./pages/Checkout'));
const OrdersPage = lazy(() => import('./pages/Orders'));

// Trong router: bọc Suspense, fallback skeleton nhẹ (không spinner nhỏ gây nhảy layout)
export function RouteFallback() {
  return (
    <Suspense fallback={<div>Đang tải trang…</div>}>
      <CheckoutPage />
    </Suspense>
  );
}
