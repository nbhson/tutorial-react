// example.tsx — DAY 21: component mẫu dễ test (Counter)
import { useState } from "react";

export default function App() {
  const [count, setCount] = useState(0);
  return (
    <>
      <p>Count: {count}</p>
      <button onClick={() => setCount((c) => c + 1)}>+1</button>
    </>
  );
}

// Counter.test.tsx (tạo cạnh file này khi cần):
// import { render, screen } from "@testing-library/react";
// import userEvent from "@testing-library/user-event";
// import { expect, test } from "vitest";
// import App from "./example";
// test("bấm +1 tăng count", async () => {
//   render(<App />);
//   await userEvent.click(screen.getByRole("button", { name: "+1" }));
//   expect(screen.getByText("Count: 1")).toBeInTheDocument();
// });
