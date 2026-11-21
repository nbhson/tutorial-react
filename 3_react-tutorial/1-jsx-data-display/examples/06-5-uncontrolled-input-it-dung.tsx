// Uncontrolled: React chỉ đọc 1 lần khi submit, không kiểm soát lúc gõ
import { useRef } from "react";
function Quick() {
  const ref = useRef<HTMLInputElement>(null); // trỏ vào DOM thật sau mount
  const submit = () => alert(ref.current?.value); // đọc khi cần, không state
  return <input ref={ref} defaultValue="Son" />;
}
