// example.tsx — DAY 7: ThemeContext + useTheme() guard + Provider lồng
// Mục đích: truyền dữ liệu xuyên tầng không drilling — Provider cấp, useTheme đọc.
import { createContext, useContext, useState, type ReactNode } from "react"; // (1) Ba mảnh: tạo, đọc, giữ state

type Theme = "light" | "dark"; // (2) Union chặn giá trị lạ — chỉ 2 theme hợp lệ

// (3) Tạo context; default null để ÉP kiểm tra scope (không default giả che lỗi).
const ThemeCtx = createContext<{ theme: Theme; toggle: () => void } | null>(null);

// (4) Custom hook đọc — ném lỗi nếu dùng ngoài Provider. Consumer chỉ thấy { theme, toggle }.
function useTheme() {
  const ctx = useContext(ThemeCtx); // đọc từ Provider GẦN NHẤT trong cây
  if (!ctx) throw new Error("useTheme cần <ThemeProvider>"); // lộ lỗi scope sớm
  return ctx;
}

// (5) Provider: giữ state + bọc subtree. Hai Provider = 2 state độc lập (scoped như Angular providers).
function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light"); // state riêng cho cây con này
  const toggle = () => setTheme((t) => (t === "light" ? "dark" : "light")); // functional update
  // React 19 cũng cho <ThemeCtx value={...}> rút gọn — tương đương Provider
  return <ThemeCtx.Provider value={{ theme, toggle }}>{children}</ThemeCtx.Provider>;
}

// (6) Consumer sâu bao nhiêu tầng cũng đọc được — không cần props trung gian.
function ThemedButton() {
  const { theme, toggle } = useTheme();
  return <button onClick={toggle}>Theme hiện tại: {theme} (bấm để đổi)</button>;
}

// (7) Demo Provider lồng: consumer dưới cùng đọc Provider GẦN NHẤT (override có phạm vi).
function NestedDemo() {
  return (
    <ThemeProvider>
      <ThemedButton /> {/* đọc theme ngoài = light */}
      <ThemeProvider>
        <ThemedButton /> {/* đọc theme trong — state độc lập, toggle không ảnh hưởng ngoài */}
      </ThemeProvider>
    </ThemeProvider>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <ThemedButton />
      <NestedDemo />
    </ThemeProvider>
  );
}
