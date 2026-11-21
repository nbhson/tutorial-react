// ✅ ĐÚNG: ảnh lớn dùng transfer — không copy MB dữ liệu trên main thread
const buffer = await file.arrayBuffer(); // đọc file thành ArrayBuffer
worker.postMessage({ type: 'hash', buf: buffer }, [buffer]); // chuyển quyền, không clone
// Lưu ý: sau dòng này buffer ở main đã detached — không đọc tiếp được
