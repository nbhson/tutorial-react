// ✅ ĐÚNG: luôn return cleanup đối xứng
useEffect(() => {
  const id = window.setInterval(() => setTick((t) => t + 1), 1000);
  return () => clearInterval(id);
}, []);
