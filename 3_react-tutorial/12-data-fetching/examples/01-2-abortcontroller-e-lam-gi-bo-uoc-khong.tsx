useEffect(() => {
  const ctrl = new AbortController();
  fetch(url, { signal: ctrl.signal }).then(...).catch((e) => {
    if (e.name !== "AbortError") setError(String(e));
  });
  return () => ctrl.abort();
}, []);
