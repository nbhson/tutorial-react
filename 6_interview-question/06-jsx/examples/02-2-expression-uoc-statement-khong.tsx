const user = { name: "Son", age: 30 };

// ✅ 5 kiểu hợp lệ trong {}
<p>Biến: {name}</p>
<p>Phép toán: {user.age + 1}</p>
<p>Ternary: {user.age >= 18 ? "Người lớn" : "Vị thành niên"}</p>
<p>Gọi hàm (format): {new Intl.NumberFormat("vi-VN").format(120000)}</p>
<p>Template literal: {`Name: ${user.name}`}</p>

// ❌ SAI — statement không hợp lệ trong {}
<p>{if (user.age > 18) { return "lớn"; }}</p>   // if là statement
<p>{const x = 1; x}</p>                          // declaration là statement
<p>{for (let i = 0; i < 3; i++) { /* ... */ }}</p> // vòng lặp là statement
