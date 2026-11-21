// example.tsx dùng ternary cho 2 nhánh rỗng/có dữ liệu:
{pending.length === 0 ? (
  <li>Hoàn thành tất cả!</li> // nhánh rỗng — empty state rõ ràng
) : (
  pending.map((t) => <li key={t.id}>{t.text}</li>) // nhánh có dữ liệu
)}
