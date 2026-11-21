// ❌ SAI — list động dùng index làm key
type Todo = { id: number; text: string };
function TodoList({ todos }: { todos: Todo[] }) {
  return (
    <ul>
      {todos.map((t, i) => (
        <li key={i}>
          <input defaultValue={t.text} /> {/* state nội bộ của input */}
        </li>
      ))}
    </ul>
  );
}
