// ✅ ĐÚNG: setup nào cleanup đó, cùng số lượng
useEffect(() => {
  window.addEventListener("resize", onResize);
  return () => window.removeEventListener("resize", onResize);
}, [onResize]); // onResize ổn định (Compiler/useCallback) hoặc EffectEvent để deps []
