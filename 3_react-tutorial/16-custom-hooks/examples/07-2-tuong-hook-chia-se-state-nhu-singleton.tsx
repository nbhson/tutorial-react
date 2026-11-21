// ❌ SAI: mong A set là B thấy (như service) — B đứng yên
function A() { const [n, setN] = useLocalStorage("n"); return <button onClick={() => setN("x")}>A</button>; }
function B() { const [n] = useLocalStorage("n"); return <p>B: {n}</p>; }
