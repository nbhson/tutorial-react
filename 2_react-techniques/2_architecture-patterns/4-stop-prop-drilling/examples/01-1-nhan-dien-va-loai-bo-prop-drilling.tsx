// ❌ SAI: drill 3 tầng — tầng giữa chỉ chuyển tiếp, không dùng
function App() { const [t] = useState('dark'); return <A theme={t} />; }
function A({ theme }: any) { return <B theme={theme} />; } // A không dùng theme
function B({ theme }: any) { return <C theme={theme} />; } // B không dùng theme
function C({ theme }: any) { return <h1>{theme}</h1>; } // chỉ C dùng

// ✅ ĐÚNG: composition hoặc context — A, B không biết theme tồn tại (xem Ví dụ chi tiết)
