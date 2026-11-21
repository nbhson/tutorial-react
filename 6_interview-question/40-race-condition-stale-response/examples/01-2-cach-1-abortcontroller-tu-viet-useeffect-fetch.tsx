useEffect(() => {
  const controller = new AbortController();
  fetch(`/api/search?q=${query}`, { signal: controller.signal })
    .then(r => r.json())
    .then(setData)           // "chỉ response mới nhất" (request cũ đã abort)
    .catch(e => { if (e.name !== "AbortError") setError(e); });
  return () => controller.abort();  // "query đổi / unmount → abort request cũ"
}, [query]);
// "Query đổi (a → ab) → effect cleanup (abort resp-a) → resp-a 'không ghi state' → chỉ resp-abc ghi"
