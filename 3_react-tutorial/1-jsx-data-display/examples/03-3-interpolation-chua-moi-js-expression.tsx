const user = { name: "Son Nguyen", age: 30 };
// (1) Biến thuần — dòng này minh họa trong example.tsx
<h3>Your name: {name}</h3>
// (2) Phép toán ngay trong JSX — không cần biến trung gian
<p>Next year: {user.age + 1}</p>
// (3) Ternary — rẽ nhánh 2 nhánh ngay trong JSX (chi tiết DAY 2)
<p>{user.age >= 18 ? "Người lớn" : "Vị thành niên"}</p>
// (4) Gọi hàm format — đây chính là "pipe" của React (chi tiết DAY 10)
<p>{new Intl.NumberFormat("vi-VN").format(120000)}</p>
