# Web Worker trong React

> Nguồn: https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API — https://vite.dev/guide/features.html#web-workers

## Mục tiêu

### 1. Đẩy tính toán nặng (mã hóa, parse CSV/Excel, xử lý ảnh, hash, sort 100k phần tử) ra khỏi main thread

**Vì sao:** JavaScript chạy đơn luồng trên main thread — nơi React render, xử lý click, scroll, animation. Một vòng lặp 500ms (sort 100k dòng, parse CSV 5MB, hash file) đóng băng toàn bộ trang: scroll giật, nút bấm không phản hồi, animation đứng hình. Đo bằng Performance tab sẽ thấy một "long task" đỏ chót. Web Worker là thread phụ chạy song song, gánh phần nặng để main thread rảnh đón input.

**Cơ chế:** main thread gửi dữ liệu qua `worker.postMessage(data)`, worker tính trong thread riêng rồi `postMessage(kết quả)` về. Hai thread không chia sẻ bộ nhớ (trừ `SharedArrayBuffer` đặc biệt), chỉ trao đổi bản sao qua structured clone. Nhờ vậy vòng lặp triệu phần tử trong worker không ảnh hưởng một frame nào của UI.

**Code minh họa (comment tiếng Việt):**

```ts
// calc.worker.ts — chạy ở thread riêng, không có DOM
self.onmessage = (e: MessageEvent<number[]>) => {
  // e.data là BẢN SAO của mảng gửi từ main thread (structured clone)
  const sum = e.data.reduce((a, b) => a + b, 0); // vòng lặp nặng nằm ở thread phụ
  self.postMessage(sum); // gửi kết quả về — main thread vẫn mượt trong lúc tính
};
```

**Sai thì sao:**

```ts
// ❌ SAI: tính trực tiếp trên main thread — UI đơ 500ms
function Sai({ values }: { values: number[] }) {
  const sum = values.reduce((a, b) => a + b, 0); // block render, scroll, click
  return <p>{sum}</p>;
}

// ✅ ĐÚNG: đẩy vào worker — UI phản hồi ngay, kết quả về sau
// (xem WorkerDemo đầy đủ ở mục Ví dụ chi tiết)
```

**Usecase thực tế + quy tắc nhận diện:** preview ảnh trước upload (resize 10 ảnh 4K), parse file Excel 20k dòng ở client, mã hóa AES trước khi gửi, đếm số nguyên tố, highlight code lớn. Quy tắc: tác vụ > ~16ms (một frame) và lặp lại, hoặc xử lý dữ liệu MB ở client, hoặc tác vụ nền (hash, polling) → worker. Tác vụ < vài chục ms (sort 100 phần tử) → chạy thẳng, chi phí tạo thread lớn hơn lợi ích.

### 2. Giữ UI mượt: thao tác nặng không block scroll, click, input

**Vì sao:** mượt không phải "tính nhanh hơn" mà là "không chặn input". Worker không làm CPU nhanh hơn, nó chỉ chuyển chỗ tính sang thread khác để main thread giữ 60fps. User kéo scroll trong lúc worker tính 1 triệu phần tử vẫn thấy danh sách trôi đều — đó là thành công.

**Cách đo:** mở Performance tab, bấm "Chạy" rồi kéo scroll. Không worker: long task đỏ > 200ms, FPS rớt. Có worker: main thread chỉ có task nhỏ (postMessage + setState), phần nặng nằm ở dòng "Worker" riêng.

### 3. Tận dụng cú pháp tạo worker của Vite + dọn dẹp tài nguyên đúng cách

**Vì sao:** tạo worker thủ công bằng `new Worker('/worker.js')` dễ sai đường dẫn sau build (hash, base path). Cú pháp `new Worker(new URL('./calc.worker.ts', import.meta.url), { type: 'module' })` để Vite biên dịch worker thành bundle riêng, hash đúng, hỗ trợ `import` ES module và TypeScript. Dọn dẹp (`terminate`) tránh thread treo vô chủ mỗi lần effect chạy lại — leak lặng lẽ mà DevTools khó thấy.

## Tổng quan

JavaScript chạy đơn luồng trên **main thread** — nơi React cũng render. Một vòng lặp nặng 500ms sẽ đóng băng toàn bộ trang (jank, click chết, animation giật). **Web Worker** là thread phụ chạy song song: main thread gửi dữ liệu qua `postMessage`, worker tính toán và gửi kết quả về qua `onmessage`; UI không bao giờ bị block.

Luồng cụ thể: component gọi `new Worker(...)` trong `useEffect`, đăng ký `worker.onmessage = (e) => setSum(e.data)` để nhận kết quả, gửi input bằng `worker.postMessage(values)`. Khi `values` đổi, effect cleanup gọi `worker.terminate()` dọn thread cũ rồi tạo thread mới. State `sum` ban đầu `null` hiện "…", khi worker trả về thì `setSum` kích re-render.

Áp dụng khi: tác vụ > ~16ms (một frame) và lặp lại, xử lý dữ liệu lớn phía client, hoặc tác vụ nền (polling, sinh hash) cần chạy kể cả khi tab khác đang bận. Không áp dụng cho tác vụ nhỏ (tổng mảng 1000 số), logic cần DOM (`document`, `window`), hay hàm cần closure/function (structured clone không truyền được function).

## Khái niệm cốt lõi

### 1. Main ↔ Worker qua message — structured clone là bản sao, không phải tham chiếu

**Vì sao:** hai thread không chia sẻ bộ nhớ nên không thể truyền reference. Mọi dữ liệu qua `postMessage` đều được structured clone: object, mảng, Date, Map/Set, Blob, ArrayBuffer đều sao chép sâu. Sửa trong worker không đổi dữ liệu gốc ở main — đây vừa là an toàn vừa là chi phí (clone 50MB tốn hàng trăm ms trên main thread).

**Cơ chế:** `worker.postMessage(values)` serialize ở phía gửi, deserialize ở phía nhận. Nhận ở worker qua `self.onmessage`, trả về qua `self.postMessage(result)`, nhận ở main qua `worker.onmessage`. Lỗi trong worker không tự lan ra main — phải tự `postMessage({ type: 'error' })` hoặc nghe `worker.onerror`.

**Code minh họa:**

```ts
// ✅ ĐÚNG: protocol object { type, payload } — worker làm được nhiều việc, dễ log
self.onmessage = (e: MessageEvent<{ type: string; payload: number[] }>) => {
  if (e.data.type === 'sum') { // phân loại tác vụ bằng field type
    const sum = e.data.payload.reduce((a, b) => a + b, 0);
    self.postMessage({ type: 'sum:done', value: sum });
  }
};
```

**Sai thì sao:**

```ts
// ❌ SAI: truyền function qua postMessage — structured clone ném DataCloneError
worker.postMessage({ fn: () => 1 }); // DataCloneError: () => 1 could not be cloned

// ✅ ĐÚNG: chỉ truyền plain data (object, mảng, string, số)
worker.postMessage({ type: 'sum', payload: [1, 2, 3] });
```

### 2. Transferable objects — chuyển quyền sở hữu thay vì copy

**Vì sao:** clone ảnh 20MB mỗi lần gửi khiến main thread vẫn giật dù đã dùng worker — lợi ích mất một nửa. Transferables (`ArrayBuffer`, `MessagePort`, `OffscreenCanvas`, `ImageBitmap`) cho phép chuyển quyền sở hữu: không copy byte nào, phía gửi bị "detached" (không dùng được nữa) nhưng tốc độ gần như tức thì.

**Cơ chế:** `worker.postMessage(buffer, [buffer])` — tham số thứ hai là danh sách transfer. Sau lệnh này, `buffer.byteLength` ở phía gửi thành 0. Worker nhận được buffer gốc và xử lý trực tiếp. Với ảnh dùng `OffscreenCanvas` + `transferControlToOffscreen()` để vẽ hoàn toàn trong worker.

```ts
// ✅ ĐÚNG: ảnh lớn dùng transfer — không copy MB dữ liệu trên main thread
const buffer = await file.arrayBuffer(); // đọc file thành ArrayBuffer
worker.postMessage({ type: 'hash', buf: buffer }, [buffer]); // chuyển quyền, không clone
// Lưu ý: sau dòng này buffer ở main đã detached — không đọc tiếp được
```

### 3. Vite worker — `new Worker(new URL(...), { type: 'module' })`

**Vì sao:** đường dẫn string thuần (`new Worker('/calc.js')`) vỡ sau build vì Vite hash tên file và đổi base. Cú pháp `new URL(..., import.meta.url)` để Vite phát hiện lúc build, biên dịch worker thành chunk riêng, viết lại URL đúng. `{ type: 'module' }` cho phép worker dùng `import`/`export` chuẩn thay vì script cổ điển.

**Hai cú pháp:**

```ts
// Cách 1 (khuyên dùng): URL + type module — rõ ràng, type-safe
const w = new Worker(new URL('./calc.worker.ts', import.meta.url), { type: 'module' });

// Cách 2: query ?worker — trả class, new không cần URL
import CalcWorker from './calc.worker?worker';
const w2 = new CalcWorker();
```

### 4. Worker không có DOM — muốn đổi UI phải gửi về main

**Vì sao:** worker chạy trong scope riêng không có `document`, `window`, `localStorage` đầy đủ. Cố chạm DOM sẽ ném `document is not defined`. Thiết kế đúng là worker thuần tính toán, main thuần render.

```ts
// ❌ SAI trong worker: chạm DOM — lỗi ngay
self.onmessage = () => { document.querySelector('p')!.textContent = 'x'; };
// ✅ ĐÚNG: worker chỉ tính, gửi về main render
self.onmessage = (e) => { self.postMessage(e.data.reduce((a: number, b: number) => a + b, 0)); };
```

### 5. Comlink — gọi hàm worker như async function

**Vì sao:** `postMessage` thủ công với 10 hàm sẽ thành rừng `if (type === ...)` hai phía. Comlink bọc message thành proxy: `await calc.sum(xs)` ở main tự chuyển thành message, chờ worker trả về. Giảm ~80% boilerplate khi worker có nhiều entrypoint.

```ts
// worker: expose object hàm
import { expose } from 'comlink';
expose({ sum: (xs: number[]) => xs.reduce((a, b) => a + b, 0) });
// main: gọi như hàm async bình thường
import { wrap } from 'comlink';
const calc = wrap<any>(worker);
const tong = await calc.sum([1, 2, 3]); // thực chất là postMessage + chờ reply
```

### 6. Thread pool — khi một worker thành nút thắt

**Vì sao:** hash 1GB bằng một worker vẫn mất hàng giây. Chia thành 4 phần cho 4 worker chạy song song (`Promise.all`) gần như chia thời gian cho số core. Đổi lại phức tạp: chia dữ liệu, gom kết quả đúng thứ tự, backpressure khi worker quá tải, lifecycle 4 thread.

**Quy tắc:** dùng `navigator.hardwareConcurrency` để chọn số worker (thường 4–8). Một worker + protocol `{ type }` đủ cho vài tác vụ; pool chỉ khi dữ liệu chia được (chunk hash, tile ảnh, shard sort).

### 7. Error handling — lỗi worker không tự lan ra main

Lỗi throw trong worker không reject promise ở main, không hiện React ErrorBoundary. Phải tự `postMessage({ type: 'error', message })` hoặc `worker.onerror = (e) => ...` ở main để hiện "Tính lỗi — Thử lại" thay vì treo "…" vô âm tín. Production luôn `set worker.onerror` + retry 1 lần.

## Luồng hoạt động / Cách áp dụng

### Bước 1. Viết tệp worker: `self.onmessage = (e) => { …; self.postMessage(result) }`

File `calc.worker.ts` cạnh component. Không import thư viện khổng lồ (chart lib) vào worker — bundle worker nặng thì tải worker cũng chậm. Dùng protocol `{ type, payload }` ngay từ đầu để sau thêm tác vụ không phải sửa contract.

### Bước 2. Trong component/hook: `new Worker(new URL(...), { type: 'module' })` trong `useEffect`

Luôn tạo trong `useEffect`/hook, không tạo trong render (mỗi render một thread mới). Với SSR, chỉ tạo sau mount vì `Worker` không tồn tại trên server.

### Bước 3. Đăng ký `onmessage` nhận kết quả; `postMessage` gửi input

Gán `onmessage` trước `postMessage` để không sót reply về sớm. Với tác vụ dài, worker bắn thêm `{ type: 'progress', value }` để UI hiện progress bar.

### Bước 4. Dọn dẹp: `worker.terminate()` trong cleanup

Bắt buộc `return () => worker.terminate()`. Hoặc giữ một worker persistent bằng `useRef` (tạo một lần, dùng nhiều lần) thay vì tạo mới mỗi khi `values` đổi — tùy tần suất đổi.

### Bước 5. Dữ liệu lớn → `transfer` + xử lý "detach"

Đọc `File`/`Blob` bằng `arrayBuffer()` rồi transfer. Sau transfer không dùng buffer cũ nữa. Với pixel dùng `OffscreenCanvas` để không bao giờ copy ảnh qua main.

## Ví dụ chi tiết

Mirror 1-1 với `example.tsx` cùng thư mục (không rút gọn). Lưu ý `example.tsx` chỉ chứa phía React; khối `calc.worker.ts` là file bạn-cần-tạo cạnh nó (đã thể hiện trong README gốc và giữ nguyên ở đây):

```ts
// calc.worker.ts — chạy ở thread riêng, không có DOM
// File này cần tạo cạnh example.tsx (ví dụ: ./calc.worker.ts)
self.onmessage = (e: MessageEvent<number[]>) => {
  // e.data là bản clone của mảng gửi từ main thread (structured clone)
  // Sửa mảng này không ảnh hưởng mảng gốc ở main — an toàn nhưng tốn copy
  const sum = e.data.reduce((a, b) => a + b, 0); // tính toán nặng giả định (demo thay bằng đếm nguyên tố/hash)
  self.postMessage(sum); // gửi kết quả về main thread qua event message
};
```

```tsx
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
```

Nếu thiếu file worker, bổ sung `calc.worker.ts` như khối đầu — không thể chỉ có `example.tsx` mà thiếu nó vì `new URL('./calc.worker.ts')` sẽ 404 lúc runtime.

## Giải thích từng phần

### `useEffect` + `[values]` — "nơi sinh worker"

Mỗi lần `values` đổi tham chiếu, effect cleanup terminate worker cũ rồi tạo worker mới và gửi dữ liệu mới. Vì sao trong effect mà không trong render: render có thể chạy nhiều lần (StrictMode double-invoke, concurrent), tạo thread trong render sẽ sinh hàng loạt thread vô chủ. Effect đảm bảo 1 effect = 1 worker, cleanup rõ ràng. **Sai thì sao:** tạo trong render → mỗi render một thread, memory tăng vọt. Fix luôn tạo trong effect/hook.

### `worker.onmessage` gọi `setSum` — cầu nối worker → React

Worker không setState trực tiếp được; nó chỉ post message. `onmessage` ở main là nơi duy nhất biến message thành state React. `sum` ban đầu `null` hiện "…" để user biết đang tính, không tưởng trang chết.

### `type: 'module'` — worker dùng import chuẩn

Không có option này worker chạy dạng classic script, `import` sẽ lỗi cú pháp. Vite bundle worker như module nên dependency (`import {x} from './util'`) được resolve đúng. Giữ worker import nhẹ để bundle worker tải nhanh.

### `worker.terminate()` — bắt buộc, không phải tùy chọn

Thread worker sống độc lập với React: unmount component không tự giết thread. Thiếu cleanup, mỗi lần `values` đổi là một thread mới chồng lên thread cũ — CPU và RAM tăng lặng lẽ, Performance tab thấy nhiều dòng Worker treo. Với worker dùng lâu (pool, singleton), giữ trong `useRef` và terminate ở unmount cuối.

### Toàn bộ flow ở nền — main thread rảnh

Dù tính 1 triệu phần tử, vòng lặp nằm ở thread worker nên main vẫn xử lý click/input/scroll ở 60fps. Bằng chứng: Performance tab không còn long task đỏ ở main, thay vào đó là activity ở track Worker.

## So sánh (nếu có)

### Main thread trực tiếp vs Web Worker

Trực tiếp: đơn giản (một hàm, không message, không cleanup), nhưng block UI trên tác vụ lớn — nguyên tắc "message passing có giá nhưng không bao giờ treo scroll". Worker: thêm ~15 dòng (tạo, message, terminate) nhưng UI tách bạch hoàn toàn. Chọn trực tiếp cho tác vụ < vài chục ms; worker cho tác vụ lớn/lặp lại.

### Web Worker vs Service Worker

Worker = tính toán song song cho trang đang mở (có DOM mở mới sống). Service Worker = proxy mạng/cache chạy nền ngay cả khi tab đóng (offline, push). Hai loại khác nhiệm vụ, không thay thế nhau — bài PWA dùng Service Worker, bài này dùng Web Worker.

### postMessage thủ công vs Comlink

Thủ công: tinh chỉnh tối đa (transfer, progress, protocol), performance cao nhất, nhưng boilerplate theo số hàm. Comlink: code như async function, gọn khi nhiều hàm, nhưng khó can thiệp transfer/progress tinh vi và thêm dependency. Chọn Comlink khi ≥ 3 hàm chia sẻ; chọn tay cho hot-path cần gọn.

## Lỗi thường gặp / Chống chỉ định

### 1. Quên `terminate` → thread chồng thread

```tsx
// ❌ SAI: không cleanup — mỗi lần values đổi là một thread mới treo
useEffect(() => {
  const w = new Worker(new URL('./calc.worker.ts', import.meta.url), { type: 'module' });
  w.postMessage(values);
}, [values]);

// ✅ ĐÚNG: cleanup terminate + gán onmessage trước post
useEffect(() => {
  const w = new Worker(new URL('./calc.worker.ts', import.meta.url), { type: 'module' });
  w.onmessage = (e) => setSum(e.data);
  w.postMessage(values);
  return () => w.terminate();
}, [values]);
```

### 2. Worker chạm DOM → `document is not defined`

```ts
// ❌ SAI trong worker
self.onmessage = () => { document.body.innerHTML = 'x'; };
// ✅ ĐÚNG: worker trả data, main render
self.onmessage = (e) => self.postMessage(tinh(e.data));
```

### 3. Clone dữ liệu lớn thay vì transfer → vẫn giật

```ts
// ❌ SAI: clone 50MB — main vẫn tốn copy
worker.postMessage(bigArray);
// ✅ ĐÚNG: transfer buffer — không copy
worker.postMessage({ buf }, [buf]);
```

### 4. Tác vụ quá nhỏ mà cũng worker — chậm hơn

Đo `performance.now()`: tạo worker + clone message tốn ~5–20ms. Sort 100 phần tử tốn 0.1ms — đưa vào worker là lỗ. Ngưỡng thực dụng: > 16ms và lặp lại mới xứng đáng.

### 5. Một worker một hàm → quá nhiều thread

Gom vào một worker với `{ type }` phân loại. Pool nhiều worker chỉ khi chia được dữ liệu song song.

## Câu hỏi thường gặp

### Khi nào KHÔNG nên dùng worker?

Tác vụ dưới vài chục ms, logic cần DOM, cần closure/function, hoặc data quá nhỏ mà chi phí clone lớn hơn lợi ích. Đo `performance.now()` trước/sau để quyết định bằng số, không bằng cảm giác.

### Worker có truy cập DOM không?

Không. Mọi thao tác DOM/React ở main sau `onmessage`. Muốn vẽ pixel trong worker dùng `OffscreenCanvas` transfer, rồi hiện kết quả qua main.

### Gửi buffer/ảnh lớn thế nào cho nhanh?

`postMessage(data, [buffer])` để transfer quyền sở hữu; ảnh xét `OffscreenCanvas` + `ImageBitmap`. Sau transfer buffer cũ detached — thiết kế để không đọc tiếp.

### Một worker hay nhiều?

Một worker + protocol `{ type, payload }` cho vài tác vụ. Pool (`hardwareConcurrency` worker + `Promise.all`) khi cần song song hóa dữ liệu lớn có thể chia shard.

### Worker có dùng được thư viện npm không?

Có — Vite bundle worker như module nên `import` được. Nhưng giữ import nhẹ; lib nặng làm bundle worker to, tải worker chậm, mất nửa lợi ích.

## Ghi chú 2026

- **Vite 7 hỗ trợ `new Worker(new URL(...), { type: 'module' })` và `?worker&inline`:** worker nhỏ có thể inline base64 vào bundle chính để đỡ một request; worker lớn giữ file riêng để cache. Chọn theo kích thước worker bundle.

- **Comlink 4.x + TypeScript giữ type xuyên thread:** `wrap<typeof api>(worker)` cho autocomplete và check type ở main dù hàm chạy ở worker. Kết hợp `expose` phía worker để contract rõ ràng.

- **`SharedArrayBuffer` zero-copy (cần COOP/COEP):** hai thread đọc/ghi chung một vùng nhớ với `Atomics`, không clone không transfer. Mạnh nhất nhưng đòi hỏi header bảo mật (`Cross-Origin-Opener-Policy/Embedder-Policy`) và code đồng bộ cẩn thận — chỉ khi thực sự cần hiệu năng cao (audio, game, WASM).

## Best practices / Mẹo

### Dùng Comlink + expose khi nhiều entrypoint; giữ worker import nhẹ

Worker có 3+ hàm thì Comlink gọn hơn rừng `if type`. Dù dùng gì, không import chart lib vào worker — bundle worker phải nhỏ để tải nhanh.

### Kết hợp Worker + TanStack Query: hash trong worker, setQueryData vào cache

Ví dụ hash file trước upload chạy trong worker, xong `queryClient.setQueryData(['file', id], hash)` — UI đọc cache như bình thường, không biết hash chạy ở đâu.

### Thống nhất message protocol + worker.onerror + progress

Gửi `{ type, payload }` thay vì data trần để worker mở rộng được. Luôn `worker.onerror` để báo lỗi thay vì treo. Tác vụ dài bắn `{ type: 'progress' }` để hiện progress bar.

### Tách `useWorker` hook riêng; đo longtask trước/sau; không tạo worker trong render

Hook riêng giúp mỗi mount/param đúng vòng đời và test được bằng mock worker trong Vitest. Đo `PerformanceObserver('longtask')` để chứng minh worker có tác dụng bằng số. Luôn tạo trong effect, chỉ tạo sau mount để an toàn SSR.

### Pool theo hardwareConcurrency; WASM compile trong worker; log về main

Chia shard cho pool rồi `Promise.all` gom. WASM nặng `instantiateStreaming` trong worker để không block. Log trong worker gửi `{ type: 'log' }` về main để debug tập trung thay vì mở hai console.

## Bài tập nhỏ

1. Đổi `calc.worker.ts` thành đếm số nguyên tố nhỏ hơn N (~500ms): vòng lặp kiểm tra từng số, `postMessage` kết quả.
2. Thêm nút "Chạy lại" tăng N dần (100k → 200k → 500k). Vừa chạy vừa kéo scroll một danh sách dài — ghi nhận scroll vẫn mượt.
3. Mở Performance tab record lúc chạy: xác nhận không có long task > 100ms ở main, phần nặng nằm ở track Worker.
4. Chuyển sang Comlink (`expose`/`wrap`) để gọi `countPrimes(N)` như async, so sánh số dòng với bản `postMessage` thủ công. Đo `performance.now()` cả hai để thấy overhead Comlink không đáng kể.

## Reference

- [Web Workers (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API)
- [Vite — Web Workers](https://vite.dev/guide/features.html#web-workers)
- [Comlink](https://github.com/GoogleChromeLabs/comlink)
