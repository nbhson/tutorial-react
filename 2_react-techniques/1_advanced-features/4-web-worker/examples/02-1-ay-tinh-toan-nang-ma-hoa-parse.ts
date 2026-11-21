// ❌ SAI: tính trực tiếp trên main thread — UI đơ 500ms
function Sai({ values }: { values: number[] }) {
  const sum = values.reduce((a, b) => a + b, 0); // block render, scroll, click
  return <p>{sum}</p>;
}

// ✅ ĐÚNG: đẩy vào worker — UI phản hồi ngay, kết quả về sau
// (xem WorkerDemo đầy đủ ở mục Ví dụ chi tiết)
