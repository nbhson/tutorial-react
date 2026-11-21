// ---- core (thuần TS, không phụ thuộc React) ----
// Vì sao thuần: test không cần jsdom/fetch, tái dùng ở mọi nền tảng
export type Todo = { id: number; title: string; done: boolean }; // entity — object nghiệp vụ thuần

// port: core "yêu cầu" thế giới bên ngoài cung cấp — interface, không cài đặt
// Vì sao interface: core chỉ biết "cần list/toggle", không biết http hay mock
export interface TodoRepository {
  list(): Promise<Todo[]>;
  toggle(id: number): Promise<void>;
}

// use-case: nghiệp vụ "đếm todo chưa xong" — nhận repo qua tham số (DI thủ công)
// Vì sao currying: countOpenTodos(repo) tạo "use-case đã nạp adapter" dùng ở nhiều hook
export const countOpenTodos =
  (repo: TodoRepository) => async (): Promise<number> => {
    const todos = await repo.list(); // chỉ dùng interface, không biết là fetch/mock
    return todos.filter((t) => !t.done).length; // luật thuần về entity — dễ test
  };

// ---- adapter mock (dùng cho demo/test) ----
// memoryTodoRepo implement đúng TodoRepository — đổi nguồn không đụng core
// Vì sao 2 adapter: demo/preview/test chạy được không cần server
export const memoryTodoRepo: TodoRepository & { data: Todo[] } = {
  data: [
    { id: 1, title: 'Học hooks', done: true },
    { id: 2, title: 'Học hexagonal', done: false },
  ],
  async list() {
    return this.data; // giả lập đọc — adapter thật sẽ fetch /api/todos
  },
  async toggle(id: number) {
    const t = this.data.find((x) => x.id === id);
    if (t) t.done = !t.done; // cập nhật "database" giả — giữ hành vi giống kênh thật
  },
};

// ---- React: gọi use-case qua adapter ----
import { useEffect, useState } from 'react';

export function OpenTodoCount() {
  const [open, setOpen] = useState<number | null>(null); // kết quả use-case — null là "chưa về"
  useEffect(() => {
    // bơm memoryTodoRepo — production thay bằng httpTodoRepo, không sửa core/use-case
    countOpenTodos(memoryTodoRepo)().then(setOpen);
  }, []);
  return <p>Todo chưa xong: {open ?? '…'}</p>;
}
