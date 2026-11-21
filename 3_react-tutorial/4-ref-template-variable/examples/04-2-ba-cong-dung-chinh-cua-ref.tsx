// Pattern giữ giá trị trước đó để so sánh:
const prevRef = useRef(value);
useEffect(() => { prevRef.current = value; }); // cập nhật sau mỗi render
// Render: prevRef.current là giá trị render trước, value là hiện tại
