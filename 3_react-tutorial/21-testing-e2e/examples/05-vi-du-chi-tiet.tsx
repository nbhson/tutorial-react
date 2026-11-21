// example.tsx — DAY 21: Counter dễ test + test RTL + MSW + renderHook ý tưởng
// Mục đích: test hành vi user (role/text) — không chọc state/hàm nội bộ.
import { useState } from "react"; // (1) State count — test assert UI "Count: X", không assert state trực tiếp

export default function App() {
  const [count, setCount] = useState(0); // (2) Functional update để bấm nhanh không mất (kết hợp DAY 1/3)
  return (
    <>
      {/* (3) Text động "Count: {count}" — getByText assert theo những gì user thấy */}
      <p>Count: {count}</p>
      {/* (4) <button> semantic + tên "+1" rõ — getByRole("button", { name: "+1" }) bền trước refactor class */}
      <button onClick={() => setCount((c) => c + 1)}>+1</button>
      <button onClick={() => setCount(0)}>Reset</button>
    </>
  );
}

// Counter.test.tsx — đặt cạnh example.tsx khi chạy (Vitest + RTL + user-event):
// import { render, screen } from "@testing-library/react";
// import userEvent from "@testing-library/user-event"; // mô phỏng thật (pointer/focus/click), khác fireEvent low-level
// import { expect, test, beforeEach, vi } from "vitest";
// import App from "./example";
//
// beforeEach(() => vi.clearAllMocks()); // reset mock giữa các test — không rò state
//
// test("hiển thị Count: 0 lúc đầu", () => {
//   render(<App />); // mount vào jsdom (không browser thật nên nhanh)
//   expect(screen.getByText("Count: 0")).toBeInTheDocument(); // jest-dom matcher — cần setupFiles import 1 lần
// });
//
// test("bấm +1 hai lần -> Count: 2", async () => {
//   const user = userEvent.setup(); // v14: setup rồi dùng — mô phỏng async như người thật
//   render(<App />);
//   await user.click(screen.getByRole("button", { name: "+1" })); // query theo role + accessible name (a11y)
//   await user.click(screen.getByRole("button", { name: "+1" }));
//   expect(screen.getByText("Count: 2")).toBeInTheDocument(); // assert UI, không assert count state
// });
//
// test("Reset về 0", async () => {
//   const user = userEvent.setup();
//   render(<App />);
//   await user.click(screen.getByRole("button", { name: "+1" }));
//   await user.click(screen.getByRole("button", { name: "Reset" }));
//   expect(screen.getByText("Count: 0")).toBeInTheDocument();
// });

// Ghi chú mở rộng (xem README copy):
// - Async: await screen.findByText("Welcome") chờ xuất hiện (không waitForTimeout) — auto-wait.
// - Hook: renderHook(() => useDebounce(text, 300)) với vi.useFakeTimers() + advanceTimersByTime(300).
// - Network: MSW (msw) chặn fetch ở tầng network cho useFetch/useQuery — test loading->success->error.
// - Query: bọc QueryClientProvider client mới mỗi test + retry: false (không chờ retry khi lỗi).
// - E2E Playwright: page.getByRole auto-wait + toBeVisible (không waitForTimeout), storageState login 1 lần.
