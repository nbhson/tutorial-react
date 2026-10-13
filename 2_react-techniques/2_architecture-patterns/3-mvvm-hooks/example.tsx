import { useState } from 'react';

// ViewModel: toàn bộ state + logic của form counter có giới hạn
export function useCounterViewModel(max = 10) {
  const [count, setCount] = useState(0);
  return {
    count,
    canInc: count < max,
    canDec: count > 0,
    inc: () => setCount((c) => Math.min(c + 1, max)),
    dec: () => setCount((c) => Math.max(c - 1, 0)),
    reset: () => setCount(0),
  };
}

// View: chỉ render
export function CounterView() {
  const vm = useCounterViewModel(5);
  return (
    <div>
      <p>Giá trị: {vm.count}</p>
      <button onClick={vm.dec} disabled={!vm.canDec}>−</button>
      <button onClick={vm.inc} disabled={!vm.canInc}>+</button>
      <button onClick={vm.reset}>Reset</button>
    </div>
  );
}
