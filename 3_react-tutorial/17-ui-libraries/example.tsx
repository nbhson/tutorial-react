// example.tsx — DAY 17: ví dụ không cần lib (mô phỏng Button variants)
import { useState } from "react";

function Button({ variant = "primary", children, onClick }: {
  variant?: "primary" | "outline";
  children: React.ReactNode;
  onClick?: () => void;
}) {
  const style =
    variant === "primary"
      ? { background: "#1976d2", color: "#fff", border: "none", padding: "8px 16px", borderRadius: 6 }
      : { background: "#fff", color: "#1976d2", border: "1px solid #1976d2", padding: "8px 16px", borderRadius: 6 };
  return <button style={style} onClick={onClick}>{children}</button>;
}

export default function App() {
  const [saved, setSaved] = useState(false);
  return (
    <>
      <Button onClick={() => setSaved(true)}>Lưu (primary)</Button>{" "}
      <Button variant="outline" onClick={() => setSaved(false)}>Hủy (outline)</Button>
      {saved && <p>Đã lưu!</p>}
    </>
  );
}
