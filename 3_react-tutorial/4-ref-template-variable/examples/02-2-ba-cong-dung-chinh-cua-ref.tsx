// example.tsx: focus khi bấm nút
const inputRef = useRef<HTMLInputElement>(null); // generic chỉ rõ giữ node gì
<input ref={inputRef} placeholder="Nhập tên..." />
<button onClick={() => inputRef.current?.focus()}>Focus</button>
// ?. vì render đầu ref là null (DOM chưa dựng), bấm sớm không crash
