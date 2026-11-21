// calc.worker.ts — chạy ở thread riêng, không có DOM
self.onmessage = (e: MessageEvent<number[]>) => {
  // e.data là BẢN SAO của mảng gửi từ main thread (structured clone)
  const sum = e.data.reduce((a, b) => a + b, 0); // vòng lặp nặng nằm ở thread phụ
  self.postMessage(sum); // gửi kết quả về — main thread vẫn mượt trong lúc tính
};
