// ✅ ĐÚNG: disable khi đang gửi (tay hoặc RHF isSubmitting)
const [submitting, setSubmitting] = useState(false);
<button type="submit" disabled={submitting}>{submitting ? "Đang gửi..." : "Login"}</button>
