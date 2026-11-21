// Angular: {{ total | currency:"VND":"symbol":"1.0-0":"vi" }}
// React: gọi hàm — không cú pháp mới, không decorator, test như hàm thường
const fmtVND = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" });
<p>Tổng: {fmtVND.format(total)}</p> // "254.000 ₫" — đúng locale Việt
// Gọn hơn: export const vnd = (n: number) => fmtVND.format(n); <p>{vnd(total)}</p>
