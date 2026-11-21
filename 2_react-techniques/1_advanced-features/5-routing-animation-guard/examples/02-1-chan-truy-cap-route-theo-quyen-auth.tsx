// ❌ SAI: guard trong useEffect trễ — page hiện rồi mới đá
function Admin() {
  useEffect(() => { if (!isAdmin) navigate('/403'); }, []); // user thấy nội dung 1-2 frame
  return <BangQuanTri />; // đã render, đã fetch data nhạy cảm
}
// ✅ ĐÚNG: guard ở loader hoặc render đầu (xem RequireRole ở Ví dụ chi tiết)
