// import() thủ công: tự quản state — linh hoạt nhưng dài hơn
function ThuCong() {
  const [Comp, setComp] = useState<React.ComponentType | null>(null);
  async function tai() {
    const m = await import('./HeavyChart'); // tự gọi lúc bấm
    setComp(() => m.HeavyChart); // tự lưu vào state
  }
  return <button onClick={tai}>Tải</button>;
}
