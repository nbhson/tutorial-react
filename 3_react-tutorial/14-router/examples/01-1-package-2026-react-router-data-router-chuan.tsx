// Chuẩn v7 (example.tsx): object, không JSX lồng
const router = createBrowserRouter([
  { element: <Layout />, errorElement: <p>Lỗi chung</p>, children: [
    { index: true, element: <Home /> },
    { path: "users/:id", element: <UserPage />, loader: fetchUser, errorElement: <p>404</p> },
  ]},
]);
export default function App() { return <RouterProvider router={router} />; }
