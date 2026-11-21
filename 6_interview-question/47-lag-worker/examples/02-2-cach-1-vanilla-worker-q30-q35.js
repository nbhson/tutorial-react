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
