// ❌ SAI: pending mà early-return trắng — mất ý nghĩa giữ UI cũ
if (isPending) return <p>Đang tải…</p>; // chớp trắng mỗi lần chuyển
// ✅ ĐÚNG: phủ mờ list cũ, giữ thao tác
<div style={{ opacity: isPending ? 0.6 : 1 }}><List /></div>
