// example.tsx — DAY 11: controlled form thuần (không cần lib)
import { useState } from "react";

export default function App() {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [err, setErr] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes("@")) return setErr("Email không hợp lệ");
    if (pass.length < 6) return setErr("Mật khẩu tối thiểu 6 ký tự");
    setErr("");
    alert(`Login OK: ${email}`);
  };

  return (
    <form onSubmit={submit}>
      <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
      <input type="password" value={pass} onChange={(e) => setPass(e.target.value)} placeholder="Mật khẩu" />
      {err && <p style={{ color: "red" }}>{err}</p>}
      <button type="submit">Login</button>
    </form>
  );
}
