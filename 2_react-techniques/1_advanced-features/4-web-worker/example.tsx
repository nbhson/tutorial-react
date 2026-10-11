import { useEffect, useState } from 'react';

export function WorkerDemo({ values }: { values: number[] }) {
  const [sum, setSum] = useState<number | null>(null);

  useEffect(() => {
    const worker = new Worker(
      new URL('./calc.worker.ts', import.meta.url),
      { type: 'module' },
    );
    worker.onmessage = (e: MessageEvent<number>) => setSum(e.data);
    worker.postMessage(values);
    return () => worker.terminate();
  }, [values]);

  return <p>Tổng (tính trong Worker): {sum ?? '…'}</p>;
}
