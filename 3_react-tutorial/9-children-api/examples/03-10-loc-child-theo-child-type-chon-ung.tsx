import { Children, isValidElement } from "react";

function Step({ title }: { title: string }) {
  return <span>{title}</span>; // component con hợp lệ để Steps đánh số
}

function Steps({ children }: { children: React.ReactNode }) {
  // Lọc: chỉ giữ element có type đúng là Step, bỏ text/host element lạ
  const steps = Children.toArray(children).filter(
    (c) => isValidElement(c) && c.type === Step
  );
  return (
    <ol>
      {steps.map((s, i) => (
        // Đánh số theo vị trí đã lọc, không theo vị trí thô
        <li key={i}>Bước {i + 1}: {s}</li>
      ))}
    </ol>
  );
}
