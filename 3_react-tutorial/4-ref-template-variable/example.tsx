// example.tsx — DAY 4: useRef focus + giữ timer id + ref là prop (React 19)
// Mục đích: phân biệt state (gây render) vs ref (không render) + minh họa
// React 19 ref là prop thường, callback ref đo DOM.
import { useEffect, useRef, useState } from "react"; // (1) useRef giữ tham chiếu, useEffect cho timer, useState cho tick hiển thị

// (2) React 19: MyInput nhận ref như prop thường — KHÔNG cần forwardRef nữa.
// ...rest spread phần còn lại xuống <input> để "mở đuôi" tùy biến.
function MyInput({ ref, ...rest }: { ref?: React.Ref<HTMLInputElement> } & React.InputHTMLAttributes<HTMLInputElement>) {
  return <input ref={ref} {...rest} />;
}

export default function App() {
  // (3) ref DOM: ban đầu null (chưa có DOM), sau mount trỏ vào <input>. Đổi .current KHÔNG render.
  const inputRef = useRef<HTMLInputElement>(null);
  // (4) tick PHẢI là state vì cần hiển thị ra UI — mỗi giây setTick -> re-render <p>.
  const [tick, setTick] = useState(0);
  // (5) id interval CHỈ là ref vì không hiển thị — lưu để cleanup, không gây render thừa.
  // Vì sao không dùng biến thường? Vì biến mất sau mỗi render, ref giữ qua mọi render.
  const idRef = useRef<number | undefined>(undefined);
  // (6) Đo chiều cao demo callback ref: ref là hàm nhận node (hoặc null khi unmount).
  const [h, setH] = useState(0);

  useEffect(() => {
    // (7) Mount: tạo interval mỗi giây, lưu id vào ref (không gây render).
    idRef.current = window.setInterval(() => setTick((t) => t + 1), 1000);
    // (8) Cleanup = ngOnDestroy: dừng timer khi unmount. StrictMode dev gọi cleanup này rồi setup lại.
    return () => clearInterval(idRef.current);
  }, []); // deps [] = chạy 1 lần sau mount

  return (
    <>
      <p>Tick: {tick}</p>
      {/* (9) ref={...} là "template reference" của React — sau mount inputRef.current = node DOM */}
      <input ref={inputRef} placeholder="Nhập tên..." />
      {/* (10) MyInput nhận ref như prop thường (React 19) */}
      <MyInput ref={inputRef} placeholder="Input qua prop ref (dùng chung ref demo)" />
      {/* (11) ?. an toàn nếu ref null (bấm trước khi mount) — không crash */}
      <button onClick={() => inputRef.current?.focus()}>Focus</button>
      {/* (12) Callback ref: mỗi lần div mount/unmount, hàm chạy với node/null để đo */}
      <div ref={(node) => { if (node) setH(node.getBoundingClientRect().height); }}>
        Cao {h}px — khối đo bằng callback ref
      </div>
    </>
  );
}
