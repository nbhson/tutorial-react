import { createContext, useContext, useState, type ReactNode } from "react";

type Theme = "light" | "dark";
const ThemeValueCtx = createContext<Theme>("light"); // context chỉ chứa giá trị theme
const ThemeToggleCtx = createContext<() => void>(() => {}); // context chỉ chứa hàm toggle

function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light"); // state theme đổi khi toggle
  const toggle = () => setTheme((t) => (t === "light" ? "dark" : "light")); // hàm đảo theme
  return (
    // Lồng 2 Provider: consumer nào đọc context nào thì chỉ re-render theo context đó
    <ThemeValueCtx.Provider value={theme}>
      <ThemeToggleCtx.Provider value={toggle}>{children}</ThemeToggleCtx.Provider>
    </ThemeValueCtx.Provider>
  );
}

function ThemeLabel() {
  const theme = useContext(ThemeValueCtx); // chỉ re-render khi theme đổi
  return <p>Theme: {theme}</p>;
}
