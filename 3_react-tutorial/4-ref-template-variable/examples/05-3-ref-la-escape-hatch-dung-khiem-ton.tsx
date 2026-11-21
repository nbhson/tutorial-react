// ✅ ĐÚNG: focus, đo kích thước, scroll — React không có declarative API tốt hơn
inputRef.current?.focus();
const h = node.getBoundingClientRect().height;

// ❌ SAI: dùng ref để đổi text hiển thị thay state — UI lệch, khó test
labelRef.current!.textContent = name; // nên <p>{name}</p> với state
