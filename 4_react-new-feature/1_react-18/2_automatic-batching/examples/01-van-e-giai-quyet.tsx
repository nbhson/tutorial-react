  // React 17 — batch: 1 render
  function onClick() { setA(1); setB(2); }
  // React 17 — KHÔNG batch: 2 render
  fetch('/api').then(() => { setA(1); setB(2); });
  setTimeout(() => { setA(1); setB(2); }, 0); // cũng 2 render
