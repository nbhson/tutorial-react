// Minh họa ý tưởng test (Vitest + RTL, xem chi tiết DAY 21)
// import { renderHook, act } from "@testing-library/react";
// import { vi, expect, test } from "vitest";

// test("useDebounce chốt sau delay", () => {
//   vi.useFakeTimers(); // dùng timer giả để tua nhanh, không chờ thật
//   const { result } = renderHook(() => useDebounce("a", 300)); // mount hook độc lập
//   expect(result.current).toBe("a"); // ban đầu là giá trị đầu
//   act(() => { vi.advanceTimersByTime(300); }); // tua 300ms trong act
//   expect(result.current).toBe("a"); // đã chốt sau delay
//   vi.useRealTimers(); // trả timer thật cho test khác
// });
