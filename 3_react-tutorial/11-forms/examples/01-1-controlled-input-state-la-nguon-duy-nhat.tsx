// example.tsx dùng đúng pattern này cho 2 field:
const [email, setEmail] = useState("");
<input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" aria-label="Email" />
// Gõ "a@b" -> onChange -> setEmail -> re-render -> input hiện "a@b", <p> lỗi (nếu có) cập nhật
