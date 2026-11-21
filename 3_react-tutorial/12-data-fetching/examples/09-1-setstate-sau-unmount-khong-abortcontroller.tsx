// ❌ SAI: unmount trước khi về -> warning + request thừa
useEffect(() => { fetch(url).then((r) => r.json()).then(setData); }, []);
