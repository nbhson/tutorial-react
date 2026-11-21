// ❌ SAI: mỗi nút giữ riêng — tổng không ai biết
function Plus() { const [n, setN] = useState(0); return <button onClick={() => setN(n+1)}>{n}</button>; }
function Minus() { const [n, setN] = useState(0); return <button onClick={() => setN(n-1)}>{n}</button>; }
