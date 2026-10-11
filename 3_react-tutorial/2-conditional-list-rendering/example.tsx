// example.tsx — DAY 2: conditional + list
type Todo = { id: number; text: string; done: boolean };

const TODOS: Todo[] = [
  { id: 1, text: "Hoc JSX", done: true },
  { id: 2, text: "Hoc hooks", done: false },
  { id: 3, text: "Build Vite app", done: false },
];

export default function App({ isLogin = true }: { isLogin?: boolean }) {
  if (!isLogin) return <p>Vui lòng đăng nhập.</p>;
  const pending = TODOS.filter((t) => !t.done);
  return (
    <ul>
      {pending.length === 0 ? (
        <li>Hoàn thành tất cả!</li>
      ) : (
        pending.map((t) => <li key={t.id}>{t.text}</li>)
      )}
    </ul>
  );
}
