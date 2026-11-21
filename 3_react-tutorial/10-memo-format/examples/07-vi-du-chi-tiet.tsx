const fmtDate = new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium" });
const fmtRelative = new Intl.RelativeTimeFormat("vi-VN", { numeric: "auto" });

fmtDate.format(new Date());     // "11 thg 10, 2026" — đúng locale, không nối chuỗi tay
fmtRelative.format(-2, "day");  // "2 ngày trước" — tự số ít/nhiều
