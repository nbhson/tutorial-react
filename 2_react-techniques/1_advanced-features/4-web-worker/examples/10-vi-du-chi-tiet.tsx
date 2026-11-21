// example.tsx — mirror đầy đủ, khớp từng dòng với file thật
import { useEffect, useState } from 'react';

export function WorkerDemo({ values }: { values: number[] }) {
  // sum là kết quả từ worker; null nghĩa là "chưa về" → hiện "…"
  const [sum, setSum] = useState<number | null>(null);

  useEffect(() => {
    // Vite hiểu cú pháp này: biên dịch calc.worker.ts thành bundle riêng, nạp như ES module
    // Vì sao trong effect: Worker chỉ tồn tại ở browser — tạo sau mount, an toàn SSR
    const worker = new Worker(
      new URL('./calc.worker.ts', import.meta.url),
      { type: 'module' }, // cho phép worker dùng import/export chuẩn
    );
    // nhận kết quả: worker postMessage về → setSum → React re-render với giá trị mới
    worker.onmessage = (e: MessageEvent<number>) => setSum(e.data);
    worker.postMessage(values); // gửi dữ liệu đi tính (structured clone sang thread phụ)
    return () => worker.terminate(); // dọn thread khi unmount/values đổi — thiếu là leak
  }, [values]); // chỉ tạo lại worker khi mảng values thay đổi (tham chiếu mới)

  return <p>Tổng (tính trong Worker): {sum ?? '…'}</p>;
}
