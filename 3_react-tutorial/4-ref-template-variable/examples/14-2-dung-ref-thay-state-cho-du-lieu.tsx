// ✅ ĐÚNG: cần hiển thị thì state
const [name, setName] = useState("Son");
<button onClick={() => setName("Linh")}>Đổi</button>
<p>{name}</p>
