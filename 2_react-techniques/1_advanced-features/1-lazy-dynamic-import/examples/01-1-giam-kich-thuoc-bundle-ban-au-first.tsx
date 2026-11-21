// ✅ ĐÚNG: route nặng tách thành chunk riêng — main bundle nhẹ đi trông thấy
import { lazy } from 'react';
// Vite thấy import('./pages/ReportsPage') → sinh file reports-abc123.js riêng
const ReportsPage = lazy(() => import('./pages/ReportsPage'));
