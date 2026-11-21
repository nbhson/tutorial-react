// ✅ ĐÚNG: deps nguyên thủy ổn định; object cần thì memo; handler mới nhất thì EffectEvent
const token = auth.token;
useEffect(() => { fetch(url, { headers: { token } }).then(setData); }, [url, token]);
