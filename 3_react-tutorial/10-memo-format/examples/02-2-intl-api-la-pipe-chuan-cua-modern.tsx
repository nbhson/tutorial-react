// example.tsx + README dùng 3 instance điển hình — tạo 1 lần ở module scope:
const fmtVND = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" });
const fmtDate = new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium" }); // "11 thg 10, 2026"
const fmtRelative = new Intl.RelativeTimeFormat("vi-VN", { numeric: "auto" });

fmtVND.format(120000); // "120.000 ₫" — nghìn phân cách chấm, ký hiệu ₫ sau
fmtDate.format(new Date()); // theo locale vi
fmtRelative.format(-2, "day"); // "2 ngày trước" — tự chia số ít/nhiều theo locale
