import { createBrowserRouter } from "react-router";
const router = createBrowserRouter([
  { path: "/chart", lazy: () => import("./pages/Chart") }, // tự split + Suspense theo route
]);
