// main.tsx minh họa việc "tự lắp ghép": thứ tự bọc Provider do BẠN quyết,
// không có NgModule nào tự sắp xếp giúp.
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router"; // mảnh router
import { QueryClientProvider } from "@tanstack/react-query"; // mảnh data
import App from "./App";

// Quy tắc: Provider nào bị phụ thuộc thì bọc NGOÀI (ví dụ Router ngoài để
// mọi trang đều đọc được URL; QueryClient ngoài để mọi trang dùng cache).
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </BrowserRouter>
  </StrictMode>
);
