import { createBrowserRouter } from "react-router";

// Route lazy: vào /chart lần đầu mới tải chunk ChartPage, Router tự chờ + bắt lỗi
const router = createBrowserRouter([
  {
    path: "/chart",
    lazy: () => import("./pages/Chart"), // module export { Component, loader?, action? }
    // errorElement: <p>Không tải được trang.</p>, // bắt lỗi chunk/loader ở tầng route
  },
]);
