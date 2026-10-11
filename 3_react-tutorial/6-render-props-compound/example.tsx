// example.tsx — DAY 6: render prop Mouse + compound Tabs (rút gọn)
import { createContext, useContext, useState, type ReactNode } from "react";

function Mouse({ children }: { children: (pos: { x: number; y: number }) => ReactNode }) {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  return (
    <div
      style={{ border: "1px dashed #888", padding: 16 }}
      onMouseMove={(e) => setPos({ x: e.clientX, y: e.clientY })}
    >
      {children(pos)}
    </div>
  );
}

const TabsCtx = createContext<{ value: string; setValue: (v: string) => void } | null>(null);

export default function App() {
  const [value, setValue] = useState("a");
  return (
    <>
      <Mouse>{({ x, y }) => <p>Mouse: {x}, {y}</p>}</Mouse>
      <TabsCtx.Provider value={{ value, setValue }}>
        <button onClick={() => setValue("a")}>A {value === "a" ? "●" : ""}</button>
        <button onClick={() => setValue("b")}>B {value === "b" ? "●" : ""}</button>
        {useContext(TabsCtx)?.value === "a" ? <p>Nội dung A</p> : <p>Nội dung B</p>}
      </TabsCtx.Provider>
    </>
  );
}
