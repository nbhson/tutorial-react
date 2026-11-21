// ✅ ĐÚNG: callback chỉ vẽ JSX; hook (nếu cần) nằm ở component chứa <Mouse>
function Wrap() { const [x] = useState(0); return <Mouse>{(pos) => <p>{pos.x + x}</p>}</Mouse>; }
