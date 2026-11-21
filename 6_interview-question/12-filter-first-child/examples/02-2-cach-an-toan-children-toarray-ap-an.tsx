import { Children } from "react";

function FirstChildOnly({ children }: { children: ReactNode }) {
  const arr = Children.toArray(children); // flatten + gán key ổn định
  return <div>{arr[0] ?? null}</div>;     // [0] an toàn (luôn là mảng)
}
