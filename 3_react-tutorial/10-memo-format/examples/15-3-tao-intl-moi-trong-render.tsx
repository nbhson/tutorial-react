// ❌ SAI: mỗi render tốn parse locale + mất cache
function App({ total }: { total: number }) {
  const fmt = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" });
  return <p>{fmt.format(total)}</p>;
}
