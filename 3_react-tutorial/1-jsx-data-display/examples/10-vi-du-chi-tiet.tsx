// Attribute binding (giống [src], [alt]): mọi thuộc tính nhận {} thay vì ngoặc vuông
<img src={user.avatarUrl} alt={user.name} width={120} />

// Conditional text (giống ternary trong template Angular)
<p>{user.age >= 18 ? "Người lớn" : "Vị thành niên"}</p>

// Class/style động — className là chuỗi, style là object camelCase
<div className={isActive ? "active" : ""} style={{ color: "red", backgroundColor: "#fff" }} />

// Label/input liên kết: htmlFor thay vì for (vì for là keyword JS)
<label htmlFor="email">Email</label>
<input id="email" onKeyDown={(e) => { if (e.key === "Enter") submit(); }} />
