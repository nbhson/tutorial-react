// ❌ SAI: Card mang prop cầu nối — muốn dùng Card ở chỗ khác phải mang theme theo
function Card({ theme, children }: any) { return <section data-theme={theme}>{children}</section>; }
// ✅ ĐÚNG: Card chỉ nhận children — theme do CardTitle đọc trực tiếp từ context
