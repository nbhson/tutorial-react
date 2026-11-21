// ✅ ĐÚNG: core chỉ biết interface — không biết fetch hay mock
export const countOpenTodos = (repo: TodoRepository) => async (): Promise<number> => {
  const todos = await repo.list(); // chỉ dùng port, không biết kênh nào
  return todos.filter((t) => !t.done).length; // luật thuần về entity
};
