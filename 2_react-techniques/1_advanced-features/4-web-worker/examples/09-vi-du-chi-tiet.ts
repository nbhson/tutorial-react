// calc.worker.ts — chạy ở thread riêng, không có DOM
// File này cần tạo cạnh example.tsx (ví dụ: ./calc.worker.ts)
self.onmessage = (e: MessageEvent<number[]>) => {
  // e.data là bản clone của mảng gửi từ main thread (structured clone)
  // Sửa mảng này không ảnh hưởng mảng gốc ở main — an toàn nhưng tốn copy
  const sum = e.data.reduce((a, b) => a + b, 0); // tính toán nặng giả định (demo thay bằng đếm nguyên tố/hash)
  self.postMessage(sum); // gửi kết quả về main thread qua event message
};
