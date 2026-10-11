import { QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "react-router-dom";
import { queryClient } from "./lib/queryClient";
import { router } from "./router";
import ErrorBoundary from "./components/ErrorBoundary";
import "./App.css";

// App giờ chỉ là composition root (nhóm 2_architecture):
// QueryClientProvider (server state) -> ErrorBoundary (nhóm 8) -> Router (DAY 14).
export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <RouterProvider router={router} />
      </ErrorBoundary>
    </QueryClientProvider>
  );
}
