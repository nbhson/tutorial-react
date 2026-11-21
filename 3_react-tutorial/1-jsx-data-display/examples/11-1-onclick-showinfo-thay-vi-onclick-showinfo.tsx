// ❌ SAI: gọi hàm lúc render, truyền kết quả (undefined) vào onClick
function App() {
  const showInfo = () => alert("hi");
  return <button onClick={showInfo()}>Bấm</button>; // alert hiện ngay khi mở trang
}
