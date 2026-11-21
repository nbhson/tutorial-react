// ✅ ĐÚNG: giữ StrictMode, sửa effect cho đúng (xem DAY 15)
createRoot(el).render(
  <StrictMode><App /></StrictMode>
);
// useEffect(() => { const id = setInterval(...); return () => clearInterval(id); }, []);
