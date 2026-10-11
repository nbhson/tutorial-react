// example.tsx — DAY 3: props string / number / boolean / event (callback)
// Chạy với Vite + React 19. Mỗi khối là 1 loại props, có chú thích tiếng Việt.
import { useState } from "react";

// ── 1. Props STRING: truyền chuỗi xuống con (read-only, có default) ──────────
type GreetingProps = { name: string; greeting?: string };

function Greeting({ name, greeting = "Xin chào" }: GreetingProps) {
  // greeting có default "Xin chào" khi cha không truyền (thay defaultProps đã bỏ)
  return (
    <p>
      {greeting}, {name}!
    </p>
  );
}

// ── 2. Props NUMBER: truyền số xuống con (hiển thị + tính toán) ───────────────
type BadgeProps = { count: number; max?: number };

function Badge({ count, max = 99 }: BadgeProps) {
  // max default 99: count vượt max thì hiện "99+"
  return <span>[Thông báo: {count > max ? `${max}+` : count}]</span>;
}

// ── 3. Props BOOLEAN: cờ bật/tắt hành vi hoặc giao diện con ───────────────────
type ToggleLabelProps = { isOn: boolean; label?: string };

function ToggleLabel({ isOn, label = "Đèn" }: ToggleLabelProps) {
  // boolean điều khiển nhánh render + className
  return (
    <p className={isOn ? "on" : "off"}>
      {label}: {isOn ? "BẬT" : "TẮT"}
    </p>
  );
}

// ── 4. Props EVENT (callback): con báo sự kiện lên cha qua hàm ────────────────
// Con KHÔNG biết cha xử lý ra sao — chỉ gọi đúng contract (tên + payload).
type CounterButtonProps = { step?: number; onAdd: (step: number) => void };

function CounterButton({ step = 1, onAdd }: CounterButtonProps) {
  // Bọc arrow để truyền payload khi click (khác onClick={onAdd(1)} gọi ngay lúc render)
  return <button onClick={() => onAdd(step)}>+{step}</button>;
}

type SwitchProps = { isOn: boolean; onToggle: (next: boolean) => void };

function Switch({ isOn, onToggle }: SwitchProps) {
  // Event prop boolean: con báo giá trị đảo ngược, cha quyết định đổi state
  return <button onClick={() => onToggle(!isOn)}>{isOn ? "Tắt đi" : "Bật lên"}</button>;
}

type TextInputProps = {
  value: string;
  onValueChange: (next: string) => void; // event prop string (controlled input)
};

function TextInput({ value, onValueChange }: TextInputProps) {
  // Payload là dữ liệu con biết (text mới), không phải event thô
  return <input value={value} onChange={(e) => onValueChange(e.target.value)} />;
}

// ── App: cha giữ state (lifting state up), truyền 4 loại props xuống ──────────
export default function App() {
  const [count, setCount] = useState(0); // number state, chia sẻ cho Badge + CounterButton
  const [isOn, setIsOn] = useState(false); // boolean state, chia sẻ cho ToggleLabel + Switch
  const [name, setName] = useState("Son"); // string state, chia sẻ cho Greeting + TextInput

  return (
    <>
      {/* STRING */}
      <Greeting name={name} />
      <Greeting name="Linh" greeting="Chào buổi sáng" />

      {/* NUMBER */}
      <p>Count: {count}</p>
      <Badge count={count} />
      <Badge count={150} max={99} />

      {/* BOOLEAN */}
      <ToggleLabel isOn={isOn} />

      {/* EVENT: number payload — functional update tránh stale closure */}
      <CounterButton onAdd={(step) => setCount((c) => c + step)} />
      <CounterButton step={5} onAdd={(step) => setCount((c) => c + step)} />

      {/* EVENT: boolean payload */}
      <Switch isOn={isOn} onToggle={setIsOn} />

      {/* EVENT: string payload (controlled) */}
      <TextInput value={name} onValueChange={setName} />
    </>
  );
}
