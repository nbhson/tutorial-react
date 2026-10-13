import { lazy, Suspense } from 'react';

// Mỗi page thành 1 chunk riêng, tải khi điều hướng tới
const Analytics = lazy(() => import('./AnalyticsPage'));
const Editor = lazy(() => import('./EditorPage'));

export function Routes({ page }: { page: 'analytics' | 'editor' }) {
  return (
    <Suspense fallback={<p>Đang tải trang…</p>}>
      {page === 'analytics' ? <Analytics /> : <Editor />}
    </Suspense>
  );
}
