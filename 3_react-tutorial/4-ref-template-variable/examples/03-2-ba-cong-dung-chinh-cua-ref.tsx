// example.tsx: giữ id interval để cleanup
idRef.current = window.setInterval(() => setTick((t) => t + 1), 1000);
return () => clearInterval(idRef.current); // cleanup đối xứng setup
