// example.tsx — DAY 4: useRef focus + giữ timer id
import { useEffect, useRef, useState } from "react";

export default function App() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [tick, setTick] = useState(0);
  const idRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    idRef.current = window.setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(idRef.current);
  }, []);

  return (
    <>
      <p>Tick: {tick}</p>
      <input ref={inputRef} placeholder="Nhập tên..." />
      <button onClick={() => inputRef.current?.focus()}>Focus</button>
    </>
  );
}
