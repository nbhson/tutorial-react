// example.tsx — DAY 10: format + useMemo
import { memo, useMemo } from "react";

const fmtVND = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" });

const Row = memo(function Row({ text }: { text: string }) {
  return <li>{text}</li>;
});

export default function App() {
  const rows = [120000, 45000, 89000];
  const total = useMemo(() => rows.reduce((a, b) => a + b, 0), [rows]);
  return (
    <>
      <ul>{rows.map((r, i) => <Row key={i} text={fmtVND.format(r)} />)}</ul>
      <p>Tổng: {fmtVND.format(total)}</p>
    </>
  );
}
