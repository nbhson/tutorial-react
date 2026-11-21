// Prod thật (example dùng Promise.resolve để demo không cần file thật):
const HeavyChart = lazy(() => import("./HeavyChart"));
// Build: index.js (App + nút) + HeavyChart-[hash].js (chart lib nặng)
// Chưa bấm "Mở" là chưa tải chart lib — mở lần đầu mới tải, lần sau dùng cache
