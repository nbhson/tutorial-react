// ✅ ĐÚNG: selector hẹp — đổi sidebarOpen không re-render nút chỉ cần toggle
const toggle = useUi((s) => s.toggle); // hàm ổn định tham chiếu, không gây render thừa
