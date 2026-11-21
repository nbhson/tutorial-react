// example.tsx — Automatic Batching (React 18)
import { useEffect, useState } from 'react';

let renderCount = 0; // module-scope: đếm tổng số lần render từ lúc mount

export default function BatchingDemo() {
  const [count, setCount] = useState(0);
  const [text, setText] = useState('idle');

  renderCount += 1; // mỗi lần render (kể cả re-render) là +1

  useEffect(() => {
    // Chạy sau mỗi commit — mở console để đếm số render.
    console.log(`[render #${renderCount}] count=${count}, text=${text}`);
  });

  function handleAsyncUpdate() {
    // React 18: cả 2 setState trong setTimeout cùng task → batch → 1 render.
    // React 17: 2 render riêng biệt.
    setTimeout(() => {
      setCount((c) => c + 1);
      setText('updated');
    }, 100);
  }

  function handlePromiseUpdate() {
    // Promise.then cũng được batch từ 18.
    Promise.resolve().then(() => {
      setCount((c) => c + 1);
      setText('from-promise');
    });
  }

  return (
    <div>
      <h2>Automatic Batching (React 18)</h2>
      <p>count={count}, text={text} — mỗi click chỉ log 1 render.</p>
      <button onClick={handleAsyncUpdate}>Update trong setTimeout</button>
      <button onClick={handlePromiseUpdate}>Update trong Promise</button>
    </div>
  );
}
