// ❌ SAI trong worker: chạm DOM — lỗi ngay
self.onmessage = () => { document.querySelector('p')!.textContent = 'x'; };
// ✅ ĐÚNG: worker chỉ tính, gửi về main render
self.onmessage = (e) => { self.postMessage(e.data.reduce((a: number, b: number) => a + b, 0)); };
