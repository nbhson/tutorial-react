// ❌ SAI — Plus và Minus mỗi bên giữ state riêng: không ai đọc được tổng
function Plus() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(count + 1)}>+1</button>;
}
function Minus() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(count - 1)}>-1</button>;
}
// App: <Plus /> <Minus /> → Plus và Minus "không biết nhau", count lệch nhau
