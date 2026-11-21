import { useSearchParams, useNavigate } from "react-router";

function UserList() {
  const [params, setParams] = useSearchParams(); // query ?q=... thành state 2 chiều
  const q = params.get("q") ?? ""; // đọc filter hiện tại từ URL
  const navigate = useNavigate(); // điều hướng trong handler
  return (
    <div>
      {/* Gõ là URL đổi (?q=...), loader chạy lại, back/forward giữ filter */}
      <input value={q} onChange={(e) => setParams({ q: e.target.value })} placeholder="Lọc user (?q=)" />
      {/* Sau login xong: nhảy sang dashboard thay vì render Link */}
      <button onClick={() => navigate("/dashboard")}>Giả lập login xong</button>
    </div>
  );
}
