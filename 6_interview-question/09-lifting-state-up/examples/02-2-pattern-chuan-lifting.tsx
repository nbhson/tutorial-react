// ✅ App (cha) là single source of truth: Plus/Minus/Greeting/TextInput
// tất cả "đọc chung" một state, không ai "giữ riêng".
import { useState } from "react";

function App() {
  const [count, setCount] = useState(0);        // number state
  const [isOn, setIsOn] = useState(false);       // boolean state
  const [name, setName] = useState("Son");        // string state (controlled input)

  return (
    <>
      <Badge count={count} />                    // đọc
      <CounterButton onAdd={(step) => setCount((c) => c + step)} /> // "đề nghị"
      <Switch isOn={isOn} onToggle={() => setIsOn((v) => !v)} />
      <TextInput value={name} onValueChange={setName} />
    </>
  );
}
