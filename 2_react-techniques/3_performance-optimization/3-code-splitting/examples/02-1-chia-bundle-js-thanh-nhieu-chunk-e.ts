// ❌ SAI: không tách — recharts 500KB nằm trong index.js, login cũng phải tải
import { BarChart } from 'recharts'; // import tĩnh ở file dùng chung → gộp vào main
// ✅ ĐÚNG: route analytics lazy + chart-vendor riêng — login không dính chart
const Analytics = lazy(() => import('./AnalyticsPage')); // + manualChunks chart-vendor
