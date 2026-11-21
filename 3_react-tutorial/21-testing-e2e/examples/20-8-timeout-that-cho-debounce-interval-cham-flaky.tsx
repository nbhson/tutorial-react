// ✅ ĐÚNG: fake timer (như mẫu renderHook trên)
vi.useFakeTimers(); rerender({ v: "ab" }); act(() => vi.advanceTimersByTime(300));
