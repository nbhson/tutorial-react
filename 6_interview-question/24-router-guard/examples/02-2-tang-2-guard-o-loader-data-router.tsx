// router.ts — Data Router (React Router v7 framework/library mode)
import { redirect } from "react-router-dom";

export const router = createBrowserRouter([
  {
    path: "/",
    // root loader: fetch /api/me MỘT LẦN — cả app đọc lại (useRouteLoaderData('root'))
    loader: async () => {
      const r = await fetch("/api/me", { headers: authHeader() });
      if (r.status === 401) return redirect("/login");
      return r.json(); // { roles: [...] }
    },
    children: [
      {
        path: "admin",
        loader: async ({ request }) => {
          const me = useRouteLoaderData("root");      // đọc cache, không fetch lại
          if (!me?.roles?.includes("admin")) return redirect("/403");
          return null;
        },
        element: <AdminPage />,
        errorElement: <NotFound />,
      },
    ],
  },
]);
