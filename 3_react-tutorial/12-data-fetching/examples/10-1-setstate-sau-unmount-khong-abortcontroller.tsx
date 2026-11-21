// ✅ ĐÚNG: controller + cleanup (như example)
useEffect(() => {
  const ctrl = new AbortController();
  fetch(url, { signal: ctrl.signal }).then((r) => r.json()).then(setData)
    .catch((e) => { if (e.name !== "AbortError") setError(String(e)); });
  return () => ctrl.abort();
}, [url]);
