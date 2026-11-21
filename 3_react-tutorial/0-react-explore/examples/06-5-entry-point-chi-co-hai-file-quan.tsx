// src/main.tsx — chỉ lo mount, không chứa UI nghiệp vụ
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App"; // import default — khớp export default ở App.tsx

createRoot(document.getElementById("root")!).render(
  <StrictMode><App /></StrictMode>
);
