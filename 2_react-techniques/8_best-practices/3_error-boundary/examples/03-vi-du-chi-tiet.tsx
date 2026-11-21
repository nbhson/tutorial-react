// Route error (React Router) — loader/action fail hiện 1 UI, không vỡ app
import { createBrowserRouter } from 'react-router-dom';

export const router = createBrowserRouter([
  {
    path: '/',
    loader: async () => loadDashboard(), // ném lỗi nếu API fail
    errorElement: <DashboardError />,    // fallback cho loader/action/render của route
  },
]);
