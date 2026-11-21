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
