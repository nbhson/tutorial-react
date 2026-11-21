// Component chuẩn 2026: function + TypeScript type cho props.
// Type Props chính là "API contract": IDE gợi ý, TS chặn sai kiểu lúc compile.
type HelloProps = { name: string; age?: number };

function Hello({ name, age = 0 }: HelloProps) {
  // Mọi logic là JS thuần trên đầu hàm; câu lệnh return duy nhất trả JSX.
  const nextAge = age + 1; // derived value — tính mỗi render, không cần state
  return <p>Xin chào {name}, năm sau {nextAge} tuổi.</p>;
}
