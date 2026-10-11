// example.tsx — DAY 19: CSS transition (không cần lib)
import { useState } from "react";

export default function App() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen((o) => !o)}>Toggle</button>
      <div
        style={{
          marginTop: 12,
          padding: 12,
          border: "1px solid #ccc",
          opacity: open ? 1 : 0,
          transform: open ? "translateY(0)" : "translateY(8px)",
          transition: "opacity 200ms, transform 200ms",
          pointerEvents: open ? "auto" : "none",
        }}
      >
        Nội dung fade/slide
      </div>
    </>
  );
}
