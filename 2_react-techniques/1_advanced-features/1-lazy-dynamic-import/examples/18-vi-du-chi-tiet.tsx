// Route-level: mỗi page một chunk — tải khi điều hướng tới
import { lazy, Suspense } from 'react';

// Dashboard là default export nên không cần .then map
const Dashboard = lazy(() => import('./pages/Dashboard'));
// Reports nặng hơn, cũng tách riêng
const Reports = lazy(() => import('./pages/Reports'));

export function AppRoutes({ page }: { page: 'dashboard' | 'reports' }) {
  return (
    // Một Suspense chung cho toàn vùng route — skeleton toàn trang
    <Suspense fallback={<p>Đang tải trang…</p>}>
      {page === 'dashboard' ? <Dashboard /> : <Reports />}
    </Suspense>
  );
}

// Prefetch khi hover link — chunk về trước khi bấm
export function NavLink() {
  return (
    <a
      href="/reports"
      onMouseEnter={() => import('./pages/Reports')}
      onFocus={() => import('./pages/Reports')}
    >
      Báo cáo
    </a>
  );
}
