// example.tsx — component mẫu để test
import { useState } from 'react';

export function CounterView() {
  const [count, setCount] = useState(0);
  return (
    <div>
      <p>Giá trị: {count}</p>
      <button onClick={() => setCount((c) => c + 1)}>+</button>
    </div>
  );
}
