// Không có API batching — mặc định:
function handleAsync() {
  fetch('/x').then(() => { setA(1); setB(2); setC(3); }); // 1 render ở React 18
}

// Ép commit ngay (hiếm):
import { flushSync } from 'react-dom';
function measure() {
  flushSync(() => setCount(c => c + 1)); // DOM đã đổi, đọc được ngay
  console.log(el.getBoundingClientRect().height);
}
