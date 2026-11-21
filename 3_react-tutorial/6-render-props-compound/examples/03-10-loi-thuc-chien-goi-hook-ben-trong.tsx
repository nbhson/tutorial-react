// SAI: gọi hook trong callback render prop -> vi phạm Rules of Hooks
// <Mouse>{(pos) => { const [x] = useState(0); return <p>{pos.x}</p>; }}</Mouse>

// ĐÚNG: hook nằm ở component bao ngoài, callback chỉ vẽ JSX
import { useState } from "react";

function MouseView() {
  const [label] = useState("Tọa độ:"); // hook ở top-level component -> hợp lệ
  return (
    <div>
      {/* Callback chỉ nhận pos và vẽ, không gọi hook nào bên trong */}
      {/* Giả sử Mouse đã định nghĩa như example.tsx */}
      {/* <Mouse>{({ x, y }) => <p>{label} {x}, {y}</p>}</Mouse> */}
    </div>
  );
}
