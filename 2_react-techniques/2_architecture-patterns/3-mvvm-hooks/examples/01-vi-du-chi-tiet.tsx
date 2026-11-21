import { useState } from 'react';

// ---------- ViewModel: toàn bộ state + logic, không có JSX ----------
export function useCounterViewModel(max = 10) {
  const [count, setCount] = useState(0); // state duy nhất của màn hình

  return {
    count,                                  // giá trị hiển thị
    canInc: count < max,                    // dẫn xuất: có tăng được nữa không
    canDec: count > 0,                      // dẫn xuất: có giảm được không
    inc: () => setCount((c) => Math.min(c + 1, max)), // chặn trần max
    dec: () => setCount((c) => Math.max(c - 1, 0)),   // chặn sàn 0
    reset: () => setCount(0),               // reset về 0
  };
}

// ---------- View: chỉ render, mọi thứ khác qua vm ----------
export function CounterView() {
  const vm = useCounterViewModel(5); // viewmodel có tham số max = 5
  return (
    <div>
      <p>Giá trị: {vm.count}</p>              {/* đọc state từ vm */}
      <button onClick={vm.dec} disabled={!vm.canDec}>−</button>
      <button onClick={vm.inc} disabled={!vm.canInc}>+</button>
      <button onClick={vm.reset}>Reset</button>
    </div>
  );
}
