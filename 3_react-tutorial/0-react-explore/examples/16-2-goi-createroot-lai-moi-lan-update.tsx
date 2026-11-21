// ✅ ĐÚNG: gọi 1 lần lúc khởi động, update đi qua state
// main.tsx: createRoot(...).render(<App />) — xong, không đụng nữa
function Counter() {
  const [n, setN] = useState(0); // setN là cách duy nhất yêu cầu vẽ lại
  return <button onClick={() => setN(n + 1)}>{n}</button>;
}
