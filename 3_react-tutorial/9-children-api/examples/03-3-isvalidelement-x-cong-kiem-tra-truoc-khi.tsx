// example.tsx Steps có string child "Ghi chú chuỗi":
// - Steps (bọc): không cần isValidElement vì chỉ bọc ngoài, không đọc .props — string bọc được
// - TabsList (clone): BẮT BUỘC isValidElement vì đọc child.props.value — string bỏ qua
