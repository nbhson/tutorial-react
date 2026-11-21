// ❌ SAI: 404 vẫn .json() (có thể crash parse HTML lỗi) hoặc hiện rỗng như đúng
fetch(url).then((r) => r.json()).then(setData);
