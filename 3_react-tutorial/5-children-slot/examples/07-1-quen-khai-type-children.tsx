// ❌ SAI: TS any/implicit, mất gợi ý, dễ truyền object lạ
function Card({ children }: any) { return <div>{children}</div>; }
