// ❌ SAI: opts mới mỗi render -> fetch mỗi render -> setData -> render -> loop
useEffect(() => { fetch(url, opts).then(setData); }, [opts]); // opts = { headers: {} } mới mỗi lần
