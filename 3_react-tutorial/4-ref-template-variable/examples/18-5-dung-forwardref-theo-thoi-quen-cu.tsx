// ✅ ĐÚNG: nhận ref như prop thường
function New({ ref, ...rest }: { ref?: React.Ref<HTMLInputElement> } & React.InputHTMLAttributes<HTMLInputElement>) {
  return <input ref={ref} {...rest} />;
}
