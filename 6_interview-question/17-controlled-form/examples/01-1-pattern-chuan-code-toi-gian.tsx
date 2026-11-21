import { useState } from "react";

function Login() {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");

  return (
    <form onSubmit={(e) => e.preventDefault()}>
      <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
      <input type="password" value={pass} onChange={(e) => setPass(e.target.value)} placeholder="Mật khẩu" />
      <button type="submit">Đăng nhập</button>
    </form>
  );
}
