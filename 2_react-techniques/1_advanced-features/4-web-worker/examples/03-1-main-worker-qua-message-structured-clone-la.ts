// ✅ ĐÚNG: protocol object { type, payload } — worker làm được nhiều việc, dễ log
self.onmessage = (e: MessageEvent<{ type: string; payload: number[] }>) => {
  if (e.data.type === 'sum') { // phân loại tác vụ bằng field type
    const sum = e.data.payload.reduce((a, b) => a + b, 0);
    self.postMessage({ type: 'sum:done', value: sum });
  }
};
