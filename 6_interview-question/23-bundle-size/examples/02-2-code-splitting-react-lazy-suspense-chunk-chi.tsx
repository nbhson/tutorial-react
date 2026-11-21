const router = createBrowserRouter([
  { path: "/chart", lazy: () => import("./pages/Chart") }, // Router tự split + Suspense
]);
