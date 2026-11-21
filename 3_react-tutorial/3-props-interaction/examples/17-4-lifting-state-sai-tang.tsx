// ✅ ĐÚNG: đưa lên cha chung gần nhất, truyền xuống cả hai
function App() {
  const [count, setCount] = useState(0);
  return (<><p>{count}</p><button onClick={() => setCount((c) => c+1)}>+1</button><button onClick={() => setCount((c) => c-1)}>-1</button></>);
}
