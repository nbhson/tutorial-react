// Helpers thay AngularJS filter — dùng Intl (chuẩn JS, không legacy).
function formatVND(n) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n);
}
function formatDate(d) {
  return new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }).format(d);
}
function formatNumber(n, digits) {
  return new Intl.NumberFormat("vi-VN", { minimumFractionDigits: digits || 0, maximumFractionDigits: digits || 0 }).format(n);
}

class FormatDemo extends React.Component {
  constructor(props) {
    super(props);
    this.state = { price: 1250000, date: new Date(2024, 4, 17), num: 1234567.891 };
  }
  render() {
    const s = this.state;
    return (
      <div style={{ textAlign: "center" }}>
        <h2 style={{ color: "green" }}>Format helpers (≈ filter)</h2>
        <p>currency: {formatVND(s.price)} <i>(↔ {"{{price | currency}}"})</i></p>
        <p>date: {formatDate(s.date)} <i>(↔ {"{{d | date}}"})</i></p>
        <p>number(2): {formatNumber(s.num, 2)} <i>(↔ {"{{n | number:2}}"})</i></p>
        <p>uppercase: {"geeks".toUpperCase()} <i>(↔ {"{{s | uppercase}}"})</i></p>
      </div>
    );
  }
}
