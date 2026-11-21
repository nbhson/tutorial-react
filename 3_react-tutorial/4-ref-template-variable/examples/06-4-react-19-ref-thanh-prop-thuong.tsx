// example.tsx minh họa chuẩn mới:
function MyInput({ ref, ...rest }: { ref?: React.Ref<HTMLInputElement> } & React.InputHTMLAttributes<HTMLInputElement>) {
  return <input ref={ref} {...rest} />; // gắn ref xuống DOM thật
}
// Dùng: <MyInput ref={inputRef} placeholder="..." />
// {...rest} là "mở đuôi": placeholder, disabled, className... truyền gì cũng xuống input
