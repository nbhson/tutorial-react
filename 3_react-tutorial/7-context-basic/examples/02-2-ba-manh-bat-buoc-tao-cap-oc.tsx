// (1) Tạo: generic mô tả shape, default null để ép check
const ThemeCtx = createContext<{ theme: Theme; toggle: () => void } | null>(null);

// (2) Cấp: Provider giữ state, bọc cây con — state riêng cho subtree này
function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light");
  const toggle = () => setTheme((t) => (t === "light" ? "dark" : "light"));
  return <ThemeCtx.Provider value={{ theme, toggle }}>{children}</ThemeCtx.Provider>;
}

// (3) Đọc: consumer sâu mấy tầng cũng được, không cần props
function ThemedButton() {
  const { theme, toggle } = useTheme(); // useTheme bọc useContext + throw
  return <button onClick={toggle}>{theme}</button>;
}
