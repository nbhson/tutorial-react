// CounterButton trong example.tsx: event prop với payload number
type CounterButtonProps = { step?: number; onAdd: (step: number) => void };

function CounterButton({ step = 1, onAdd }: CounterButtonProps) {
  // Bọc arrow để truyền payload khi click — khác onClick={onAdd(step)} gọi ngay lúc render
  return <button onClick={() => onAdd(step)}>+{step}</button>;
}
// Cha: <CounterButton step={5} onAdd={(step) => setCount((c) => c + step)} />
