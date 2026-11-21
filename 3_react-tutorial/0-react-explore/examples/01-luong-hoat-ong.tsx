// Mỗi lần count đổi, chỉ <p> bị vá — <button> giữ nguyên trong DOM thật
function Counter() {
  const [count, setCount] = useState(0);
  return (
    <>
      <p>Count: {count}</p>
      <button onClick={() => setCount((c) => c + 1)}>Tăng</button>
    </>
  );
}
