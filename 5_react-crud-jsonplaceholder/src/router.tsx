// Router v7 (DAY 14) + lazy/Suspense (DAY 13 + nhóm 1_advanced-features).
// - Route detail lazy để tách chunk; fallback Suspense rõ ràng.
// - Layout bọc ErrorBoundary ở App (nhóm 8), ở đây chỉ khai báo cây route.

import { Suspense, lazy } from "react";
import { createBrowserRouter } from "react-router-dom";
import Layout from "./pages/Layout";
import PostsPage from "./pages/PostsPage";

const PostDetailPage = lazy(() => import("./pages/PostDetailPage"));

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      { index: true, element: <PostsPage /> },
      {
        path: "posts/:id",
        element: (
          <Suspense fallback={<p>Đang tải trang chi tiết...</p>}>
            <PostDetailPage />
          </Suspense>
        ),
      },
    ],
  },
]);
