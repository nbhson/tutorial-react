// ❌ SAI: import tĩnh nhét toàn bộ ReportsPage + thư viện chart vào main bundle
import ReportsPage from './pages/ReportsPage'; // dù user ở /login vẫn phải tải

// ✅ ĐÚNG: chuyển sang lazy để ReportsPage nằm chunk riêng
import { lazy } from 'react';
const ReportsPage = lazy(() => import('./pages/ReportsPage'));
