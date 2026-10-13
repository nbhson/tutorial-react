// ---- core (thuần TS, không phụ thuộc React) ----
export type Todo = { id: number; title: string; done: boolean };

export interface TodoRepository {
  list(): Promise<Todo[]>;
  toggle(id: number): Promise<void>;
}

export const countOpenTodos =
  (repo: TodoRepository) => async (): Promise<number> => {
    const todos = await repo.list();
    return todos.filter((t) => !t.done).length;
  };

// ---- adapter mock (dùng cho demo/test) ----
export const memoryTodoRepo: TodoRepository & { data: Todo[] } = {
  data: [
    { id: 1, title: 'Học hooks', done: true },
    { id: 2, title: 'Học hexagonal', done: false },
  ],
  async list() {
    return this.data;
  },
  async toggle(id: number) {
    const t = this.data.find((x) => x.id === id);
    if (t) t.done = !t.done;
  },
};

// ---- React: gọi use-case qua adapter ----
import { useEffect, useState } from 'react';

export function OpenTodoCount() {
  const [open, setOpen] = useState<number | null>(null);
  useEffect(() => {
    countOpenTodos(memoryTodoRepo)().then(setOpen);
  }, []);
  return <p>Todo chưa xong: {open ?? '…'}</p>;
}
