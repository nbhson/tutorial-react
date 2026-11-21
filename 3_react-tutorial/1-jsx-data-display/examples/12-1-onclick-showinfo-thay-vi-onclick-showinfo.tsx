// ✅ ĐÚNG: truyền tham chiếu; cần tham số thì bọc arrow
function App() {
  const showInfo = () => alert("hi");
  const greet = (n: string) => alert(`hi ${n}`);
  return (
    <>
      <button onClick={showInfo}>Bấm</button>
      <button onClick={() => greet("Son")}>Chào Son</button>
    </>
  );
}
