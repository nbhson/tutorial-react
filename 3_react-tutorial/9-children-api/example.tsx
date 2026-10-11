// example.tsx — DAY 9: duyệt + đánh số children
import { Children } from "react";

function Steps({ children }: { children: React.ReactNode }) {
  const total = Children.count(children);
  return (
    <ol>
      {Children.map(children, (child, i) => (
        <li>
          Bước {i + 1}/{total}: {child}
        </li>
      ))}
    </ol>
  );
}

export default function App() {
  return (
    <Steps>
      <span>Đăng nhập</span>
      <span>Chọn hàng</span>
      <span>Thanh toán</span>
    </Steps>
  );
}
