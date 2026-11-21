import { Children, type ReactNode } from "react";

function Breadcrumb({ children }: { children: ReactNode }) {
  // Chuẩn hóa mọi shape thành mảng phẳng, loại null/false từ render điều kiện
  const parts = Children.toArray(children).filter(Boolean);
  return (
    <nav aria-label="breadcrumb">
      {parts.map((part, i) => (
        // key theo index ổn vì parts đã ổn định thứ tự sau toArray
        <span key={i}>
          {part}
          {/* Chèn separator giữa các phần, phần cuối không chèn */}
          {i < parts.length - 1 && " / "}
        </span>
      ))}
    </nav>
  );
}
