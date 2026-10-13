# Q47: Bấm nút mà UI khựng 200ms vì tính toán nặng, em đẩy ra khỏi main thread kiểu gì?

## Câu hỏi

> Nút bấm chạy hàm tính toán nặng (parse file 10MB, render biểu đồ, filter 100k items) → UI treo 200ms.
> Làm sao push việc nặng ra **Web Worker** (không block main thread (Q30)), kết quả trả về component React? `Worker` + `postMessage` (Q30) là chuẩn? `useWorker` (Q16) hay `useEffect` (Q27) + `Worker`?

## Trả lời ngắn (elevator pitch, 30 giây)
- **Vấn đề**: JS nặng chạy trên main thread sẽ block render/paint — UI khựng theo đúng thời gian tính toán.
- **Cách làm**: đẩy tính toán ra Web Worker (`new Worker` + `postMessage`/`onmessage`), kết quả về mới `setState`; trong lúc chờ giữ UI responsive (loading/disabled).
- **Khi nào dùng**: tác vụ trên ~50ms mà không cần DOM (parse file, filter list lớn, mã hóa). Không dùng khi cần chạm DOM (worker không có DOM) hoặc việc nhẹ hơn chi phí gửi message.

## Trả lời chi tiết

### 1. "JS nặng" (Q30) — vì sao (Q30, Q35)

```js
// ❌ (Q30, Q35) — (Q30, Q35) "parse (Q30) "trên main thread (Q30)
function parseFile(text) {
  const result = [];
  for (let i = 0; i < 100000; i++) {
    result.push(heavyComputation(text[i])); // (Q30, Q35) "Nặng (Q30) (Q30)
  }
  return result;
}
// (Q30, Q35) "UI treo (Q30, Q35) (Q30) — "JS (Q30) (Q30, Q35)
```

**Sai (Q30, Q35)**: **JS nặng trên main thread (Q30)** → **UI treo** (Q30, Q35) (Q30).

### 2. Cách 1: Vanilla `Worker` (Q30, Q35)

```js
// ✅ (Q30, Q35) — (Q30, Q35) "parse (Q30) "trong Worker (Q30, Q35)
// worker.js (Q30, Q35)
self.onmessage = (e) => {
  const { text } = e.data;
  const result = [];
  for (let i = 0; i < 100000; i++) {
    result.push(heavyComputation(text[i]));
  }
  self.postMessage(result); // (Q30, Q35) "Trả về (Q30)
};

// ✅ (Q30, Q35, Q10, Q27) — (Q30, Q35) "Component (Q10, Q27)
function HeavyCompute() {
  const [result, setResult] = useState(null);
  const workerRef = useRef(null);
  useEffect(() => {
    // (Q30, Q35) "Tạo Worker (Q30, Q35) (Q35)
    workerRef.current = new Worker(new URL("./worker.js", import.meta.url));
    workerRef.current.onmessage = (e) => {
      setResult(e.data); // (Q10) "Set state (Q10) (Q10)
    };
    return () => workerRef.current?.terminate(); // (Q30, Q35) "Dọn (Q30)
  }, []);
  // (Q30, Q35) "Gửi dữ liệu (Q30) (Q30)
  const compute = () => workerRef.current?.postMessage({ text: bigData });
  return (
    <>
      <button onClick={compute}>Compute</button>
      {result && <div>{JSON.stringify(result)}</div>}
    </>
  );
}
// (Q30, Q35) "Không block main thread (Q30) (Q30, Q35)
// (Q30) "JS nặng (Q30) (Q30, Q35)
```

**Đúng khi**: **1 tab (Q35), JS nặng (Q30)** (Q30, Q35). **Sai khi**: **Nhiều tab (Q35)** — "SharedWorker (Q35)" (Q35).

### 3. Cách 2: `useWorker` (Q16) (Q16, Q27)

```tsx
// ✅ (Q16, Q30) — (Q16, Q27) "useWorker (Q16) (Q16, Q27)
function useWorker(workerFactory: () => Worker, deps: unknown[]) {
  const workerRef = useRef<Worker | null>(null);
  const [result, setResult] = useState<unknown>(null);
  useEffect(() => {
    const w = workerFactory();
    workerRef.current = w;
    w.onmessage = (e) => setResult(e.data); // (Q10)
    return () => w.terminate(); // (Q30)
  }, deps); // (Q27) "Deps (Q27) (Q27)
  const post = (data: unknown) => workerRef.current?.postMessage(data); // (Q30)
  return { result, post, worker: workerRef };
}
// (Q16, Q30) "Dùng (Q16, Q27)
function HeavyCompute() {
  const { result, post } = useWorker(
    () => new Worker(new URL("./worker.js", import.meta.url)),
    []
  );
  return (
    <>
      <button onClick={() => post({ text: bigData })}>Compute</button>
      {result && <div>{JSON.stringify(result)}</div>}
    </>
  );
}
// (Q16) "Không (Q30, Q35) (Q30, Q35)
```

**Đúng khi**: **Nhiều component (Q16) dùng Worker (Q30)** (Q16, Q30). **Sai khi**: "1 component (Q10, Q30)" — "vanilla (Q30, Q35)" (Q30).

### 4. `Worker` vs `SharedWorker` (Q35) (Q35)

| | `Worker` (Q35) | `SharedWorker` (Q35) |
|---|---|---|
| **Chia sẻ (Q35)** | 1 (Q35) (tab (Q35)) | Nhiều (Q35) (tab (Q35)) (Q35) |
| **Khi nào dùng** | 1 tab (Q35) | Nhiều tab (Q35) (Q35) |
| **API (Q35)** | `postMessage` (Q30, Q35) | `onconnect` + `port.postMessage` (Q35) |
| **Độ phức tạp** | Đơn giản (Q30, Q35) | Phức tạp (Q35) |

**Điểm ăn điểm (Q35)**: "1 tab (Q35) → `Worker` (Q35) (Q35); "nhiều tab (Q35) → `SharedWorker` (Q35)" (Q35).

### 5. `Worker` vs `useMemo`/`useCallback` (Q16, Q30) (Q16)

| | `useMemo`/`useCallback` (Q16) | `Worker` (Q30, Q35) |
|---|---|---|
| **Đặt (Q16, Q30)** | JS nhẹ (Q16) (Q16, Q30) | JS nặng (Q30) (Q30) |
| **Main thread** | Yes (Q30) (Q16, Q30) | No (Q30) (Q30, Q35) |
| **UI treo** | Có (Q30) (Q30) | Không (Q30, Q35) (Q30, Q35) |
| **Khi nào** | < 50ms (Q16, Q30) | > 50ms (Q30) |

**Điểm ăn điểm (Q16, Q30)**: "JS nhẹ (< 50ms) → `useMemo` (Q16) (Q16, Q30); "JS nặng (> 50ms) → `Worker` (Q30, Q35) (Q30, Q35)".

## Bẫy khi phỏng vấn

1. **"JS nặng (Q30) trên main thread (Q30)"** → **Sai (Q30, Q35)**: "UI treo (Q30, Q35)" (Q30, Q35) — Worker (Q30, Q35) đúng (Q30, Q35).
2. **"`useMemo` (Q16) cho JS nặng (Q30)"** → **Sai (Q16, Q30)**: "`useMemo` (Q16) không (Q30) (Q16, Q30)" — Worker (Q30, Q35) đúng (Q30, Q35).
3. **"Không (Q30, Q35) Worker"** → **Sai (Q30, Q35)**: "`Worker` (Q30, Q35) = JS (Q30) (Q30, Q35)" (Q30, Q35).
4. **"Nhiều tab (Q35) dùng `Worker` (Q35)"** → **Sai (Q35)**: "`Worker` (Q35) = 1 tab (Q35)" (Q35) — "`SharedWorker` (Q35) = nhiều tab (Q35)" (Q35).

## Gợi ý câu chốt

> "Nút lag (Q30): "JS nặng (Q30) trên main thread (Q30)" (Q30, Q35). **2 cách (Q30, Q35)**: (1) **Vanilla `Worker` (Q30, Q35)** (Q35): `new Worker` + `postMessage` (Q30, Q35) + `onmessage` (Q10) (Q30, Q35) (Q30, Q35). (2) **`useWorker` (Q16)** (Q16, Q27): "hook (Q16, Q27) (Q16) quản lý (Q30, Q35)" (Q16, Q30). **JS nhẹ (< 50ms) → `useMemo` (Q16)** (Q16, Q30); **JS nặng (> 50ms) → `Worker` (Q30, Q35)** (Q30, Q35). **1 tab → `Worker` (Q35), nhiều tab → `SharedWorker` (Q35)** (Q35).

## Reference

- [`16-memo`](../16-memo/README.md) — "useMemo (Q16), JS nhẹ (Q16, Q30)"
- [`30-rerender-pipeline`](../30-rerender-pipeline/README.md) — "Main thread (Q30), re-render (Q30)"
- [`27-which-effect-when`](../27-which-effect-when/README.md) — "useEffect (Q27), deps (Q27)"
- [`35-type-safety`](../35-type-safety/README.md) — "Worker (Q35), type (Q35)"
- [`29-concurrency-transition-deferred`](../29-concurrency-transition-deferred/README.md) — "Transition (Q29), defer (Q29)"

## Câu hỏi liên quan

- **Hỏi tiếp (liên tục)**: [Q16 — Memo (useMemo (Q16), JS nhẹ (Q16, Q30)?](../16-memo/README.md) · [Q30 — Re-render pipeline (main thread (Q30), re-render (Q30)?](../30-rerender-pipeline/README.md)
- **Đào sâu (xuyên nhóm)**: [Q27 — useEffect (Q27), deps (Q27)?](../27-which-effect-when/README.md) · [Q35 — Type safety (Worker (Q35), type (Q35)?](../35-type-safety/README.md) · [Q29 — Concurrency (Transition (Q29), defer (Q29)?](../29-concurrency-transition-deferred/README.md)
