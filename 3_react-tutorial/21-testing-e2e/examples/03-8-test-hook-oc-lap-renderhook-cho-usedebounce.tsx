// Minh họa ý tưởng test useToggle độc lập (không cần UI)
// import { renderHook, act } from "@testing-library/react";
// const { result } = renderHook(() => useToggle()); // mount hook, lấy API trả về
// expect(result.current[0]).toBe(false); // ban đầu tắt
// act(() => { result.current[1](); }); // gọi toggle trong act để flush update
// expect(result.current[0]).toBe(true); // đã bật sau toggle
