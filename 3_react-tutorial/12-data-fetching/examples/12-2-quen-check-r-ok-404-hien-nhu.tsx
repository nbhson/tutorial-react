// ✅ ĐÚNG: throw khi !ok để catch/isError bắt
fetch(url).then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); }).then(setData);
