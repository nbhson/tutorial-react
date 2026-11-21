// ✅ ĐÚNG (React 19): con nhận ref và gắn vào DOM
function MyComp({ ref }: { ref?: React.Ref<HTMLInputElement> }) { return <input ref={ref} />; }
