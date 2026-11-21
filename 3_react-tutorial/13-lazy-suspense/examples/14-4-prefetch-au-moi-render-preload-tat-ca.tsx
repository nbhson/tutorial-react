// ❌ SAI: gọi trong render — tải ngay lúc mở app, split vô nghĩa
function App() { preloadChart(); return <button>Mở</button>; }
