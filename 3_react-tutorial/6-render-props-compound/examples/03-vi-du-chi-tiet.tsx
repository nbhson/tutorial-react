// example.tsx — DAY 6: render prop Mouse + compound Tabs + useTabs() chuẩn
// Mục đích: con giữ state/logic, người dùng quyết UI (render props);
// nhóm component chia sẻ state ngầm qua Context (compound).
import { createContext, useContext, useState, type ReactNode } from "react"; // (1) Context + hook đọc

// ── Render props: children là FUNCTION nhận state của Mouse, trả JSX ──────────
// Người dùng quyết vẽ tọa độ thế nào; Mouse chỉ lo theo dõi chuột.
function Mouse({ children }: { children: (pos: { x: number; y: number }) => ReactNode }) {
  const [pos, setPos] = useState({ x: 0, y: 0 }); // (2) State vị trí do Mouse giữ
  return (
    <div
      style={{ border: "1px dashed #888", padding: 16 }}
      onMouseMove={(e) => setPos({ x: e.clientX, y: e.clientY })} // (3) Di chuột -> setPos -> re-render -> gọi lại children(pos)
    >
      {children(pos)} {/* (4) GỌI function để lấy JSX — quên gọi là UI trắng */}
    </div>
  );
}

// ── Compound: Context là "đường ống ngầm" giữa các phần tử Tabs ───────────────
const TabsCtx = createContext<{ value: string; setValue: (v: string) => void } | null>(null); // (5) Default null ép check scope

// (6) Custom hook an toàn: throw ngay nếu dùng ngoài Provider — lộ lỗi sớm thay vì UI câm.
function useTabs() {
  const ctx = useContext(TabsCtx);
  if (!ctx) throw new Error("Tabs.* phải nằm trong <Tabs>");
  return ctx;
}

// (7) Root giữ state tab + cấp Provider cho cả cụm.
function Tabs({ children, defaultValue = "a" }: { children: ReactNode; defaultValue?: string }) {
  const [value, setValue] = useState(defaultValue);
  return <TabsCtx.Provider value={{ value, setValue }}>{children}</TabsCtx.Provider>;
}

// (8) Trigger đọc context: tự biết mình active hay không, không cần cha truyền tay.
function Trigger({ value, children }: { value: string; children: ReactNode }) {
  const ctx = useTabs();
  const active = ctx.value === value;
  return (
    <button role="tab" aria-selected={active ? "true" : "false"} onClick={() => ctx.setValue(value)}>
      {children} {active ? "●" : ""}
    </button>
  );
}

// (9) Panel chỉ hiện khi value khớp — không cần prop active truyền tay.
function Panel({ value, children }: { value: string; children: ReactNode }) {
  const ctx = useTabs();
  if (ctx.value !== value) return null;
  return <div role="tabpanel">{children}</div>;
}

export default function App() {
  const [value, setValue] = useState("a"); // (10) State cho demo rút gọn (bản compound dùng Tabs root ở trên)
  return (
    <>
      {/* (11) Dùng render props: app quyết hiển thị tọa độ thế nào */}
      <Mouse>{({ x, y }) => <p>Mouse: {x}, {y}</p>}</Mouse>
      {/* (12) Compound chuẩn: không prop drilling — Trigger/Panel tự đọc context */}
      <Tabs defaultValue="a">
        <div role="tablist">
          <Trigger value="a">A</Trigger>
          <Trigger value="b">B</Trigger>
        </div>
        <Panel value="a"><p>Nội dung A</p></Panel>
        <Panel value="b"><p>Nội dung B</p></Panel>
      </Tabs>
      {/* (13) Bản rút gọn minh họa Provider trực tiếp (giữ để so sánh với bản Tabs ở trên) */}
      <TabsCtx.Provider value={{ value, setValue }}>
        <button onClick={() => setValue("a")}>A {value === "a" ? "●" : ""}</button>
        <button onClick={() => setValue("b")}>B {value === "b" ? "●" : ""}</button>
      </TabsCtx.Provider>
    </>
  );
}
