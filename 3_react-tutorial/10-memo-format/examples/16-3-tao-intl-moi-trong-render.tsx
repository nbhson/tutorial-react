// ✅ ĐÚNG: ngoài module (hoặc memo theo locale)
const fmtVND = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" });
function App({ total }: { total: number }) { return <p>{fmtVND.format(total)}</p>; }
