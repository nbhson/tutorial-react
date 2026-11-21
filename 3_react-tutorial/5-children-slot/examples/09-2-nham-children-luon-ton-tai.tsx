// ❌ SAI: luôn render wrapper dù không có con — <div> rỗng lệch layout
function Card({ children }: { children?: ReactNode }) { return <div className="card">{children}</div>; }
<Card /> // <div class="card"></div> rỗng
