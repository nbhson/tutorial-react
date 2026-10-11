// example.tsx — DAY 0: entry tối giản (chạy với Vite + React 19)
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

function App() {
  return <h1>Hello React 19 + Vite!</h1>;
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);

export default App;
