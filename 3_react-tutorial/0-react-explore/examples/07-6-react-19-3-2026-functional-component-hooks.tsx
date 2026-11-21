// Trước React 19: muốn nhận ref phải bọc forwardRef — dài dòng.
import { forwardRef } from "react";
const OldInput = forwardRef<HTMLInputElement>((props, ref) => <input ref={ref} {...props} />);

// Sau React 19: ref là prop thường — viết như mọi prop khác.
function NewInput({ ref, ...rest }: { ref?: React.Ref<HTMLInputElement> } & React.InputHTMLAttributes<HTMLInputElement>) {
  return <input ref={ref} {...rest} />;
}
