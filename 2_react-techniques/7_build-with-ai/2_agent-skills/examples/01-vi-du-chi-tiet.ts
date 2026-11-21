// example.tsx — mirror đầy đủ, khớp từng dòng với file thật
// Checklist mà skill "react-developer" bắt agent kiểm tra trên mỗi component:
// Vì sao checklist ở code: agent đọc được + CI kiểm được — không nằm mỗi trong doc
export const reactDeveloperChecklist = [
  'Function component + props typed (không class, không defaultProps)',
  'Không mutate props/state (Compiler-safe)',
  'Fetch qua TanStack Query, client state qua Zustand',
  'Kèm test Vitest theo hành vi user',
  'Chạy tsc --noEmit + eslint trước khi xong',
] as const;
