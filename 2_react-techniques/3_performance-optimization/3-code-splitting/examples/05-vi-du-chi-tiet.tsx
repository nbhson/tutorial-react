// example.tsx — mirror đầy đủ, khớp từng dòng với file thật
import { lazy, Suspense } from 'react';

// Mỗi page thành 1 chunk riêng, tải khi điều hướng tới
// Vì sao 2 dòng này là tách: import() đường dẫn tĩnh → Rollup sinh analytics-*.js, editor-*.js riêng
const Analytics = lazy(() => import('./AnalyticsPage'));
const Editor = lazy(() => import('./EditorPage'));

export function Routes({ page }: { page: 'analytics' | 'editor' }) {
  return (
    // Suspense bọc cả 2: fallback chung cho toàn vùng route — tải chunk nào cũng hiện một skeleton
    <Suspense fallback={<p>Đang tải trang…</p>}>
      {/* chỉ mount 1 page tương ứng — chunk kia không hề tải (kiểm chứng ở Network) */}
      {page === 'analytics' ? <Analytics /> : <Editor />}
    </Suspense>
  );
}
