// ❌ SAI: quên replace — Back quay lại trang cấm, lại bị đá, kẹt vòng lặp
if (!ok) return <Navigate to="/403" />;
// ✅ ĐÚNG: replace để xóa entry cấm khỏi history
if (!ok) return <Navigate to="/403" replace />;
