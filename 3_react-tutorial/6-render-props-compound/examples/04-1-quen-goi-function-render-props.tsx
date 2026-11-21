// ❌ SAI: truyền function nhưng render như element — UI trắng
function Mouse({ children }: { children: (p: Pos) => ReactNode }) {
  const [pos] = useState({ x: 0, y: 0 });
  return <div>{children}</div>; // children là function, không phải JSX
}
