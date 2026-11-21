// ❌ SAI: clone 50MB — main vẫn tốn copy
worker.postMessage(bigArray);
// ✅ ĐÚNG: transfer buffer — không copy
worker.postMessage({ buf }, [buf]);
