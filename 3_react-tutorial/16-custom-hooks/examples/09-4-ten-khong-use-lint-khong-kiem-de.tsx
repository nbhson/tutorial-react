// ❌ SAI: getStorage gọi useState — ai đó gọi trong if mà lint không báo
function getStorage(key: string) { const [v] = useState(...); return v; }
