// example.tsx Steps: đếm đúng cả 3 <span> + 1 string
const total = Children.count(children); // 4 — đúng dù có string lẫn element
// children.length ở đây sẽ crash hoặc sai vì children không phải mảng phẳng

// Map an toàn: callback nhận (child, index đã chuẩn hóa)
{Children.map(children, (child, i) => (
  <li>Bước {i + 1}/{total}: {child}</li>
))}
