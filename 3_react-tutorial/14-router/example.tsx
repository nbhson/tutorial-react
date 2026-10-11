// example.tsx — DAY 14: router tối giản (cần npm i react-router)
import {
  createBrowserRouter,
  Link,
  Outlet,
  RouterProvider,
  useParams,
} from "react-router";

function Layout() {
  return (
    <div>
      <nav>
        <Link to="/">Home</Link> | <Link to="/users/1">User 1</Link>
      </nav>
      <Outlet />
    </div>
  );
}

function UserPage() {
  const { id } = useParams();
  return <p>Trang user #{id}</p>;
}

const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { index: true, element: <h1>Home</h1> },
      { path: "users/:id", element: <UserPage /> },
    ],
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
