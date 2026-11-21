// ✅ ĐÚNG: check hoặc fallback
function Card({ children }: { children?: ReactNode }) {
  if (!children) return null; // hoặc render fallback
  return <div className="card">{children}</div>;
}
