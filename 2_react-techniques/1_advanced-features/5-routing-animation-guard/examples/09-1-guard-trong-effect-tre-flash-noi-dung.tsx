// ❌ SAI: effect chạy sau render — user thấy BangQuanTri 1-2 frame
function Admin() { useEffect(() => { if (!admin) nav('/403'); }, []); return <BangQuanTri />; }
// ✅ ĐÚNG: loader throw redirect + RequireRole ở render đầu
