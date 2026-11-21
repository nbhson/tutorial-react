useEffect(() => {
  const ctrl = new AbortController();                       // (a) bộ hủy
  fetch(url, { signal: ctrl.signal })
    .then((r) => {                                          // (b) fetch KHÔNG reject HTTP lỗi
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json();
    })
    .then(setData)
    .catch((e: Error) => {                                  // (c) abort ≠ lỗi thật
      if (e.name !== "AbortError") setError(String(e));
    });
  return () => ctrl.abort();                                 // (d) cleanup khi unmount/url đổi
}, [url]);
