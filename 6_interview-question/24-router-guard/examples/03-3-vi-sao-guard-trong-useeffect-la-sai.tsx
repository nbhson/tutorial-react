// ❌ SAI: page ĐÃ render + ĐÃ fetch rồi mới đá
function Admin() {
  useEffect(() => { if (!isAdmin) navigate("/403"); }, []); // 1–2 frame nội dung + data nhạy cảm đã bay về
  return <BangQuanTri />;
}

// ✅ ĐÚNG: quyết định ở render (RequireRole) hoặc trước render (loader)
