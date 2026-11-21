// example.tsx: tổng 3 số — demo cơ chế (thật ra rẻ, không cần memo; giữ để học):
const rows = [120000, 45000, 89000];
const total = useMemo(() => rows.reduce((a, b) => a + b, 0), [rows]);
// rows không đổi tham chiếu qua render -> trả tổng cache, không reduce lại
// rows là mảng tham chiếu: nếu cha tạo [120000, ...] mới mỗi render thì deps luôn khác -> cache miss luôn
