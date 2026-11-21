// Trước (≤18): "bọc" forwardRef (cần "thông báo" "giữ" ref "cho" "cha")
const MyInput = forwardRef<HTMLInputElement, Props>((props, ref) => <input ref={ref} {...props} />);

// React 19: ref "là prop "thường" (destructure) — không forwardRef (cập nhật "thường")
function MyInput({ ref, ...rest }: Props & { ref?: Ref<HTMLInputElement> }) {
  return <input ref={ref} {...rest} />; // "gắn" ref "xuống" "DOM "thật"
}
// "dùng": <MyInput ref={inputRef} /> (cha "gửi" ref, "con" "truyền" "xuống" "DOM")
