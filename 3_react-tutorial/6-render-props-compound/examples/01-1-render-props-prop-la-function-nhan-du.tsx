// Mouse trong example.tsx: giữ vị trí chuột, người dùng quyết hiện thế nào
function Mouse({ children }: { children: (pos: { x: number; y: number }) => ReactNode }) {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  return (
    <div onMouseMove={(e) => setPos({ x: e.clientX, y: e.clientY })}>
      {children(pos)} {/* GỌI function -> JSX; quên gọi là UI trắng */}
    </div>
  );
}
// Dùng: <Mouse>{({ x, y }) => <p>Mouse: {x}, {y}</p>}</Mouse>
// Cùng dữ liệu pos, người A vẽ <p>, người B vẽ tooltip — logic giữ nguyên, UI tự do
