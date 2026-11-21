// example.tsx Effect #1: setup interval -> cleanup clear
useEffect(() => {
  const id = window.setInterval(() => setNow(new Date()), 1000);
  return () => clearInterval(id); // unmount hoặc (nếu có deps đổi) trước lần sau
}, []);
