// renderHook + fake timer cho useDebounce (DAY 16):
import { renderHook, act } from "@testing-library/react";
vi.useFakeTimers();
const { result, rerender } = renderHook(({ v }) => useDebounce(v, 300), { initialProps: { v: "a" } });
rerender({ v: "ab" }); act(() => vi.advanceTimersByTime(300)); // ngừng đủ 300ms
expect(result.current).toBe("ab");
