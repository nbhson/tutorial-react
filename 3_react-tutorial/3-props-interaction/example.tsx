// example.tsx — DAY 3: props + child-to-parent callback
import { useState } from "react";

function CounterButton({ onAdd }: { onAdd: (step: number) => void }) {
  return <button onClick={() => onAdd(1)}>+1</button>;
}

export default function App() {
  const [count, setCount] = useState(0);
  return (
    <>
      <p>Count: {count}</p>
      <CounterButton onAdd={(step) => setCount((c) => c + step)} />
    </>
  );
}
