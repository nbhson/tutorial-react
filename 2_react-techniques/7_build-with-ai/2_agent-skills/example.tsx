// SKILL.md là markdown — file này demo checklist mà skill
// "react-developer" bắt agent kiểm tra trên mỗi component:
export const reactDeveloperChecklist = [
  'Function component + props typed (không class, không defaultProps)',
  'Không mutate props/state (Compiler-safe)',
  'Fetch qua TanStack Query, client state qua Zustand',
  'Kèm test Vitest theo hành vi user',
  'Chạy tsc --noEmit + eslint trước khi xong',
] as const;
