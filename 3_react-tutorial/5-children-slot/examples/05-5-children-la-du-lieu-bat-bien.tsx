// ❌ SAI: mutate children
children.push(<p>Mới</p>); // children có thể không phải mảng — crash

// ✅ ĐÚNG: bọc thêm (composition) hoặc dùng Children API
<Card>{children}<p>Thêm bằng bọc, không sửa gốc</p></Card>
// Hoặc DAY 9: Children.map(children, (c, i) => <li>Bước {i+1}: {c}</li>)
