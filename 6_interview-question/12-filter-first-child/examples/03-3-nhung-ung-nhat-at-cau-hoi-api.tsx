// ✅ "đúng nhất" — 1 slot tường minh (1 prop ReactNode), không cần "lọc"
function Alert({ title }: { title: ReactNode }) {
  return (
    <div className="alert">
      <strong>{title}</strong> {/* "child duy nhất" = title */}
    </div>
  );
}
