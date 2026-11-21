import type { ReactNode } from "react";
function Card({ children }: { children: ReactNode }) {
  return <div style={{ border: "1px solid #ccc", padding: 12 }}>{children}</div>;
}
// Cả 3 cách đều hợp lệ vì đều là ReactNode:
<Card>Xin chào</Card> // string
<Card>{["a", "b"]}</Card> // mảng
<Card><p>Hi</p></Card> // element
