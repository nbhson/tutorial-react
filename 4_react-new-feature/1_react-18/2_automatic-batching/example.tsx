import { useEffect, useState } from 'react';

let renderCount = 0;

export default function BatchingDemo() {
  const [count, setCount] = useState(0);
  const [text, setText] = useState('idle');

  renderCount += 1;

  useEffect(() => {
    console.log(`[render #${renderCount}] count=${count}, text=${text}`);
  });

  function handleAsyncUpdate() {
    // React 18: cả 2 setState trong setTimeout được batch → 1 render.
    // React 17: 2 render riêng biệt.
    setTimeout(() => {
      setCount((c) => c + 1);
      setText('updated');
    }, 100);
  }

  function handlePromiseUpdate() {
    Promise.resolve().then(() => {
      setCount((c) => c + 1);
      setText('from-promise');
    });
  }

  return (
    <div>
      <h2>Automatic Batching (React 18)</h2>
      <p>
        count={count}, text={text} — mở console, mỗi click chỉ log 1 render.
      </p>
      <button onClick={handleAsyncUpdate}>Update trong setTimeout</button>
      <button onClick={handlePromiseUpdate}>Update trong Promise</button>
    </div>
  );
}
