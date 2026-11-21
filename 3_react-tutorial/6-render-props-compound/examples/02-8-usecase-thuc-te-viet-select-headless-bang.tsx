import { useState, type ReactNode } from "react";

// Component headless: giữ logic, nhả quyền vẽ UI cho người dùng
function Select({ children }: {
  children: (api: { open: boolean; selected: string; toggle: () => void; select: (v: string) => void }) => ReactNode;
}) {
  const [open, setOpen] = useState(false); // trạng thái đóng/mở dropdown
  const [selected, setSelected] = useState("a"); // giá trị đang chọn
  const toggle = () => setOpen((o) => !o); // đảo trạng thái mở
  const select = (v: string) => { setSelected(v); setOpen(false); }; // chọn xong tự đóng
  return <div>{children({ open, selected, toggle, select })}</div>;
}

// Nơi dùng 1: UI đơn giản kiểu nút + list
function App() {
  return (
    <Select>
      {({ open, selected, toggle, select }) => (
        <div>
          {/* Nút hiện giá trị đang chọn, kèm aria-expanded cho screen reader */}
          <button aria-expanded={open} onClick={toggle}>Đang chọn: {selected}</button>
          {open && (
            <ul role="listbox">
              {["a", "b", "c"].map((v) => (
                <li key={v} role="option" aria-selected={v === selected} onClick={() => select(v)}>{v}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </Select>
  );
}
