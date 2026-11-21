// ✅ ĐÚNG: màn hình đầu (Home) import tĩnh — vào ngay; Reports lazy — tải sau
import HomePage from './pages/HomePage'; // cốt lõi, giữ trong main bundle
const ReportsPage = lazy(() => import('./pages/ReportsPage')); // phần còn lại tải trễ
