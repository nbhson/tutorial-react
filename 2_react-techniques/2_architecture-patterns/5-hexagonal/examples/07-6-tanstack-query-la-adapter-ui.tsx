// ✅ ĐÚNG: Query là lớp UI, use-case là lớp luật, adapter là lớp kênh
useQuery({ queryKey: ['todos', 'open-count'], queryFn: () => countOpenTodos(httpTodoRepo)() });
