// ❌ SAI (thừa ở React 19): bọc forwardRef dài dòng
import { forwardRef } from "react";
const Old = forwardRef<HTMLInputElement>((p, ref) => <input ref={ref} {...p} />);
