// ❌ setTimeout đọc count "cũ":
useEffect(() => {
  setTimeout(() => console.log(count), 3000); // in 0 dù 3s sau đã bấm nhiều lần
}, [count]); // ← deps CHƯA đủ: không [count] thì effect không chạy lại → closure mãi count=0

// ✅ (a) deps đủ: effect chạy lại mỗi khi count đổi → closure MỚI (đọc giá trị hiện tại)
useEffect(() => {
  const id = setTimeout(() => console.log(count), 3000);
  return () => clearTimeout(id);
}, [count]);

// ✅ (b) functional: không cần closure "đúng", React cấp giá trị hiện tại
setTimeout(() => setCount((c) => c + 1), 3000); // c luôn = giá trị ở THỜI ĐIỂM CHẠY

// ✅ (c) useRef giữ "giá trị sống" (đọc mới mà không re-create effect):
const countRef = useRef(0);
// render: countRef.current = count;
// effect (deps []): setTimeout(() => console.log(countRef.current), 3000); // LUÔN đọc mới
