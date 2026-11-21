// ✅ ĐÚNG: core thuần TS — không React, không fetch
export type Todo = { id: number; title: string; done: boolean }; // entity thuần
export const demMo = (todos: Todo[]) => todos.filter((t) => !t.done).length; // luật thuần, test không cần mock
