import { Children, isValidElement } from "react";

// Chỉ "hiện" child là element (bỏ string/number) — "gọt" shape
function OnlyElements({ children }: { children: ReactNode }) {
  return (
    <div>
      {Children.toArray(children).filter(isValidElement)}
    </div>
  );
}
