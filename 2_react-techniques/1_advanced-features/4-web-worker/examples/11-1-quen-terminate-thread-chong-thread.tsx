// ❌ SAI: không cleanup — mỗi lần values đổi là một thread mới treo
useEffect(() => {
  const w = new Worker(new URL('./calc.worker.ts', import.meta.url), { type: 'module' });
  w.postMessage(values);
}, [values]);

// ✅ ĐÚNG: cleanup terminate + gán onmessage trước post
useEffect(() => {
  const w = new Worker(new URL('./calc.worker.ts', import.meta.url), { type: 'module' });
  w.onmessage = (e) => setSum(e.data);
  w.postMessage(values);
  return () => w.terminate();
}, [values]);
