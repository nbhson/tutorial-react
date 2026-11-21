// remote/CartApp.tsx — nhận basePath từ host, dùng memory router (không tranh URL)
import { RouterProvider, createMemoryRouter } from 'react-router-dom';

// Vì sao memory: lịch sử ảo trong JS — Back/refresh/URL thật do host giữ, remote không đụng
const routes = [
  { path: '/', element: <CartList /> },
  { path: '/checkout', element: <Checkout /> },
];

export function RemoteApp({ basePath }: { basePath: string }) {
  // initialEntries: remote biết mình đang ở "thư mục" nào trong URL host (ví dụ /shop/checkout)
  const router = createMemoryRouter(routes, { initialEntries: [basePath] });
  return <RouterProvider router={router} />;
}
