// eslint-plugin-react-compiler: 'error'
// 3 pattern dưới đây lint sẽ báo — kèm cách sửa.

import { useRef, useState } from 'react';

// ❌ 1. Mutate prop trong render → lint: do not mutate
export function BadMutate({ tags }: { tags: string[] }) {
  // @ts-expect-error minh họa
  tags.sort(); // SỬA: [...tags].sort()
  return <p>{tags.join(', ')}</p>;
}

// ❌ 2. Hook có điều kiện → lint: hook called conditionally
export function BadHook({ enabled }: { enabled: boolean }) {
  const [count, setCount] = useState(0);
  // @ts-expect-error minh họa
  if (enabled) {
    // const [x] = useState(0); // SAI — hook trong if
  }
  return <button onClick={() => setCount(count + 1)}>Count {count}</button>;
}

// ❌ 3. Đọc ref.current trong render → lint: non-reactive read
export function BadRefRead() {
  const ref = useRef(0);
  // const label = ref.current > 0 ? 'dương' : 'không'; // SAI trong render
  // SỬA: đọc ref trong event/effect, render dùng state.
  return <button onClick={() => { ref.current += 1; }}>Tăng ref ({ref.current})</button>;
}

// ✅ Bản sửa gộp — lint pass, Compiler memoize được:
export function Good({ tags }: { tags: string[] }) {
  const sorted = [...tags].sort();
  const [count, setCount] = useState(0);
  return (
    <div>
      <p>{sorted.join(', ')}</p>
      <button onClick={() => setCount(count + 1)}>Count {count}</button>
    </div>
  );
}
