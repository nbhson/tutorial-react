// ❌ SAI: render phải pure — mỗi render fetch/setTitle/lưu storage 1 lần, double 2 lần
function App({ userId }) { document.title = userId; fetch(url).then(setData); return <p>Hi</p>; }
