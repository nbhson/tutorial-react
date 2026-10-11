// example.tsx — DAY 9: duyệt + đánh số + clone inject + breadcrumb (khớp README)
// Mục đích: đọc/chỉnh projected content — đếm, bọc, inject prop, chèn separator.
import { Children, cloneElement, isValidElement } from "react"; // (1) Bộ API duyệt children an toàn mọi shape
import type { ReactNode } from "react";

// (2) Steps: đếm + bọc — KHÔNG sửa child gốc, chỉ thêm context bao quanh (pattern an toàn nhất).
function Steps({ children }: { children: ReactNode }) {
  // Children.count đúng cả khi 1 child (không .length), fragment, mảng lồng
  const total = Children.count(children);
  return (
    <ol>
      {/* Children.map an toàn mọi shape; i là index sau chuẩn hóa */}
      {Children.map(children, (child, i) => (
        <li>
          Bước {i + 1}/{total}: {child}
        </li>
      ))}
    </ol>
  );
}

// (3) TabsList: cloneElement inject prop (aria-selected + onClick) vào child hợp lệ.
// Dùng khi cần "trang trí hàng loạt" mà composition lẻ tẻ quá rườm rà.
function TabsList({ children, active, onSelect }: {
  children: ReactNode; active: string; onSelect: (v: string) => void;
}) {
  return (
    <div role="tablist">
      {Children.map(children, (child) => {
        // String/number không có .props — kiểm tra trước khi đọc/clone
        if (!isValidElement<{ value?: string; onClick?: () => void }>(child)) return child;
        const value = child.props.value ?? ""; // đọc prop gốc của child
        // clone giữ props cũ, chồng props mới; gộp handler cũ để không mất onClick người dùng
        const oldClick = child.props.onClick;
        return cloneElement(child, {
          "aria-selected": value === active ? "true" : "false", // chuỗi cho ARIA, không boolean
          onClick: () => { oldClick?.(); onSelect(value); },
        });
      })}
    </div>
  );
}

// (4) Breadcrumb: toArray chuẩn hóa + filter rỗng + chèn "/" giữa các phần.
function Breadcrumb({ children }: { children: ReactNode }) {
  // toArray phẳng hóa + gán key ổn định; filter(Boolean) bỏ null/false/undefined
  const parts = Children.toArray(children).filter(Boolean);
  return (
    <nav aria-label="breadcrumb">
      {parts.map((part, i) => (
        <span key={i}>
          {part}
          {i < parts.length - 1 && " / "} {/* separator trừ phần cuối */}
        </span>
      ))}
    </nav>
  );
}

export default function App() {
  return (
    <>
      {/* (5) Steps với 3 element + 1 string để chứng minh isValidElement/count xử lý mọi loại */}
      <Steps>
        <span>Đăng nhập</span>
        <span>Chọn hàng</span>
        <span>Thanh toán</span>
        {"Ghi chú chuỗi"} {/* string child — Steps bọc được, TabsList bỏ qua khi clone */}
      </Steps>
      {/* (6) TabsList inject — Tab là button có value, active="b" */}
      <TabsList active="b" onSelect={(v) => alert(`Chọn ${v}`)}>
        <button value="a">Tab A</button>
        <button value="b">Tab B</button>
      </TabsList>
      {/* (7) Breadcrumb chèn separator */}
      <Breadcrumb>
        <a href="/">Home</a>
        <a href="/shop">Shop</a>
        <span>Checkout</span>
      </Breadcrumb>
    </>
  );
}
