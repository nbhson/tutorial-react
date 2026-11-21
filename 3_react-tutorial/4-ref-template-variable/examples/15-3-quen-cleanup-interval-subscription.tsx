// ❌ SAI: timer chạy mãi sau unmount — rò rỉ + setState trên unmounted
useEffect(() => { setInterval(() => setTick((t) => t + 1), 1000); }, []);
