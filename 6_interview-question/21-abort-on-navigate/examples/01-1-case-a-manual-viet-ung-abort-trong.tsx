useEffect(() => {
  const ctrl = new AbortController();
  fetch(url, { signal: ctrl.signal })
    .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
    .then(setData)
    .catch((e: Error) => { if (e.name !== "AbortError") setError(String(e)); });
  return () => ctrl.abort();   // ← user navigate đi: cleanup chạy, request HỦY
}, [url]);
