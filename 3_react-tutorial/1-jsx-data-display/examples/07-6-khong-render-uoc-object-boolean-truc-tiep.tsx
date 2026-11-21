const user = { name: "Son" };
// ❌ SAI: render object — crash "Objects are not valid as a React child"
<p>{user}</p>
// ✅ ĐÚNG: chọn field
<p>{user.name}</p>

// Lợi dụng "bỏ qua": chỉ hiện khi đúng
{unread > 0 && <span>Bạn có {unread} tin nhắn</span>}
// unread = 0 -> biểu thức là false -> React bỏ qua, không vẽ gì
