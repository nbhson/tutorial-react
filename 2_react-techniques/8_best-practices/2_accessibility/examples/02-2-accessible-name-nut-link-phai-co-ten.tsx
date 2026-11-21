// ❌ SAI: icon câm — SR đọc "button" không biết làm gì
<button onClick={dong}><XIcon /></button>
// ✅ ĐÚNG: tên rõ + icon ẩn với AT (trang trí)
// (mirror CloseButton ở Ví dụ chi tiết)
<button type="button" aria-label="Đóng menu" onClick={dong}><XIcon aria-hidden /></button>
