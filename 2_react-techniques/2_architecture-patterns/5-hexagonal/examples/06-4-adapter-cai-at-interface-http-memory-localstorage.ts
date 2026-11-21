// ✅ ĐÚNG: adapter http — implement đúng port, core không hay biết
export const httpTodoRepo: TodoRepository = {
  async list() { const r = await fetch('/api/todos'); return r.json(); },
  async toggle(id: number) { await fetch(`/api/todos/${id}/toggle`, { method: 'POST' }); },
};
