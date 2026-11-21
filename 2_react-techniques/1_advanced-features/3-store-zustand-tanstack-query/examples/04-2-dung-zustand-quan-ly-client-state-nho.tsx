// ❌ SAI: subscribe cả store — bất kỳ field nào đổi cũng re-render
const { sidebarOpen, toggle } = useUi(); // không selector → render theo mọi update

// ✅ ĐÚNG: selector hẹp từng field
const sidebarOpen = useUi((s) => s.sidebarOpen);
const toggle = useUi((s) => s.toggle);
