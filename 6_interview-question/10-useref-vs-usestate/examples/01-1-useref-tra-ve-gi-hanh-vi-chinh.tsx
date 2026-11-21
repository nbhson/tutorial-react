const inputRef = useRef<HTMLInputElement>(null); // tạo MỘT lần lúc mount
// render 1: inputRef.current = null (sau khi mount = DOM node thật)
// render 2: inputRef.current VẪN là object cũ — không tạo lại
inputRef.current?.focus(); // imperative, không qua state
