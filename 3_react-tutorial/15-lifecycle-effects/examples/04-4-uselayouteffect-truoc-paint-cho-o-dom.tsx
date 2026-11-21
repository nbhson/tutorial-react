// Đo tooltip để không nháy (không trong ví dụ clock, nhưng là ca chuẩn):
import { useLayoutEffect, useRef, useState } from "react";
function Tooltip() {
  const ref = useRef<HTMLDivElement>(null);
  const [top, setTop] = useState(0);
  useLayoutEffect(() => { setTop(ref.current!.getBoundingClientRect().height); }, []);
  // Vẽ lần đầu đã top đúng — không thấy nhảy. useEffect thì thấy nhảy 1 frame.
  return <div ref={ref} style={{ top }}>Hi</div>;
}
