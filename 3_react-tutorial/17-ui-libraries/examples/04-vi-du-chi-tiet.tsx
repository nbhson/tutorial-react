// example.tsx — DAY 17: Button variants mini + cva/cn ý tưởng + a11y (khớp README)
// Mục đích: variant = map prop -> style; cva/cn chỉ là pipeline gọn cho việc đó.
import { useState } from "react"; // (1) State saved để minh họa UI phản hồi (render có điều kiện DAY 2)

// (2) Mini Button 3 variant + 3 size + disabled — cùng ý cva (variants/size/defaultVariants) bản thủ công.
function Button({ variant = "primary", size = "md", disabled = false, children, onClick }: {
  variant?: "primary" | "outline" | "ghost"; // union chặn giá trị lạ — cva variants tương đương
  size?: "sm" | "md" | "lg"; // size pipeline — cva size tương đương
  disabled?: boolean; // disabled đổi cursor/opacity + chặn click (a11y: dùng <button disabled>, không div onClick)
  children: React.ReactNode;
  onClick?: () => void;
}) {
  // (3) Map variant -> style (thủ công). Prod: cva tách base/variants/defaultVariants + Tailwind class.
  const variantStyle =
    variant === "primary"
      ? { background: "#1976d2", color: "#fff", border: "none" }
      : variant === "outline"
        ? { background: "#fff", color: "#1976d2", border: "1px solid #1976d2" }
        : { background: "transparent", color: "#1976d2", border: "none" }; // ghost
  // (4) Map size -> padding/font. Prod: cva size { sm: "h-8 px-3", md: "h-9 px-4", lg: "h-10 px-6" }.
  const sizeStyle =
    size === "sm" ? { padding: "4px 12px", fontSize: 12 } : size === "lg" ? { padding: "12px 24px", fontSize: 16 } : { padding: "8px 16px", fontSize: 14 };
  return (
    // (5) <button> semantic (không div onClick) — keyboard focus/Enter + screen reader miễn phí.
    // className mở đuôi (prod: cn(variantClass, className) với tailwind-merge để user ghi đè không xung đột).
    <button
      style={{ ...variantStyle, ...sizeStyle, borderRadius: 6, cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.5 : 1 } as React.CSSProperties}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}

export default function App() {
  const [saved, setSaved] = useState(false); // (6) State phản hồi — minh họa state-driven (DAY 19 ý tưởng)
  return (
    <>
      <Button onClick={() => setSaved(true)}>Lưu (primary)</Button>{" "}
      <Button variant="outline" onClick={() => setSaved(false)}>Hủy (outline)</Button>{" "}
      <Button variant="ghost" size="sm">Chi tiết (ghost sm)</Button>{" "}
      <Button size="lg" disabled>Lưu (disabled)</Button>
      {/* (7) Render có điều kiện theo state — UI là hàm của state, không gọi DOM tay */}
      {saved && <p>Đã lưu!</p>}
    </>
  );
}

// Ghi chú prod (xem README copy):
// - shadcn: cva("base", { variants: { variant: { default, outline, ghost }, size: {...} }, defaultVariants }) + cn().
// - cn(...inputs) = twMerge(clsx(inputs)) — clsx điều kiện + tailwind-merge giải xung đột (px-4 vs px-8 -> px-8).
// - Tailwind v4 CSS-first: @import "tailwindcss" + @theme token; headless Radix lo a11y (focus/ESC), bạn lo class.
