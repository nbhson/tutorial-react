// Khi user bấm nút mới chạy dòng này → trình duyệt mới fetch chunk heavy-chart.js
async function moBieuDo() {
  // import() trả về Promise chứa toàn bộ export của module
  const mod = await import('./HeavyChart'); // network request xảy ra ở đây
  return mod.HeavyChart; // lấy named export ra dùng
}
