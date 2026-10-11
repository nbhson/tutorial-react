# Web Worker trong React

> Nguồn: https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API — https://vite.dev/guide/features.html#web-workers

## Mục tiêu
- Đẩy tính toán nặng (mã hóa, parse CSV/Excel, xử lý ảnh, hash, sort 100k phần tử) ra khỏi main thread.
- Giữ UI mượt: thao tác nặng không block scroll, click, input.
- Tận dụng cú pháp tạo worker của Vite + dọn dẹp tài nguyên đúng cách.

## Tổng quan
JavaScript chạy đơn luồng trên **main thread** — nơi React cũng render. Một vòng lặp nặng 500ms sẽ đóng băng toàn bộ trang (jank, click chết, animation giật). **Web Worker** là thread phụ chạy song song: main thread gửi dữ liệu qua `postMessage`, worker tính toán và gửi kết quả về qua `onmessage`; UI không bao giờ bị block. Áp dụng khi: tác vụ > ~16ms (một frame) và lặp lại, xử lý dữ liệu lớn phía client, hoặc tác vụ nền (polling, sinh hash) cần chạy kể cả khi tab khác đang bận.

## Khái niệm cốt lõi
- **Main ↔ Worker qua message**: chỉ giao tiếp được qua `postMessage` (sao chép cấu trúc — **structured clone**) và event `message`. Dữ liệu đi qua là *bản sao*, không phải tham chiếu — sửa trong worker không đổi dữ liệu gốc.
- **Transferable objects**: `ArrayBuffer`, `MessagePort`, `OffscreenCanvas` có thể **chuyển quyền sở hữu** thay vì clone: đưa `transfer: [buffer]` trong `postMessage` → không tốn thời gian copy (quan trọng với ảnh/dữ liệu MB). Sau khi transfer, buffer ở phía gửi bị "detached" (không dùng được nữa).
- **Vite worker**: `new Worker(new URL('./calc.worker.ts', import.meta.url), { type: 'module' })` — Vite biên dịch tệp đó thành bundle riêng và nạp như ES module; có cả import syntax `import CalcWorker from './calc.worker?worker'` nếu muốn dạng class.
- **Worker không có DOM**: không truy cập `document`, `window`; muốn đổi DOM phải gửi kết quả về main thread.
- **Comlink**: thư viện bọc message tốn công thành proxy — gọi hàm trong worker như async function (`import * as calc from './calc'; await calc.sum(xs)`), giảm ~80% boilerplate.
- **Thread pool nâng cao**: với tác vụ chunk lớn (hash, codec), một worker đơn có thể là nút thắt — cân nhắc **pool**: nhiều worker, main thread chia dữ liệu thành từng phần và gom kết quả (`Promise.all`). Đổi lại phức tạp hơn: quản lý lifecycle, thứ tự kết quả, backpressure.
- **Error handling**: lỗi trong worker *không* tự lan ra main thread — phải tự `postMessage({ type: 'error', message })` hoặc lắng nghe `worker.onerror`; ở front màn hình, đừng để lỗi im lặng.

## Luồng hoạt động / Cách áp dụng
1. Viết tệp worker: `self.onmessage = (e) => { …; self.postMessage(result) }`.
2. Trong component/hook: `new Worker(new URL('./x.worker.ts', import.meta.url), { type: 'module' })`.
3. Đăng ký `worker.onmessage` để nhận kết quả; gửi input bằng `worker.postMessage(data)`.
4. Dọn dẹp: `worker.terminate()` trong cleanup của `useEffect` (hoặc `onUnmount`), tránh worker tồn tại vô chủ.
5. Dữ liệu lớn → `transfer: [buffer]` và sửa `copyWithin`/`slice` phù hợp với "detach".

## Ví dụ chi tiết
```ts
// calc.worker.ts — chạy ở thread riêng, không có DOM
self.onmessage = (e: MessageEvent<number[]>) => {
  // e.data là bản clone của mảng gửi từ main thread
  const sum = e.data.reduce((a, b) => a + b, 0); // tính toán nặng giả định
  self.postMessage(sum); // gửi kết quả về main thread
};
```

```tsx
// WorkerDemo: nhận tổng nhưng UI không bị đơ khi worker chạy
import { useEffect, useState } from 'react';

export function WorkerDemo({ values }: { values: number[] }) {
  const [sum, setSum] = useState<number | null>(null); // kết quả từ worker

  useEffect(() => {
    // Vite hiểu cú pháp này: bundle riêng cho worker, type module
    const worker = new Worker(
      new URL('./calc.worker.ts', import.meta.url),
      { type: 'module' },
    );
    // nhận kết quả: chạy lại render với giá trị mới
    worker.onmessage = (e: MessageEvent<number>) => setSum(e.data);
    worker.postMessage(values); // gửi dữ liệu đi tính
    return () => worker.terminate(); // dừng worker khi unmount
  }, [values]); // chỉ tạo lại worker khi mảng values thay đổi

  return <p>Tổng (tính trong Worker): {sum ?? '…'}</p>;
}
```

## Giải thích từng phần
- `useEffect` + `[values]` là "nơi sinh worker": mỗi lần `values` đổi, effect chạy lại, tạo worker mới, gửi dữ liệu mới; worker cũ bị terminate.
- `worker.onmessage` gọi `setSum` → React re-render khi kết quả về; state `sum` ban đầu `null` hiển thị "…".
- `type: 'module'` cho phép worker dùng `import` chuẩn — Vite bundling chính xác theo dependency.
- `worker.terminate()` ở cleanup là bắt buộc: nếu thiếu, worker (và thread của nó) sẽ treo vô thời hạn mỗi lần effect chạy lại — leak bộ nhớ lặng lẽ.
- Toàn bộ flow nằm ở *nền*: dù `sum` xử lý 1 triệu phần tử, main thread vẫn phản ứng click/input vì vòng lặp nằm trong thread worker.

## So sánh (nếu có)
- **Main thread tính trực tiếp vs Web Worker**: trực tiếp đơn giản nhưng block UI trên tác vụ lớn; worker phức tạp hơn một chút (message, dọn dẹp) nhưng UI tách bạch hoàn toàn. Nguyên tắc *"message passing giống cái giá: đắt hơn, nhưng không bao giờ treo alt-tab/scroll"*.
- **Web Worker vs Service Worker**: Worker = tính toán song song cho trang đang mở; Service Worker = proxy mạng/cache chạy nền ngay cả khi tab đóng (bài PWA). Hai loại khác nhiệm vụ, không thay thế nhau.
- **`postMessage` thủ công vs Comlink**: thủ công cho phép tinh chỉnh tối đa và performance; Comlink cho code ngắn như async function — chọn Comlink khi có nhiều hàm/table nhiều tham số, chọn tay khi hot-path cần gọn (dùng `transfer`).

## Lỗi thường gặp / Chống chỉ định
- **Quên `terminate`** → worker mới chồng lên worker cũ mỗi lần effect chạy, thread tiêu tốn tài nguyên. Fix: luôn return cleanup; hoặc tạo 1 worker duy nhất với `useRef` (persistent) thay vì tạo lại.
- **Worker chạm DOM** → lỗi "document is not defined". Fix: worker chỉ tính toán & trả kết quả; mọi thao tác UI ở main thread.
- **Gửi dữ liệu lớn bằng clone thay vì `transfer`** → UI vẫn giật vì chi phí copy MB dữ liệu nằm trên main thread. Fix: dùng `postMessage(data, [buffer])`.
- **Chạy tác vụ quá nhỏ trong worker** — chi phí tạo thread + clone message > lợi ích (đo bằng performance.now). Chống chỉ định: sort 100 phần tử, tính tổng mảng 1000 số — chạy thẳng cho nhanh.
- **Lạm dụng "một worker trên một hàm"** → quá nhiều thread. Fix: gom nhóm tác vụ vào một worker, phân loại bằng `type`/`action` field trong message.

## Câu hỏi thường gặp
- **Khi nào KHÔNG nên dùng worker?** Khi tác vụ dưới vài chục ms hoặc chỉ clone dữ liệu nhỏ — chi phí tạo thread/message lớn hơn lợi ích.
- **Worker có truy cập DOM không?** Không. Worker chỉ tính toán; mọi thao tác DOM/React phải ở main thread sau khi nhận kết quả qua `onmessage`.
- **Gửi buffer/ảnh lớn thế nào cho nhanh?** Dùng `postMessage(data, [buffer])` để **transfer** quyền sở hữu (không copy); với ảnh xét `OffscreenCanvas` + `ImageBitmap` transferable.
- **Nhiều loại tác vụ thì một worker hay nhiều?** Một worker với protocol `{ type, payload }` gọn cho vài tác vụ; worker pool khi cần song song hóa dữ liệu lớn.
- **Worker có dùng được thư viện npm không?** Có — Vite bundle worker như module; nhưng hạn chế import lib nặng để worker tải nhanh.

## Ghi chú 2026
- Vite 7 hỗ trợ `new Worker(new URL(...), { type: 'module' })` và query `?worker&inline` cho worker nhỏ.
- Comlink 4.x vẫn là cách gọn nhất để gọi hàm worker như async; kết hợp TypeScript để giữ type xuyên thread.
- Có thể dùng `SharedArrayBuffer` (cần COOP/COEP) cho giao tiếp zero-copy khi thực sự cần hiệu năng cao.

## Best practices / Mẹo
- Dùng Comlink + `expose` trong worker nếu code có nhiều entrypoints chia sẻ.
- Giữ worker file **không import module khổng lồ** (chart lib) — chúng làm bundle worker nặng và tải chậm.
- Kết hợp **Web Worker + TanStack Query**: tác vụ nặng (ví dụ hash file trước khi upload) chạy trong worker, kết quả `setQueryData` vào cache.
- Kiểm tra bằng React DevTools Profiler / Performance tab: tác vụ chuyển từ "main thread long task" (đỏ) sang time trong worker.
- Với ảnh lớn, xét `OffscreenCanvas` + `transfer` để xử lý pixel không bao giờ làm giật scroll.
- Thống nhất **message protocol**: gửi object `{ type: 'sum', payload }` thay vì dữ liệu trần — worker trở thành trung tâm nhiều tác vụ, dễ mở rộng và log.
- Set `worker.onerror` trong production: báo lỗi worker (và retry 1 lần) thay vì kết quả "treo vô âm tín".
- Dùng `useWorker` custom hook tách biệt (như ví dụ): mỗi mount/param tạo worker đúng vòng đời, test bằng mock worker trong Vitest.
- Trả về **tiến độ** cho tác vụ dài (`postMessage({ type: 'progress', value })`) để UI hiện progress bar.
- Đo "main thread busy" trước/sau bằng `PerformanceObserver` longtask để chứng minh worker có tác dụng.
- Dùng `navigator.hardwareConcurrency` để chọn số worker trong pool phù hợp thiết bị.
- Với WASM nặng, compile trong worker (`WebAssembly.instantiateStreaming`) để không block UI.
- Chuẩn hoá cleanup: gỡ mọi listener gắn lên worker, không chỉ gọi `terminate()`.
- Việc chia nhỏ được thì gửi nhiều phần cho worker pool rồi gom bằng `Promise.all`.
- Không truyền closure/function qua `postMessage` (structured clone không hỗ trợ) — chỉ truyền plain data.
- Ghi log trong worker bằng `{ type: 'log' }` gửi về main thread để debug tập trung.
- Với file lớn, đọc `File`/`Blob` trong worker bằng `arrayBuffer()` thay vì trên main thread.
- Luôn đo `performance.now()` trước/sau khi chuyển tác vụ vào worker để có số liệu.
- Tránh tạo worker trong render — luôn tạo trong `useEffect`/hook để gắn đúng vòng đời.
- Với SSR, chỉ tạo worker sau khi mount (`useEffect`) vì `Worker` không tồn tại trên server.

## Bài tập nhỏ
Cải `WorkerDemo`: thay reduce thành hàm "đếm số nguyên tố nhỏ hơn N" chạy ~500ms trong worker; thêm nút "Chạy lại" tăng N dần. Vừa thực hiện vừa kéo scroll một danh sách dài — ghi nhận scroll mượt. Đo bằng Performance: không xuất hiện long task > 100ms. Sau đó chuyển sang Comlink để gọi hàm như async và so sánh độ dài code.

## Reference
- [Web Workers (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API)
- [Vite — Web Workers](https://vite.dev/guide/features.html#web-workers)
- [Comlink](https://github.com/GoogleChromeLabs/comlink)