// Provider render lại (state phụ đổi) → value MỚI
// (object literal tạo lại mỗi render) → React so Object.is → "khác" →
// mọi consumer render lại DÙ theme không đổi
function ThemeProvider({ children }) {
  const [theme, setTheme] = useState("light");
  const toggle = () => setTheme((t) => (t === "light" ? "dark" : "light"));
  return <ThemeCtx.Provider value={{ theme, toggle }}>{children}</ThemeCtx.Provider>; // ❌ mỗi render = object mới
}
