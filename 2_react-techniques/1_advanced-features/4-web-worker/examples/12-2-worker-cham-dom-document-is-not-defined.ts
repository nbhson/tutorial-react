// ❌ SAI trong worker
self.onmessage = () => { document.body.innerHTML = 'x'; };
// ✅ ĐÚNG: worker trả data, main render
self.onmessage = (e) => self.postMessage(tinh(e.data));
