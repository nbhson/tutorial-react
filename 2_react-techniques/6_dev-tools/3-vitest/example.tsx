import { useState } from 'react';

// Component mẫu để test (xem file test trong README)
export function CounterView() {
  const [count, setCount] = useState(0);
  return (
    <div>
      <p>Giá trị: {count}</p>
      <button onClick={() => setCount((c) => c + 1)}>+</button>
    </div>
  );
}
