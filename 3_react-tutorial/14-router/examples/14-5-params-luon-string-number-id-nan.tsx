// ✅ ĐÚNG: validate + fallback (như UserPage trong ví dụ)
const numId = Number(id); if (!id || Number.isNaN(numId)) return <p>User id không hợp lệ.</p>;
