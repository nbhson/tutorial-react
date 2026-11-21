// (1) TẠO (1 lần khi module load) — default null để "ép" "check"
const ThemeCtx = createContext<{ theme: Theme; toggle: () => void } | null>(null);

// (2) CẤP (Provider giữ state, "bọc" "subtree")
function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light");
  const toggle = () => setTheme((t) => (t === "light" ? "dark" : "light"));
  return <ThemeCtx.Provider value={{ theme, toggle }}>{children}</ThemeCtx.Provider>;
}
// React 19: "rút gọn" <ThemeCtx value={...}> "thay" <ThemeCtx.Provider value> (tương đương)

// (3) ĐỌC (consumer "sâu" "mấy" "tầng" "cũng" "được" — "bọc" "vùng")
function ThemedButton() {
  const { theme, toggle } = useTheme();
  return <button onClick={toggle}>{theme}</button>;
}

function useTheme() {
  const ctx = useContext(ThemeCtx);
  if (!ctx) throw new Error("useTheme cần <ThemeProvider>"); // "lỗi" "sớm", "clear"
  return ctx;
}
