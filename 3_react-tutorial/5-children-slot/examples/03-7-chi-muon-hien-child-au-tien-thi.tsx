import { Children } from "react";

function Card({ children }: { children: ReactNode }) {
  const first = Children.toArray(children)[0]; // lấy phần tử đầu, bỏ phần còn lại
  return <div className="card">{first ?? null}</div>;
}
