// Nhiều nhánh: object map sạch hơn switch/ternary lồng
const label = { admin: "Quản trị", user: "Thành viên" }[role] ?? "Khách";
// Hoặc early return từng nhánh ở đầu hàm — mỗi return một ý, không lồng sâu
if (role === "admin") return <AdminPanel />;
if (role === "user") return <UserPanel />;
return <GuestPanel />;
