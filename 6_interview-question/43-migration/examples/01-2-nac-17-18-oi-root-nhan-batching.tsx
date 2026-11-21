// ❌ 17: API cũ — lên 18 vẫn chạy nhưng mất concurrent + warning
import ReactDOM from "react-dom";
ReactDOM.render(<App />, document.getElementById("root"));

// ✅ 18+: root mới là bắt buộc
import { createRoot } from "react-dom/client";
createRoot(document.getElementById("root")!).render(<App />);
