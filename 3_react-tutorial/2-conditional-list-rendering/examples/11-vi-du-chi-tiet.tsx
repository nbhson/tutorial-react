// 1) Chỉ hiện khi đúng: vế trái PHẢI là boolean (không phải số/chuỗi thô)
{unread > 0 && <span>Bạn có {unread} tin nhắn</span>}
// Vì sao > 0? Vì unread = 0 mà viết {unread && ...} sẽ in "0".

// 2) Nhiều nhánh: object map sạch hơn switch lồng trong JSX
const label = { admin: "Quản trị", user: "Thành viên" }[role] ?? "Khách";
// Vì sao object mà không switch? Vì switch là statement, không nhét được vào {}.

// 3) Trả về null khi không muốn render gì — vẫn mount nhưng không có DOM
if (!visible) return null;
