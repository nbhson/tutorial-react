// Đừng làm thế này vì "thấy log 2 lần phiền":
createRoot(el).render(<App />); // bỏ StrictMode = che bug

// Hãy giữ thế này và sửa effect cho đúng:
createRoot(el).render(<StrictMode><App /></StrictMode>);
