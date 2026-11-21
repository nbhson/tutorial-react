// example.tsx dùng đúng pattern này:
const [name, setName] = useState("Son Nguyen");
<input value={name} onChange={(e) => setName(e.target.value)} />
// Gõ "x" -> onChange("Son Nguyenx") -> setName -> re-render -> input hiện "Son Nguyenx"
