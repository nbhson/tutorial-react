// (a) Provider (component giữ state) tự đổi:
function ThemeProvider({ children }) {
  const [theme, setTheme] = useState("light");
  // setTheme → Provider re-render → value mới → consumer re-render
}

// (b) Consumer "đẩy" đổi lên (callback do Provider cấp qua value — pattern chuẩn):
const { theme, toggle } = useTheme();
<button onClick={toggle}>Đổi theme</button> // consumer không tự sửa context;
                                            // nó gọi hàm mà Provider "cấp"
