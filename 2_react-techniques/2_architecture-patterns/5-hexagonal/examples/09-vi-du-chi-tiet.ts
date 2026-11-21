// httpTodoRepo — adapter production (file cần thêm: adapters/httpTodoRepo.ts)
export const httpTodoRepo: TodoRepository = {
  async list() {
    const r = await fetch('/api/todos'); // kênh thật — core không biết dòng này tồn tại
    if (!r.ok) throw new Error('Tải todos lỗi');
    return r.json();
  },
  async toggle(id: number) {
    await fetch(`/api/todos/${id}/toggle`, { method: 'POST' });
  },
};
