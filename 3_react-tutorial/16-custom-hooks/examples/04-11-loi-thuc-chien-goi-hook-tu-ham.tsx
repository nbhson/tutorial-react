// SAI: hàm thường chứa hook + tên không use -> runtime lỗi + linter không bắt
// function myFetch(url: string) { const [d, setD] = useState(null); return d; }

// ĐÚNG: tên use* + chỉ gọi trong component/hook khác
import { useState } from "react";

function useToggle(initial = false) {
  const [value, setValue] = useState(initial); // hook ở top-level của custom hook
  const toggle = () => setValue((v) => !v); // đảo giá trị
  const setTrue = () => setValue(true); // mở
  const setFalse = () => setValue(false); // đóng
  return [value, toggle, setTrue, setFalse] as const; // tuple 4 phần tử quen thuộc
}
