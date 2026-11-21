// ✅ ĐÚNG: object map hoặc tách hàm render
const label = { admin: "Quản trị", user: "Thành viên" }[role] ?? "Khách";
return <div>{label}</div>;
// Hoặc: function renderByRole(role: string) { switch (role) { ... } }
