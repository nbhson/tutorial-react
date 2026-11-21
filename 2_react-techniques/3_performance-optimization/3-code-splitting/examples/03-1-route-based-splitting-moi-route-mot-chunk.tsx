// ✅ ĐÚNG: mỗi page một chunk — chunk nào chỉ tải khi page đó mount
import { lazy, Suspense } from 'react';
const Analytics = lazy(() => import('./AnalyticsPage')); // chunk analytics riêng
const Editor = lazy(() => import('./EditorPage')); // chunk editor riêng
