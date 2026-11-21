// ❌ DANG — children không phải mảng
function FirstChildOnly({ children }: { children: ReactNode }) {
  return <div>{children[0]}</div>; // ❌ undefined nếu children = 1 element
}
// Dùng: <FirstChildOnly><a/><b/></FirstChildOnly> → children = [a, b] → [0] = a (đúng)
//        <FirstChildOnly><a/></FirstChildOnly>     → children = <a/>   → [0] = undefined (sai!)
