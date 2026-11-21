// example.tsx là contract chuẩn — thiếu 1 trong 4 là bug:
useEffect(() => {
  const ctrl = new AbortController(); // (a) bộ hủy
  fetch(url, { signal: ctrl.signal })
    .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); }) // (b) check HTTP
    .then((json: User[]) => setData(json))
    .catch((e: Error) => { if (e.name !== "AbortError") setError(String(e.message)); }) // (c) bỏ qua hủy chủ đích
    .finally(() => setLoading(false));
  return () => ctrl.abort(); // (d) cleanup khi unmount/url đổi
}, [url]);
